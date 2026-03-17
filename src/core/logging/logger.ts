import pino from "pino";

import { getEnv } from "../config/env";

const env = getEnv();

export const logger = pino({
  name: env.APP_NAME,
  level: env.LOG_LEVEL,
  base: undefined,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.x-admin-key",
      "headers.authorization",
      "headers.x-admin-key"
    ],
    censor: "[REDACTED]"
  },
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime
});
