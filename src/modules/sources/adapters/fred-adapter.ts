import { Frequency } from "@prisma/client";

import { safeNumber } from "../../../core/utils/math";
import { parseRangeStart, toDateOnly } from "../../../core/utils/date";
import { dataSources } from "../definitions/catalog";
import { AdapterSyncOptions, AdapterSyncResult, BaseSourceAdapter, DatasetSyncBundle } from "./base-adapter";
import { fredObservationsSchema } from "../schemas/common";

const sourceDefinition = dataSources.find((source) => source.slug === "fred")!;

export class FredAdapter extends BaseSourceAdapter {
  readonly sourceSlug = "fred" as const;

  async sync(options: AdapterSyncOptions = {}): Promise<AdapterSyncResult> {
    const datasets = sourceDefinition.datasets.filter((dataset) =>
      options.datasetSlugs ? options.datasetSlugs.includes(dataset.slug) : true
    );

    const results: DatasetSyncBundle[] = [];
    const warnings: string[] = [];

    for (const dataset of datasets) {
      const bundles = await Promise.all(
        dataset.series
          .filter((series) => (options.seriesSlugs ? options.seriesSlugs.includes(series.slug) : true))
          .map(async (series) => {
            const startDate =
              options.lookbackDays && options.lookbackDays > 0
                ? new Date(Date.now() - options.lookbackDays * 24 * 60 * 60 * 1000)
                : parseRangeStart("10y");

            const query = new URLSearchParams({
              series_id: series.sourceCode,
              api_key: this.env.FRED_API_KEY,
              file_type: "json",
              sort_order: "asc",
              observation_start: startDate ? startDate.toISOString().slice(0, 10) : "2000-01-01"
            });

            const sourceUrl = `${sourceDefinition.baseUrl}/fred/series/observations?${query.toString()}`;
            const response = await this.http.getJson(sourceUrl, {
              sourceName: "FRED",
              allowedHosts: ["api.stlouisfed.org"],
              responseSchema: fredObservationsSchema
            });

            const observations = response.observations
              .map((observation) => {
                const numericValue = safeNumber(observation.value);

                if (numericValue === null) {
                  return null;
                }

                return {
                  observedAt: toDateOnly(observation.date),
                  numericValue,
                  sourceObservationKey: `${series.slug}:${observation.date}`,
                  sourcePublishedAt: toDateOnly(observation.realtime_start),
                  sourceUpdatedAt: toDateOnly(observation.realtime_end),
                  sourceUrl: series.sourcePageUrl,
                  sourceUnit: series.unit,
                  sourceFrequency: series.frequency,
                  metadata: {
                    realtimeStart: observation.realtime_start,
                    realtimeEnd: observation.realtime_end
                  }
                };
              })
              .filter((value): value is NonNullable<typeof value> => value !== null);

            return {
              seriesSlug: series.slug,
              observations,
              metadata: {
                sourceCode: series.sourceCode,
                sourceFrequency: Frequency[series.frequency]
              }
            };
          })
      );

      if (bundles.some((bundle) => bundle.observations.length === 0)) {
        warnings.push(`FRED dataset ${dataset.slug} returned one or more empty series bundles`);
      }

      results.push({
        datasetSlug: dataset.slug,
        series: bundles,
        warnings: []
      });
    }

    return {
      sourceSlug: this.sourceSlug,
      datasets: results,
      warnings
    };
  }
}
