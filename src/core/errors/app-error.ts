export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly expose: boolean;
  readonly details?: Record<string, unknown>;

  constructor(params: {
    message: string;
    code: string;
    statusCode?: number;
    expose?: boolean;
    details?: Record<string, unknown>;
    cause?: unknown;
  }) {
    super(params.message, { cause: params.cause });
    this.name = "AppError";
    this.statusCode = params.statusCode ?? 500;
    this.code = params.code;
    this.expose = params.expose ?? false;
    this.details = params.details;
  }
}

export class InputValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({
      message,
      code: "INPUT_VALIDATION_ERROR",
      statusCode: 400,
      expose: true,
      details
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super({
      message,
      code: "UNAUTHORIZED",
      statusCode: 401,
      expose: true
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", details?: Record<string, unknown>) {
    super({
      message,
      code: "NOT_FOUND",
      statusCode: 404,
      expose: true,
      details
    });
  }
}

export class UpstreamServiceError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super({
      message,
      code: "UPSTREAM_SERVICE_ERROR",
      statusCode: 502,
      expose: false,
      details,
      cause
    });
  }
}

export class RateLimitExceededError extends AppError {
  constructor(message = "Too many requests") {
    super({
      message,
      code: "RATE_LIMIT_EXCEEDED",
      statusCode: 429,
      expose: true
    });
  }
}
