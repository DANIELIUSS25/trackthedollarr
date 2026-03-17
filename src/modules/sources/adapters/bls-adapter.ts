import { dataSources } from "../definitions/catalog";
import { AdapterSyncOptions, AdapterSyncResult, BaseSourceAdapter, DatasetSyncBundle } from "./base-adapter";
import { blsApiResponseSchema } from "../schemas/common";
import { safeNumber } from "../../../core/utils/math";
import { toMonthDate } from "../../../core/utils/date";

const sourceDefinition = dataSources.find((source) => source.slug === "bls")!;

export class BlsAdapter extends BaseSourceAdapter {
  readonly sourceSlug = "bls" as const;

  async sync(options: AdapterSyncOptions = {}): Promise<AdapterSyncResult> {
    const datasets = sourceDefinition.datasets.filter((dataset) =>
      options.datasetSlugs ? options.datasetSlugs.includes(dataset.slug) : true
    );
    const results: DatasetSyncBundle[] = [];

    for (const dataset of datasets) {
      const targetSeries = dataset.series.filter((series) =>
        options.seriesSlugs ? options.seriesSlugs.includes(series.slug) : true
      );
      const startYear = String(new Date().getUTCFullYear() - Math.max(10, Math.ceil((options.lookbackDays ?? 3650) / 365)));
      const endYear = String(new Date().getUTCFullYear());

      const payload = {
        seriesid: targetSeries.map((series) => series.sourceCode),
        startyear: startYear,
        endyear: endYear,
        registrationkey: this.env.BLS_API_KEY || undefined
      };

      const response = await this.http.postJson(`${sourceDefinition.baseUrl}/publicAPI/v2/timeseries/data/`, {
        sourceName: "BLS",
        allowedHosts: ["api.bls.gov"],
        responseSchema: blsApiResponseSchema,
        body: payload
      });

      const bundles = response.Results.series.map((seriesPayload) => {
        const matchingSeries = targetSeries.find((series) => series.sourceCode === seriesPayload.seriesID);

        if (!matchingSeries) {
          return null;
        }

        return {
          seriesSlug: matchingSeries.slug,
          observations: seriesPayload.data
            .map((row) => {
              if (!row.period.startsWith("M") || row.period === "M13") {
                return null;
              }

              const numericValue = safeNumber(row.value);

              if (numericValue === null) {
                return null;
              }

              return {
                observedAt: toMonthDate(Number(row.year), Number(row.period.slice(1))),
                numericValue,
                sourceObservationKey: `${matchingSeries.slug}:${row.year}-${row.period}`,
                sourceUrl: matchingSeries.sourcePageUrl,
                sourceUnit: matchingSeries.unit,
                sourceFrequency: matchingSeries.frequency,
                metadata: {
                  periodName: row.periodName
                }
              };
            })
            .filter((value): value is NonNullable<typeof value> => value !== null)
        };
      });

      results.push({
        datasetSlug: dataset.slug,
        series: bundles.filter((bundle): bundle is NonNullable<typeof bundle> => bundle !== null),
        warnings: []
      });
    }

    return {
      sourceSlug: this.sourceSlug,
      datasets: results,
      warnings: []
    };
  }
}
