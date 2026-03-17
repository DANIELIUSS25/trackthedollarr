import { DatasetSeed, dataSources } from "../definitions/catalog";
import { AdapterSyncOptions, AdapterSyncResult, BaseSourceAdapter, DatasetSyncBundle } from "./base-adapter";
import { foreignAssistanceRowsSchema } from "../schemas/common";
import { endOfFiscalYearDate } from "../../../core/utils/date";
import { safeNumber } from "../../../core/utils/math";
import { UpstreamServiceError } from "../../../core/errors/app-error";

const sourceDefinition = dataSources.find((source) => source.slug === "foreign-assistance")!;

export class ForeignAssistanceAdapter extends BaseSourceAdapter {
  readonly sourceSlug = "foreign-assistance" as const;

  async sync(options: AdapterSyncOptions = {}): Promise<AdapterSyncResult> {
    const countryDataset = sourceDefinition.datasets.find((dataset) => dataset.slug === "foreign-assistance-country-summary");
    const sectorDataset = sourceDefinition.datasets.find((dataset) => dataset.slug === "foreign-assistance-sector-summary");

    if (!countryDataset || !sectorDataset) {
      throw new Error("Foreign assistance datasets are missing");
    }

    const countryBundle = await this.syncCountrySummary(countryDataset, options);
    const sectorBundle = await this.syncSectorSummary(sectorDataset, options);

    return {
      sourceSlug: this.sourceSlug,
      datasets: [countryBundle, sectorBundle],
      warnings: [...countryBundle.warnings, ...sectorBundle.warnings]
    };
  }

  private async syncCountrySummary(
    dataset: DatasetSeed,
    options: AdapterSyncOptions
  ): Promise<DatasetSyncBundle> {
    const datasetId = String(dataset.metadata?.datasetId ?? "k87i-9i5x");
    const shape = await this.discoverDatasetShape(datasetId);

    if (!shape.countryKey) {
      throw new UpstreamServiceError("Foreign assistance country dataset is missing a country-like field", {
        datasetId
      });
    }

    const query = new URLSearchParams({
      $select: [
        shape.fiscalYearKey,
        shape.transactionTypeKey,
        shape.countryKey,
        `sum(${shape.amountKey}) as aggregated_amount`
      ].join(","),
      $group: [shape.fiscalYearKey, shape.transactionTypeKey, shape.countryKey].join(","),
      $limit: "50000"
    });
    const sourceUrl = `${sourceDefinition.baseUrl}/resource/${datasetId}.json?${query.toString()}`;
    const rows = await this.http.getJson(sourceUrl, {
      sourceName: "Foreign Assistance",
      allowedHosts: ["data.usaid.gov"],
      responseSchema: foreignAssistanceRowsSchema
    });

    const grouped = new Map<number, { obligations: number; disbursements: number; countries: CountryBreakdownRow[] }>();

    for (const row of rows) {
      const fiscalYear = safeNumber(row[shape.fiscalYearKey]);
      const amount = safeNumber(row.aggregated_amount);
      const transactionType = String(row[shape.transactionTypeKey] ?? "");
      const country = String(row[shape.countryKey] ?? "Unknown");

      if (!fiscalYear || amount === null) {
        continue;
      }

      const entry = grouped.get(fiscalYear) ?? {
        obligations: 0,
        disbursements: 0,
        countries: []
      };
      const normalizedType = classifyTransactionType(transactionType);

      if (normalizedType === "obligation") {
        entry.obligations += amount;
      }

      if (normalizedType === "disbursement") {
        entry.disbursements += amount;
      }

      entry.countries.push({
        country,
        amount,
        transactionType: normalizedType
      });

      grouped.set(fiscalYear, entry);
    }

    const totalsObligationsSeries = dataset.series.find((series) => series.slug === "foreign-assistance-total-obligations");
    const totalsDisbursementsSeries = dataset.series.find((series) => series.slug === "foreign-assistance-total-disbursements");
    const breakdownSeries = dataset.series.find((series) => series.slug === "foreign-assistance-country-summary");
    const targetSeries = dataset.series.filter((series) =>
      options.seriesSlugs ? options.seriesSlugs.includes(series.slug) : true
    );

    return {
      datasetSlug: dataset.slug,
      series: [
        {
          seriesSlug: totalsObligationsSeries?.slug ?? "foreign-assistance-total-obligations",
          observations: [...grouped.entries()].map(([fiscalYear, entry]) => ({
            observedAt: endOfFiscalYearDate(fiscalYear),
            numericValue: entry.obligations,
            sourceObservationKey: `foreign-assistance-total-obligations:${fiscalYear}`,
            sourceUrl,
            sourceUnit: totalsObligationsSeries?.unit,
            sourceFrequency: totalsObligationsSeries?.frequency
          }))
        },
        {
          seriesSlug: totalsDisbursementsSeries?.slug ?? "foreign-assistance-total-disbursements",
          observations: [...grouped.entries()].map(([fiscalYear, entry]) => ({
            observedAt: endOfFiscalYearDate(fiscalYear),
            numericValue: entry.disbursements,
            sourceObservationKey: `foreign-assistance-total-disbursements:${fiscalYear}`,
            sourceUrl,
            sourceUnit: totalsDisbursementsSeries?.unit,
            sourceFrequency: totalsDisbursementsSeries?.frequency
          }))
        },
        {
          seriesSlug: breakdownSeries?.slug ?? "foreign-assistance-country-summary",
          observations: [...grouped.entries()].map(([fiscalYear, entry]) => ({
            observedAt: endOfFiscalYearDate(fiscalYear),
            jsonValue: {
              countries: entry.countries.sort((a, b) => b.amount - a.amount).slice(0, 250)
            },
            sourceObservationKey: `foreign-assistance-country-summary:${fiscalYear}`,
            sourceUrl,
            sourceUnit: "json",
            sourceFrequency: breakdownSeries?.frequency
          }))
        }
      ].filter((bundle) => targetSeries.some((series) => series.slug === bundle.seriesSlug)),
      warnings: []
    };
  }

  private async syncSectorSummary(
    dataset: DatasetSeed,
    options: AdapterSyncOptions
  ): Promise<DatasetSyncBundle> {
    const datasetId = String(dataset.metadata?.datasetId ?? "csuw-56ue");
    const shape = await this.discoverDatasetShape(datasetId);

    if (!shape.sectorKey) {
      throw new UpstreamServiceError("Foreign assistance sector dataset is missing a sector-like field", {
        datasetId
      });
    }

    const query = new URLSearchParams({
      $select: [
        shape.fiscalYearKey,
        shape.transactionTypeKey,
        shape.sectorKey,
        `sum(${shape.amountKey}) as aggregated_amount`
      ].join(","),
      $group: [shape.fiscalYearKey, shape.transactionTypeKey, shape.sectorKey].join(","),
      $limit: "50000"
    });
    const sourceUrl = `${sourceDefinition.baseUrl}/resource/${datasetId}.json?${query.toString()}`;
    const rows = await this.http.getJson(sourceUrl, {
      sourceName: "Foreign Assistance",
      allowedHosts: ["data.usaid.gov"],
      responseSchema: foreignAssistanceRowsSchema
    });

    const grouped = new Map<number, { obligations: number; disbursements: number; sectors: SectorBreakdownRow[] }>();

    for (const row of rows) {
      const fiscalYear = safeNumber(row[shape.fiscalYearKey]);
      const amount = safeNumber(row.aggregated_amount);
      const transactionType = String(row[shape.transactionTypeKey] ?? "");
      const sector = String(row[shape.sectorKey] ?? "");

      if (!fiscalYear || amount === null || !isSecuritySector(sector)) {
        continue;
      }

      const entry = grouped.get(fiscalYear) ?? {
        obligations: 0,
        disbursements: 0,
        sectors: []
      };
      const normalizedType = classifyTransactionType(transactionType);

      if (normalizedType === "obligation") {
        entry.obligations += amount;
      }

      if (normalizedType === "disbursement") {
        entry.disbursements += amount;
      }

      entry.sectors.push({
        sector,
        amount,
        transactionType: normalizedType
      });

      grouped.set(fiscalYear, entry);
    }

    const obligationsSeries = dataset.series.find((series) => series.slug === "security-assistance-obligations");
    const disbursementsSeries = dataset.series.find((series) => series.slug === "security-assistance-disbursements");
    const breakdownSeries = dataset.series.find((series) => series.slug === "security-assistance-sector-summary");
    const targetSeries = dataset.series.filter((series) =>
      options.seriesSlugs ? options.seriesSlugs.includes(series.slug) : true
    );

    return {
      datasetSlug: dataset.slug,
      series: [
        {
          seriesSlug: obligationsSeries?.slug ?? "security-assistance-obligations",
          observations: [...grouped.entries()].map(([fiscalYear, entry]) => ({
            observedAt: endOfFiscalYearDate(fiscalYear),
            numericValue: entry.obligations,
            sourceObservationKey: `security-assistance-obligations:${fiscalYear}`,
            sourceUrl,
            sourceUnit: obligationsSeries?.unit,
            sourceFrequency: obligationsSeries?.frequency
          }))
        },
        {
          seriesSlug: disbursementsSeries?.slug ?? "security-assistance-disbursements",
          observations: [...grouped.entries()].map(([fiscalYear, entry]) => ({
            observedAt: endOfFiscalYearDate(fiscalYear),
            numericValue: entry.disbursements,
            sourceObservationKey: `security-assistance-disbursements:${fiscalYear}`,
            sourceUrl,
            sourceUnit: disbursementsSeries?.unit,
            sourceFrequency: disbursementsSeries?.frequency
          }))
        },
        {
          seriesSlug: breakdownSeries?.slug ?? "security-assistance-sector-summary",
          observations: [...grouped.entries()].map(([fiscalYear, entry]) => ({
            observedAt: endOfFiscalYearDate(fiscalYear),
            jsonValue: {
              sectors: entry.sectors.sort((a, b) => b.amount - a.amount).slice(0, 250)
            },
            sourceObservationKey: `security-assistance-sector-summary:${fiscalYear}`,
            sourceUrl,
            sourceUnit: "json",
            sourceFrequency: breakdownSeries?.frequency
          }))
        }
      ].filter((bundle) => targetSeries.some((series) => series.slug === bundle.seriesSlug)),
      warnings: []
    };
  }

  private async discoverDatasetShape(datasetId: string): Promise<DatasetShape> {
    const previewUrl = `${sourceDefinition.baseUrl}/resource/${datasetId}.json?$limit=1`;
    const previewRows = await this.http.getJson(previewUrl, {
      sourceName: "Foreign Assistance",
      allowedHosts: ["data.usaid.gov"],
      responseSchema: foreignAssistanceRowsSchema
    });
    const firstRow = previewRows[0];

    if (!firstRow) {
      throw new UpstreamServiceError("Foreign assistance dataset preview returned no rows", { datasetId });
    }

    const keys = Object.keys(firstRow);
    const fiscalYearKey = matchKey(keys, [/^fiscal_?year$/i, /fiscal.*year/i, /^fy$/i]);
    const transactionTypeKey = matchKey(keys, [/transaction.*type/i, /^transaction$/i, /flow.*type/i]);
    const countryKey = matchKey(keys, [/country.*name/i, /^country$/i]);
    const sectorKey = matchKey(keys, [/sector.*name/i, /^sector$/i, /category.*name/i], false);
    const amountKey = matchKey(keys, [/current.*amount/i, /amount.*current/i, /constant.*amount/i, /amount$/i]);

    if (!fiscalYearKey || !transactionTypeKey || !amountKey) {
      throw new UpstreamServiceError("Foreign assistance dataset schema discovery failed", {
        datasetId,
        keys
      });
    }

    return {
      fiscalYearKey,
      transactionTypeKey,
      countryKey,
      sectorKey,
      amountKey
    };
  }
}

type DatasetShape = {
  fiscalYearKey: string;
  transactionTypeKey: string;
  countryKey?: string;
  sectorKey?: string;
  amountKey: string;
};

type CountryBreakdownRow = {
  country: string;
  amount: number;
  transactionType: "obligation" | "disbursement" | "other";
};

type SectorBreakdownRow = {
  sector: string;
  amount: number;
  transactionType: "obligation" | "disbursement" | "other";
};

function matchKey(keys: string[], patterns: RegExp[], required = true): string | undefined {
  const key = keys.find((candidate) => patterns.some((pattern) => pattern.test(candidate)));

  if (!key && required) {
    return undefined;
  }

  return key;
}

function classifyTransactionType(value: string): "obligation" | "disbursement" | "other" {
  const normalized = value.toLowerCase();

  if (normalized.includes("oblig")) {
    return "obligation";
  }

  if (normalized.includes("disburs")) {
    return "disbursement";
  }

  return "other";
}

function isSecuritySector(value: string): boolean {
  return /(security|military|peacekeeping|counterterror|nonproliferation|law enforcement|weapons|stability)/i.test(
    value
  );
}
