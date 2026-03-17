import { z } from "zod";

export const fredObservationsSchema = z.object({
  realtime_start: z.string(),
  realtime_end: z.string(),
  observations: z.array(
    z.object({
      realtime_start: z.string(),
      realtime_end: z.string(),
      date: z.string(),
      value: z.string()
    })
  )
});

export const treasuryApiResponseSchema = z.object({
  data: z.array(z.record(z.union([z.string(), z.number(), z.null()]))),
  meta: z
    .object({
      count: z.number().optional(),
      labels: z.record(z.string()).optional(),
      dataTypes: z.record(z.string()).optional(),
      totalPages: z.number().optional(),
      totalRecords: z.number().optional()
    })
    .passthrough()
    .optional()
});

export const blsApiResponseSchema = z.object({
  status: z.string(),
  responseTime: z.number().optional(),
  Results: z.object({
    series: z.array(
      z.object({
        seriesID: z.string(),
        data: z.array(
          z.object({
            year: z.string(),
            period: z.string(),
            periodName: z.string().optional(),
            value: z.string(),
            footnotes: z.array(z.record(z.string())).optional()
          })
        )
      })
    )
  })
});

export const usaspendingBudgetaryResourcesSchema = z.object({
  agency_data_by_year: z.array(z.record(z.union([z.string(), z.number(), z.null()]))),
  messages: z.array(z.string()).optional()
});

export const usaspendingAwardsSchema = z.object({
  fiscal_year: z.number().or(z.string()).optional(),
  obligations: z.number().or(z.string()),
  transaction_count: z.number().or(z.string()),
  messages: z.array(z.string()).optional()
});

export const usaspendingAwardCategorySchema = z.object({
  results: z.array(z.record(z.union([z.string(), z.number(), z.null()]))),
  messages: z.array(z.string()).optional()
});

export const beaApiResponseSchema = z.object({
  BEAAPI: z.object({
    Results: z.object({
      Data: z.array(z.record(z.string()))
    })
  })
});

export const foreignAssistanceRowsSchema = z.array(z.record(z.union([z.string(), z.number(), z.null()])));
