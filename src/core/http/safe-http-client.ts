import { lookup } from "node:dns/promises";
import { URL } from "node:url";
import { z } from "zod";

import { getEnv } from "../config/env";
import { InputValidationError, UpstreamServiceError } from "../errors/app-error";
import { logger } from "../logging/logger";
import { sleep } from "../utils/date";

type RequestOptions<TSchema extends z.ZodTypeAny | undefined> = {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
  allowedHosts: string[];
  responseSchema?: TSchema;
  sourceName: string;
  responseType?: "json" | "text";
};

export class SafeHttpClient {
  private readonly env = getEnv();

  async getJson<TSchema extends z.ZodTypeAny | undefined>(
    url: string,
    options: Omit<RequestOptions<TSchema>, "method" | "responseType">
  ): Promise<TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown> {
    return this.request(url, { ...options, method: "GET", responseType: "json" }) as Promise<
      TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown
    >;
  }

  async getText(url: string, options: Omit<RequestOptions<undefined>, "method" | "responseType">): Promise<string> {
    return this.request(url, { ...options, method: "GET", responseType: "text" }) as Promise<string>;
  }

  async postJson<TSchema extends z.ZodTypeAny | undefined>(
    url: string,
    options: Omit<RequestOptions<TSchema>, "method" | "responseType">
  ): Promise<TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown> {
    return this.request(url, { ...options, method: "POST", responseType: "json" }) as Promise<
      TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown
    >;
  }

  private async request<TSchema extends z.ZodTypeAny | undefined>(
    rawUrl: string,
    options: RequestOptions<TSchema>
  ): Promise<unknown> {
    const url = new URL(rawUrl);
    await assertSafeUpstream(url, options.allowedHosts);

    const timeoutMs = options.timeoutMs ?? this.env.INGESTION_TIMEOUT_MS;
    const retries = options.retries ?? this.env.INGESTION_RETRY_ATTEMPTS;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const headers: Record<string, string> = {
          accept: options.responseType === "text" ? "text/plain,text/csv,*/*" : "application/json,*/*",
          ...options.headers
        };

        if (options.body) {
          headers["content-type"] = "application/json";
        }

        const response = await fetch(url, {
          method: options.method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (shouldRetry(response.status) && attempt < retries) {
          const waitMs = computeBackoff(attempt);
          logger.warn(
            {
              source: options.sourceName,
              status: response.status,
              url: sanitizeUrl(url),
              attempt,
              waitMs
            },
            "Retrying upstream request"
          );
          await sleep(waitMs);
          continue;
        }

        if (!response.ok) {
          throw new UpstreamServiceError(`Upstream request failed for ${options.sourceName}`, {
            status: response.status,
            url: sanitizeUrl(url)
          });
        }

        const payload = options.responseType === "text" ? await response.text() : await response.json();

        if (!options.responseSchema) {
          return payload;
        }

        const parsed = options.responseSchema.safeParse(payload);

        if (!parsed.success) {
          throw new UpstreamServiceError(`Malformed upstream payload from ${options.sourceName}`, {
            url: sanitizeUrl(url),
            issues: parsed.error.issues
          });
        }

        return parsed.data;
      } catch (error) {
        clearTimeout(timeout);

        if (attempt < retries && isRetryableError(error)) {
          const waitMs = computeBackoff(attempt);
          logger.warn(
            {
              source: options.sourceName,
              url: sanitizeUrl(url),
              attempt,
              waitMs,
              error: error instanceof Error ? error.message : String(error)
            },
            "Retrying after upstream failure"
          );
          await sleep(waitMs);
          continue;
        }

        if (error instanceof UpstreamServiceError) {
          throw error;
        }

        throw new UpstreamServiceError(`Unable to reach upstream source ${options.sourceName}`, {
          url: sanitizeUrl(url)
        }, error);
      }
    }

    throw new UpstreamServiceError(`Exhausted retries for ${options.sourceName}`, {
      url: sanitizeUrl(url)
    });
  }
}

function shouldRetry(statusCode: number): boolean {
  return statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
}

function computeBackoff(attempt: number): number {
  const base = Math.min(1_000 * 2 ** attempt, 10_000);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === "AbortError" || error.name === "TypeError";
}

function sanitizeUrl(url: URL): string {
  const clone = new URL(url.toString());

  for (const key of clone.searchParams.keys()) {
    if (/(key|token|secret)/i.test(key)) {
      clone.searchParams.set(key, "[REDACTED]");
    }
  }

  return clone.toString();
}

async function assertSafeUpstream(url: URL, allowedHosts: string[]): Promise<void> {
  if (!["https:"].includes(url.protocol)) {
    throw new InputValidationError("Only HTTPS upstream requests are allowed", {
      protocol: url.protocol
    });
  }

  if (!allowedHosts.includes(url.hostname)) {
    throw new InputValidationError("Requested upstream host is not allowlisted", {
      host: url.hostname
    });
  }

  const resolution = await lookup(url.hostname, { family: 0, all: true });
  const addresses = resolution.map((entry) => entry.address);

  if (addresses.some(isPrivateIpAddress)) {
    throw new InputValidationError("Resolved upstream host is not publicly routable", {
      host: url.hostname
    });
  }
}

function isPrivateIpAddress(ip: string): boolean {
  if (ip.includes(":")) {
    return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80");
  }

  const parts = ip.split(".").map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const a = parts[0] ?? 0;
  const b = parts[1] ?? 0;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}
