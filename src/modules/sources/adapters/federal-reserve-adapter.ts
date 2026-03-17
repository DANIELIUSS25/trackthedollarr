import { dataSources } from "../definitions/catalog";
import { AdapterSyncOptions, AdapterSyncResult, BaseSourceAdapter, DatasetSyncBundle } from "./base-adapter";
import { safeNumber } from "../../../core/utils/math";
import { toDateOnly } from "../../../core/utils/date";

const sourceDefinition = dataSources.find((source) => source.slug === "federal-reserve")!;

export class FederalReserveAdapter extends BaseSourceAdapter {
  readonly sourceSlug = "federal-reserve" as const;

  async sync(options: AdapterSyncOptions = {}): Promise<AdapterSyncResult> {
    const datasets = sourceDefinition.datasets.filter((dataset) =>
      options.datasetSlugs ? options.datasetSlugs.includes(dataset.slug) : true
    );

    const results: DatasetSyncBundle[] = [];
    const warnings: string[] = [];

    for (const dataset of datasets) {
      const seriesBundles = await Promise.all(
        dataset.series
          .filter((series) => (options.seriesSlugs ? options.seriesSlugs.includes(series.slug) : true))
          .map(async (series) => {
            const metadata = series.metadata ?? {};
            const directCsvUrl =
              typeof metadata.directCsvUrl === "string" && metadata.directCsvUrl.startsWith("https://www.federalreserve.gov")
                ? metadata.directCsvUrl
                : null;
            const fredMirrorSeriesId = String(metadata.fredMirrorSeriesId ?? series.sourceCode);
            const url = directCsvUrl ?? `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${fredMirrorSeriesId}`;
            const allowedHosts = directCsvUrl
              ? ["www.federalreserve.gov"]
              : ["fred.stlouisfed.org"];

            const csv = await this.http.getText(url, {
              sourceName: "Federal Reserve",
              allowedHosts
            });

            const [header, ...lines] = csv.trim().split("\n");

            if (!header) {
              warnings.push(`Federal Reserve series ${series.slug} returned empty CSV`);
              return {
                seriesSlug: series.slug,
                observations: []
              };
            }

            const observations = lines
              .map((line) => line.split(","))
              .map(([date, rawValue]) => {
                if (!date) {
                  return null;
                }

                const numericValue = safeNumber(rawValue);

                if (numericValue === null) {
                  return null;
                }

                return {
                  observedAt: toDateOnly(date),
                  numericValue,
                  sourceObservationKey: `${series.slug}:${date}`,
                  sourceUrl: series.sourcePageUrl,
                  sourceUnit: series.unit,
                  sourceFrequency: series.frequency,
                  metadata: {
                    deliveryMechanism: directCsvUrl ? "federal-reserve-direct" : "fred-mirror",
                    requestedUrl: url
                  }
                };
              })
              .filter((value): value is NonNullable<typeof value> => value !== null);

            return {
              seriesSlug: series.slug,
              observations
            };
          })
      );

      results.push({
        datasetSlug: dataset.slug,
        series: seriesBundles,
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
