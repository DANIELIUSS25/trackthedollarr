import { Series } from "@prisma/client";

import { NormalizedObservation } from "../../sources/adapters/base-adapter";

type SupportedUnit =
  | "usd"
  | "usd_thousands"
  | "usd_millions"
  | "billions_usd"
  | "usd_annual_rate"
  | "millions_usd_annual_rate"
  | "billions_usd_annual_rate"
  | "percent"
  | "basis_points"
  | "ratio"
  | "index"
  | "count"
  | "zscore"
  | "score_0_100"
  | "json";

type UnitDefinition = {
  dimension: string;
  toBaseFactor: number;
};

type NormalizationResult = {
  numericValue: number;
  sourceUnit: string;
  metadata: {
    dimension: string;
    sourceUnit: string;
    canonicalUnit: string;
    appliedFactor: number;
  };
};

const UNIT_DEFINITIONS: Record<SupportedUnit, UnitDefinition> = {
  usd: { dimension: "currency", toBaseFactor: 1 },
  usd_thousands: { dimension: "currency", toBaseFactor: 1_000 },
  usd_millions: { dimension: "currency", toBaseFactor: 1_000_000 },
  billions_usd: { dimension: "currency", toBaseFactor: 1_000_000_000 },
  usd_annual_rate: { dimension: "currency_annual_rate", toBaseFactor: 1 },
  millions_usd_annual_rate: { dimension: "currency_annual_rate", toBaseFactor: 1_000_000 },
  billions_usd_annual_rate: { dimension: "currency_annual_rate", toBaseFactor: 1_000_000_000 },
  percent: { dimension: "percent", toBaseFactor: 1 },
  basis_points: { dimension: "percent", toBaseFactor: 0.01 },
  ratio: { dimension: "ratio", toBaseFactor: 1 },
  index: { dimension: "index", toBaseFactor: 1 },
  count: { dimension: "count", toBaseFactor: 1 },
  zscore: { dimension: "zscore", toBaseFactor: 1 },
  score_0_100: { dimension: "score", toBaseFactor: 1 },
  json: { dimension: "json", toBaseFactor: 1 }
};

export class UnitNormalizer {
  normalizeObservation(
    series: Pick<Series, "slug" | "unit">,
    observation: NormalizedObservation
  ): NormalizedObservation {
    if (observation.numericValue === null || observation.numericValue === undefined) {
      return observation;
    }

    const sourceUnit = String(observation.sourceUnit ?? series.unit).trim();

    if (!sourceUnit || sourceUnit === series.unit) {
      return {
        ...observation,
        sourceUnit
      };
    }

    const normalized = normalizeNumericValue(observation.numericValue, sourceUnit, series.unit);

    return {
      ...observation,
      numericValue: normalized.numericValue,
      sourceUnit: normalized.sourceUnit,
      metadata: {
        ...(observation.metadata ?? {}),
        normalization: normalized.metadata
      },
      warnings: dedupeWarnings([
        ...(observation.warnings ?? []),
        `Normalized upstream unit ${sourceUnit} to canonical ${series.unit}.`
      ])
    };
  }
}

export function normalizeNumericValue(value: number, fromUnit: string, toUnit: string): NormalizationResult {
  const from = UNIT_DEFINITIONS[fromUnit as SupportedUnit];
  const to = UNIT_DEFINITIONS[toUnit as SupportedUnit];

  if (!from) {
    throw new Error(`Unsupported source unit: ${fromUnit}`);
  }

  if (!to) {
    throw new Error(`Unsupported canonical unit: ${toUnit}`);
  }

  if (from.dimension !== to.dimension) {
    throw new Error(`Incompatible unit normalization: ${fromUnit} -> ${toUnit}`);
  }

  const numericValue = (value * from.toBaseFactor) / to.toBaseFactor;
  const appliedFactor = from.toBaseFactor / to.toBaseFactor;

  return {
    numericValue,
    sourceUnit: fromUnit,
    metadata: {
      dimension: from.dimension,
      sourceUnit: fromUnit,
      canonicalUnit: toUnit,
      appliedFactor
    }
  };
}

function dedupeWarnings(warnings: string[]): string[] {
  return [...new Set(warnings)];
}
