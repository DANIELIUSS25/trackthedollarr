import { dataSources } from "../definitions/catalog";
import { AdapterSyncOptions, AdapterSyncResult, BaseSourceAdapter } from "./base-adapter";
import { beaApiResponseSchema } from "../schemas/common";
import { safeNumber } from "../../../core/utils/math";
import { toQuarterDate } from "../../../core/utils/date";

const sourceDefinition = dataSources.find((source) => source.slug === "bea")!;

export class BeaAdapter extends BaseSourceAdapter {
  readonly sourceSlug = "bea" as const;

  async sync(options: AdapterSyncOptions = {}): Promise<AdapterSyncResult> {
    if (!this.env.ENABLE_BEA) {
      return {
        sourceSlug: this.sourceSlug,
        datasets: [],
        warnings: ["BEA adapter is disabled because ENABLE_BEA=false"]
      };
    }

    const dataset = sourceDefinition.datasets[0];
    const series = dataset?.series[0];

    if (!dataset || !series) {
      return {
        sourceSlug: this.sourceSlug,
        datasets: [],
        warnings: ["BEA catalog entries are missing"]
      };
    }

    if (options.datasetSlugs && !options.datasetSlugs.includes(dataset.slug)) {
      return {
        sourceSlug: this.sourceSlug,
        datasets: [],
        warnings: []
      };
    }

    if (options.seriesSlugs && !options.seriesSlugs.includes(series.slug)) {
      return {
        sourceSlug: this.sourceSlug,
        datasets: [
          {
            datasetSlug: dataset.slug,
            series: [],
            warnings: []
          }
        ],
        warnings: []
      };
    }

    const query = new URLSearchParams({
      UserID: this.env.BEA_API_KEY ?? "",
      method: "GetData",
      datasetname: "NIPA",
      TableName: "T10105",
      Frequency: "Q",
      Year: "ALL",
      LineNumber: "1",
      ResultFormat: "json"
    });

    const response = await this.http.getJson(`${sourceDefinition.baseUrl}/api/data?${query.toString()}`, {
      sourceName: "BEA",
      allowedHosts: ["apps.bea.gov"],
      responseSchema: beaApiResponseSchema
    });

    const observations = response.BEAAPI.Results.Data.map((row) => {
      const period = row.TimePeriod;
      const match = period ? /^(\d{4})Q([1-4])$/.exec(period) : null;

      if (!match) {
        return null;
      }

      const numericValue = safeNumber(row.DataValue);

      if (numericValue === null) {
        return null;
      }

      return {
        observedAt: toQuarterDate(Number(match[1]), Number(match[2])),
        numericValue,
        sourceObservationKey: `${series.slug}:${period}`,
        sourceUrl: series.sourcePageUrl,
        sourceUnit: series.unit,
        sourceFrequency: series.frequency,
        metadata: {
          timePeriod: period,
          lineDescription: row.LineDescription
        }
      };
    }).filter((value): value is NonNullable<typeof value> => value !== null);

    return {
      sourceSlug: this.sourceSlug,
      datasets: [
        {
          datasetSlug: dataset.slug,
          series: [
            {
              seriesSlug: series.slug,
              observations
            }
          ],
          warnings: []
        }
      ],
      warnings: []
    };
  }
}
