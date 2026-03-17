import { z } from "zod";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore missing .env files and rely on the actual environment.
  }
}

const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === "boolean") {
      return value;
    }

    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  });

const integerString = z.coerce.number().int();

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    HOST: z.string().default("0.0.0.0"),
    PORT: integerString.min(1).max(65535).default(3000),
    APP_NAME: z.string().min(1).default("track-the-dollar-backend"),
    APP_BASE_URL: z.string().url(),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().url().optional(),
    ADMIN_API_KEY: z.string().min(24),
    IP_HASH_SALT: z.string().min(24),
    CORS_ALLOWED_ORIGINS: z.string().default(""),
    API_RATE_LIMIT_MAX: integerString.min(10).max(10_000).default(120),
    API_RATE_LIMIT_WINDOW_SECONDS: integerString.min(1).max(3_600).default(60),
    CACHE_DEFAULT_TTL_SECONDS: integerString.min(10).max(86_400).default(300),
    CACHE_STALE_TTL_SECONDS: integerString.min(10).max(604_800).default(900),
    INGESTION_CONCURRENCY: integerString.min(1).max(16).default(4),
    INGESTION_RETRY_ATTEMPTS: integerString.min(0).max(10).default(3),
    INGESTION_TIMEOUT_MS: integerString.min(1_000).max(120_000).default(15_000),
    DISABLE_SCHEDULES: booleanish.default(false),
    ENABLE_BEA: booleanish.default(false),
    FRED_API_KEY: z.string().min(1),
    BLS_API_KEY: z.string().optional(),
    BEA_API_KEY: z.string().optional(),
    CRON_SYNC_FRED: z.string().min(1),
    CRON_SYNC_TREASURY: z.string().min(1),
    CRON_SYNC_FEDERAL_RESERVE: z.string().min(1),
    CRON_SYNC_USASPENDING: z.string().min(1),
    CRON_SYNC_FOREIGN_ASSISTANCE: z.string().min(1),
    CRON_SYNC_BLS: z.string().min(1),
    CRON_SYNC_BEA: z.string().min(1),
    CRON_DERIVE_METRICS: z.string().min(1),
    CRON_REFRESH_STALE_STATUS: z.string().min(1)
  })
  .superRefine((env, ctx) => {
    if (env.ENABLE_BEA && !env.BEA_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["BEA_API_KEY"],
        message: "BEA_API_KEY is required when ENABLE_BEA=true"
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema> & {
  corsAllowedOrigins: string[];
};

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");

    throw new Error(`Environment validation failed: ${formatted}`);
  }

  cachedEnv = {
    ...parsed.data,
    corsAllowedOrigins: parsed.data.CORS_ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  };

  return cachedEnv;
}
