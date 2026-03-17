export const sourceSlugs = [
  "fred",
  "treasury-fiscal-data",
  "federal-reserve",
  "usaspending",
  "foreign-assistance",
  "bls",
  "bea"
] as const;

export type SourceSlug = (typeof sourceSlugs)[number];

export const apiRanges = ["7d", "30d", "90d", "180d", "1y", "2y", "5y", "10y", "max"] as const;
export type ApiRange = (typeof apiRanges)[number];

export const apiFrequencies = ["auto", "daily", "weekly", "monthly", "quarterly", "annual"] as const;
export type ApiFrequency = (typeof apiFrequencies)[number];

export const compareModes = ["previous", "1y", "5y"] as const;
export type CompareMode = (typeof compareModes)[number];
