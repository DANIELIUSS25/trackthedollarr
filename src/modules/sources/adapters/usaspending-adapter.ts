import { DatasetSeed, dataSources } from "../definitions/catalog";
import { AdapterSyncOptions, AdapterSyncResult, BaseSourceAdapter, DatasetSyncBundle } from "./base-adapter";
import {
  usaspendingAwardCategorySchema,
  usaspendingAwardsSchema,
  usaspendingBudgetaryResourcesSchema
} from "../schemas/common";
import { endOfFiscalYearDate } from "../../../core/utils/date";
import { safeNumber } from "../../../core/utils/math";

const sourceDefinition = dataSources.find((source) => source.slug === "usaspending")!;

export class UsaSpendingAdapter extends BaseSourceAdapter {
  readonly sourceSlug = "usaspending" as const;

  async sync(options: AdapterSyncOptions = {}): Promise<AdapterSyncResult> {
    const datasets = sourceDefinition.datasets.filter((dataset) =>
      options.datasetSlugs ? options.datasetSlugs.includes(dataset.slug) : true
    );

    const results: DatasetSyncBundle[] = [];
    const warnings: string[] = [];

    for (const dataset of datasets) {
      if (dataset.slug === "dod-budgetary-resources") {
        results.push(await this.syncBudgetaryResources(dataset, options));
        continue;
      }

      if (dataset.slug === "dod-awards") {
        const { bundle, warnings: awardWarnings } = await this.syncAwards(dataset, options);
        results.push(bundle);
        warnings.push(...awardWarnings);
      }
    }

    return {
      sourceSlug: this.sourceSlug,
      datasets: results,
      warnings
    };
  }

  private async syncBudgetaryResources(
    dataset: DatasetSeed,
    options: AdapterSyncOptions
  ): Promise<DatasetSyncBundle> {
    const sourceUrl = `${sourceDefinition.baseUrl}${dataset.apiPath ?? ""}`;
    const response = await this.http.getJson(sourceUrl, {
      sourceName: "USAspending",
      allowedHosts: ["api.usaspending.gov"],
      responseSchema: usaspendingBudgetaryResourcesSchema
    });
    const targetSeries = dataset.series.filter((series) =>
      options.seriesSlugs ? options.seriesSlugs.includes(series.slug) : true
    );

    return {
      datasetSlug: dataset.slug,
      series: targetSeries.map((series) => ({
        seriesSlug: series.slug,
        observations: response.agency_data_by_year
          .map((row) => {
            const fiscalYear = safeNumber(row.fiscal_year ?? row.year);
            const numericValue = safeNumber(row[series.sourceCode]);

            if (!fiscalYear || numericValue === null) {
              return null;
            }

            return {
              observedAt: endOfFiscalYearDate(fiscalYear),
              numericValue,
              sourceObservationKey: `${series.slug}:${fiscalYear}`,
              sourceUrl,
              sourceUnit: series.unit,
              sourceFrequency: series.frequency,
              metadata: {
                agencyName: row.agency_name ?? row.name ?? "Department of Defense"
              }
            };
          })
          .filter((value): value is NonNullable<typeof value> => value !== null)
      })),
      warnings: response.messages ?? []
    };
  }

  private async syncAwards(
    dataset: DatasetSeed,
    options: AdapterSyncOptions
  ): Promise<{ bundle: DatasetSyncBundle; warnings: string[] }> {
    const currentFiscalYear = inferCurrentFiscalYear(options.now ?? new Date());
    const startFiscalYear = currentFiscalYear - 10;
    const targetSeries = dataset.series.filter((series) =>
      options.seriesSlugs ? options.seriesSlugs.includes(series.slug) : true
    );
    const observationsBySeries = new Map<string, DatasetSyncBundle["series"][number]["observations"]>();
    const warnings: string[] = [];

    for (const series of targetSeries) {
      observationsBySeries.set(series.slug, []);
    }

    for (let fiscalYear = startFiscalYear; fiscalYear <= currentFiscalYear; fiscalYear += 1) {
      const awardsUrl = `${sourceDefinition.baseUrl}${dataset.apiPath ?? ""}?fiscal_year=${fiscalYear}`;
      const awards = await this.http.getJson(awardsUrl, {
        sourceName: "USAspending",
        allowedHosts: ["api.usaspending.gov"],
        responseSchema: usaspendingAwardsSchema
      });

      for (const series of targetSeries.filter((item) =>
        ["dod-award-obligations", "dod-award-transaction-count"].includes(item.slug)
      )) {
        const numericValue = safeNumber(
          series.slug === "dod-award-obligations" ? awards.obligations : awards.transaction_count
        );

        if (numericValue === null) {
          continue;
        }

        observationsBySeries.get(series.slug)?.push({
          observedAt: endOfFiscalYearDate(fiscalYear),
          numericValue,
          sourceObservationKey: `${series.slug}:${fiscalYear}`,
          sourceUrl: awardsUrl,
          sourceUnit: series.unit,
          sourceFrequency: series.frequency,
          metadata: {
            fiscalYear
          }
        });
      }

      const categoriesUrl = `${sourceDefinition.baseUrl}/api/v2/agency/097/obligations_by_award_category/?fiscal_year=${fiscalYear}`;
      const categories = await this.http.getJson(categoriesUrl, {
        sourceName: "USAspending",
        allowedHosts: ["api.usaspending.gov"],
        responseSchema: usaspendingAwardCategorySchema
      });

      for (const series of targetSeries.filter((item) =>
        ["dod-contract-obligations", "dod-grant-obligations"].includes(item.slug)
      )) {
        const row = categories.results.find((result) => {
          const label = String(
            result.category ??
              result.category_name ??
              result.award_category ??
              result.name ??
              result.award_type ??
              ""
          );

          return label.toLowerCase().includes(series.sourceCode.toLowerCase());
        });

        if (!row) {
          warnings.push(`No USAspending award category row matched ${series.sourceCode} for FY${fiscalYear}`);
          continue;
        }

        const numericValue = safeNumber(
          row.obligated_amount ?? row.amount ?? row.obligations ?? row.obligated_total ?? row.total_obligated
        );

        if (numericValue === null) {
          continue;
        }

        observationsBySeries.get(series.slug)?.push({
          observedAt: endOfFiscalYearDate(fiscalYear),
          numericValue,
          sourceObservationKey: `${series.slug}:${fiscalYear}`,
          sourceUrl: categoriesUrl,
          sourceUnit: series.unit,
          sourceFrequency: series.frequency,
          metadata: {
            fiscalYear,
            rawCategory: row.category ?? row.category_name ?? row.award_category ?? row.name ?? null
          }
        });
      }
    }

    return {
      bundle: {
        datasetSlug: dataset.slug,
        series: targetSeries.map((series) => ({
          seriesSlug: series.slug,
          observations: observationsBySeries.get(series.slug) ?? []
        })),
        warnings
      },
      warnings
    };
  }
}

function inferCurrentFiscalYear(date: Date): number {
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  return month >= 9 ? year + 1 : year;
}
