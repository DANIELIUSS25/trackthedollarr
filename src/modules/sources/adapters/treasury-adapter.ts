import { DatasetSeed, dataSources } from "../definitions/catalog";
import { AdapterSyncOptions, AdapterSyncResult, BaseSourceAdapter, DatasetSyncBundle } from "./base-adapter";
import { isoDate, toDateOnly, toMonthDate } from "../../../core/utils/date";
import { treasuryApiResponseSchema } from "../schemas/common";
import { safeNumber } from "../../../core/utils/math";

const sourceDefinition = dataSources.find((source) => source.slug === "treasury-fiscal-data")!;

export class TreasuryFiscalDataAdapter extends BaseSourceAdapter {
  readonly sourceSlug = "treasury-fiscal-data" as const;

  async sync(options: AdapterSyncOptions = {}): Promise<AdapterSyncResult> {
    const datasets = sourceDefinition.datasets.filter((dataset) =>
      options.datasetSlugs ? options.datasetSlugs.includes(dataset.slug) : true
    );

    const bundles: DatasetSyncBundle[] = [];
    const warnings: string[] = [];

    for (const dataset of datasets) {
      if (dataset.slug === "debt-to-the-penny") {
        bundles.push(await this.syncDebtToThePenny(dataset, options));
        continue;
      }

      if (dataset.slug === "daily-treasury-statement") {
        bundles.push(await this.syncDailyTreasuryStatement(dataset, options));
        continue;
      }

      if (dataset.slug === "monthly-treasury-statement") {
        bundles.push(await this.syncMonthlyTreasuryStatement(dataset, options));
      }
    }

    return {
      sourceSlug: this.sourceSlug,
      datasets: bundles,
      warnings
    };
  }

  private async syncDebtToThePenny(dataset: DatasetSeed, options: AdapterSyncOptions): Promise<DatasetSyncBundle> {
    const targetSeries = dataset.series.filter((series) =>
      options.seriesSlugs ? options.seriesSlugs.includes(series.slug) : true
    );
    const startDate = options.lookbackDays
      ? isoDate(new Date(Date.now() - options.lookbackDays * 24 * 60 * 60 * 1000))
      : "2000-01-01";
    const fields = ["record_date", ...targetSeries.map((series) => series.sourceCode)].join(",");
    const rows = await this.fetchTreasuryRows(dataset.apiPath ?? "", {
      fields,
      filter: `record_date:gte:${startDate}`,
      sort: "record_date"
    });

    const seriesBundles = targetSeries.map((series) => ({
      seriesSlug: series.slug,
      observations: rows
        .map((row) => {
          const numericValue = safeNumber(row[series.sourceCode]);

          if (numericValue === null || typeof row.record_date !== "string") {
            return null;
          }

          return {
            observedAt: toDateOnly(row.record_date),
            numericValue,
            sourceObservationKey: `${series.slug}:${row.record_date}`,
            sourceUrl: dataset.sourcePageUrl,
            sourceUnit: series.unit,
            sourceFrequency: series.frequency,
            metadata: {
              datasetSlug: dataset.slug
            }
          };
        })
        .filter((value): value is NonNullable<typeof value> => value !== null)
    }));

    return {
      datasetSlug: dataset.slug,
      series: seriesBundles,
      warnings: []
    };
  }

  private async syncDailyTreasuryStatement(
    dataset: DatasetSeed,
    options: AdapterSyncOptions
  ): Promise<DatasetSyncBundle> {
    const series = dataset.series.find((candidate) =>
      options.seriesSlugs ? options.seriesSlugs.includes(candidate.slug) : true
    );

    if (!series) {
      return {
        datasetSlug: dataset.slug,
        series: [],
        warnings: []
      };
    }

    const metadata = series?.metadata ?? {};
    const startDate = options.lookbackDays
      ? isoDate(new Date(Date.now() - options.lookbackDays * 24 * 60 * 60 * 1000))
      : "2000-01-01";
    const fields = ["record_date", "account_type", "open_today_bal", "close_today_bal"].join(",");
    const accountType = String(metadata.accountType ?? "Treasury General Account (TGA) Closing Balance");
    const rows = await this.fetchTreasuryRows(dataset.apiPath ?? "", {
      fields,
      filter: `record_date:gte:${startDate},account_type:eq:${accountType}`,
      sort: "record_date"
    });

    const fieldCandidates = Array.isArray(metadata.fieldCandidates)
      ? metadata.fieldCandidates.map(String)
      : ["open_today_bal", "close_today_bal"];

    const observations = rows
      .map((row) => {
        const fieldName = fieldCandidates.find((candidate) => safeNumber(row[candidate]) !== null);

        if (!fieldName || typeof row.record_date !== "string") {
          return null;
        }

        const numericValue = safeNumber(row[fieldName]);

        if (numericValue === null) {
          return null;
        }

        return {
          observedAt: toDateOnly(row.record_date),
          numericValue,
          sourceObservationKey: `${series?.slug}:${row.record_date}`,
          sourceUrl: dataset.sourcePageUrl,
          sourceUnit: series?.unit,
          sourceFrequency: series?.frequency,
          metadata: {
            accountType,
            rawField: fieldName
          }
        };
      })
      .filter((value): value is NonNullable<typeof value> => value !== null);

    return {
      datasetSlug: dataset.slug,
      series: [
        {
          seriesSlug: series?.slug ?? "treasury-general-account-balance",
          observations
        }
      ],
      warnings: []
    };
  }

  private async syncMonthlyTreasuryStatement(
    dataset: DatasetSeed,
    options: AdapterSyncOptions
  ): Promise<DatasetSyncBundle> {
    const targetSeries = dataset.series.filter((series) =>
      options.seriesSlugs ? options.seriesSlugs.includes(series.slug) : true
    );

    if (targetSeries.length === 0) {
      return {
        datasetSlug: dataset.slug,
        series: [],
        warnings: []
      };
    }

    const startDate = options.lookbackDays
      ? isoDate(new Date(Date.now() - options.lookbackDays * 24 * 60 * 60 * 1000))
      : "2000-01-01";
    const fields = [
      "record_date",
      "classification_desc",
      ...new Set(
        targetSeries.flatMap((series) =>
          Array.isArray(series.metadata?.fieldCandidates)
            ? series.metadata!.fieldCandidates.map(String)
            : [series.sourceCode]
        )
      )
    ].join(",");
    const rows = await this.fetchTreasuryRows(dataset.apiPath ?? "", {
      fields,
      filter: `record_date:gte:${startDate}`,
      sort: "record_date"
    });
    const groupedRows = new Map<string, Array<Record<string, string | number | null>>>();
    const warnings: string[] = [];

    for (const row of rows) {
      if (typeof row.record_date !== "string") {
        continue;
      }

      const bucket = groupedRows.get(row.record_date) ?? [];
      bucket.push(row);
      groupedRows.set(row.record_date, bucket);
    }

    return {
      datasetSlug: dataset.slug,
      series: targetSeries.map((series) => {
        const observations = [...groupedRows.entries()]
          .map(([recordDate, dateRows]) => {
            const selectedRow = selectTreasuryStatementRow(series, dateRows);

            if (!selectedRow) {
              return null;
            }

            const fieldCandidates = Array.isArray(series.metadata?.fieldCandidates)
              ? series.metadata!.fieldCandidates.map(String)
              : [series.sourceCode];
            const fieldName = fieldCandidates.find((candidate) => safeNumber(selectedRow[candidate]) !== null);
            const numericValue = fieldName ? safeNumber(selectedRow[fieldName]) : null;

            if (numericValue === null) {
              return null;
            }

            const observedAt = parseTreasuryMonth(recordDate);

            if (!observedAt) {
              return null;
            }

            return {
              observedAt,
              numericValue,
              sourceObservationKey: `${series.slug}:${recordDate}`,
              sourceUrl: dataset.sourcePageUrl,
              sourceUnit: series.unit,
              sourceFrequency: series.frequency,
              metadata: {
                classificationDesc: selectedRow.classification_desc ?? null,
                rawField: fieldName ?? null
              }
            };
          })
          .filter((value): value is NonNullable<typeof value> => value !== null);

        if (observations.length === 0) {
          warnings.push(`Monthly Treasury Statement returned no matched rows for ${series.slug}`);
        }

        return {
          seriesSlug: series.slug,
          observations
        };
      }),
      warnings
    };
  }

  private async fetchTreasuryRows(
    apiPath: string,
    searchParams: Record<string, string>
  ): Promise<Array<Record<string, string | number | null>>> {
    const rows: Array<Record<string, string | number | null>> = [];
    let pageNumber = 1;
    let totalPages = 1;

    do {
      const query = new URLSearchParams({
        ...searchParams,
        "page[number]": String(pageNumber),
        "page[size]": "5000",
        format: "json"
      });

      const response = await this.http.getJson(`${sourceDefinition.baseUrl}${apiPath}?${query.toString()}`, {
        sourceName: "Treasury Fiscal Data",
        allowedHosts: ["api.fiscaldata.treasury.gov"],
        responseSchema: treasuryApiResponseSchema
      });

      rows.push(...response.data);
      totalPages = response.meta?.totalPages ?? 1;
      pageNumber += 1;
    } while (pageNumber <= totalPages);

    return rows;
  }
}

function selectTreasuryStatementRow(
  series: DatasetSeed["series"][number],
  rows: Array<Record<string, string | number | null>>
): Record<string, string | number | null> | null {
  const includes = Array.isArray(series.metadata?.classificationIncludes)
    ? series.metadata!.classificationIncludes.map((value) => String(value).toLowerCase())
    : [];
  const excludes = Array.isArray(series.metadata?.classificationExcludes)
    ? series.metadata!.classificationExcludes.map((value) => String(value).toLowerCase())
    : [];

  const candidates = rows.filter((row) => {
    const label = String(row.classification_desc ?? "").toLowerCase();

    if (includes.length > 0 && !includes.some((needle) => label.includes(needle))) {
      return false;
    }

    if (excludes.some((needle) => label.includes(needle))) {
      return false;
    }

    return true;
  });

  return candidates[0] ?? null;
}

function parseTreasuryMonth(recordDate: string): Date | null {
  const directDate = new Date(recordDate);

  if (!Number.isNaN(directDate.getTime())) {
    return new Date(Date.UTC(directDate.getUTCFullYear(), directDate.getUTCMonth(), 1, 0, 0, 0));
  }

  const match = /^(\d{4})-(\d{2})$/.exec(recordDate);

  if (!match) {
    return null;
  }

  return toMonthDate(Number(match[1]), Number(match[2]));
}
