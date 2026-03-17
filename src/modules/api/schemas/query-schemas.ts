import { z } from "zod";

import { apiFrequencies, apiRanges, compareModes, sourceSlugs } from "../../../core/types";

const safeToken = z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9 .,'()\-_/:]+$/);

export const seriesQuerySchema = z.object({
  range: z.enum(apiRanges).default("1y"),
  frequency: z.enum(apiFrequencies).default("auto"),
  compare: z.enum(compareModes).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(250)
});

export const foreignAssistanceQuerySchema = seriesQuerySchema.extend({
  country: safeToken.optional(),
  category: z.enum(["total", "security"]).default("total")
});

export const defenseSpendingQuerySchema = seriesQuerySchema.extend({
  agency: z.enum(["dod"]).default("dod"),
  category: z.enum(["overview", "contracts", "grants"]).default("overview")
});

export const sourceHealthQuerySchema = z.object({
  source: z.enum(sourceSlugs).optional()
});

export const methodologyQuerySchema = z.object({
  slug: safeToken.optional()
});

export const adminRefreshSchema = z.object({
  source: z.enum(sourceSlugs),
  dataset: safeToken.optional(),
  seriesSlugs: z.array(safeToken).max(20).optional(),
  mode: z.enum(["incremental", "full"]).default("incremental"),
  lookbackDays: z.coerce.number().int().min(1).max(3650).optional()
});

export const adminInvalidateCacheSchema = z
  .object({
    key: safeToken.optional(),
    prefix: safeToken.optional()
  })
  .superRefine((payload, ctx) => {
    if (!payload.key && !payload.prefix) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either key or prefix is required"
      });
    }
  });

export const adminIngestRunsQuerySchema = z.object({
  source: z.enum(sourceSlugs).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

export const adminStaleAlertsQuerySchema = z.object({
  source: z.enum(sourceSlugs).optional(),
  scope: z.enum(["all", "source", "dataset", "series", "metric"]).default("all"),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

export const adminFreshnessRefreshSchema = z.object({
  source: z.enum(sourceSlugs).optional()
});
