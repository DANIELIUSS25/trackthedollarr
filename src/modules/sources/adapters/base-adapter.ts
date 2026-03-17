import { Frequency, ObservationStatus } from "@prisma/client";
import { Logger } from "pino";

import { AppEnv } from "../../../core/config/env";
import { SafeHttpClient } from "../../../core/http/safe-http-client";
import { SourceSlug } from "../../../core/types";

export type NormalizedObservation = {
  observedAt: Date;
  numericValue?: number | null;
  textValue?: string | null;
  jsonValue?: Record<string, unknown> | Array<unknown> | null;
  valueStatus?: ObservationStatus;
  sourceObservationKey?: string;
  sourcePublishedAt?: Date;
  sourceUpdatedAt?: Date;
  sourceUrl: string;
  sourceUnit?: string;
  sourceFrequency?: Frequency;
  warnings?: string[];
  metadata?: Record<string, unknown>;
};

export type SeriesObservationBundle = {
  seriesSlug: string;
  observations: NormalizedObservation[];
  metadata?: Record<string, unknown>;
};

export type DatasetSyncBundle = {
  datasetSlug: string;
  series: SeriesObservationBundle[];
  warnings: string[];
  metadata?: Record<string, unknown>;
};

export type AdapterSyncResult = {
  sourceSlug: SourceSlug;
  datasets: DatasetSyncBundle[];
  warnings: string[];
  metadata?: Record<string, unknown>;
};

export type AdapterSyncOptions = {
  datasetSlugs?: string[];
  seriesSlugs?: string[];
  lookbackDays?: number;
  now?: Date;
};

export type AdapterDependencies = {
  env: AppEnv;
  logger: Logger;
  http: SafeHttpClient;
};

export interface SourceAdapter {
  readonly sourceSlug: SourceSlug;
  sync(options?: AdapterSyncOptions): Promise<AdapterSyncResult>;
}

export abstract class BaseSourceAdapter implements SourceAdapter {
  abstract readonly sourceSlug: SourceSlug;

  constructor(protected readonly dependencies: AdapterDependencies) {}

  protected get env() {
    return this.dependencies.env;
  }

  protected get logger() {
    return this.dependencies.logger.child({ source: this.sourceSlug });
  }

  protected get http() {
    return this.dependencies.http;
  }

  abstract sync(options?: AdapterSyncOptions): Promise<AdapterSyncResult>;
}
