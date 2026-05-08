import { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "@openfinch/shared";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  traceId: string;
}

export function generateTraceId(): string {
  return crypto.randomUUID();
}

/**
 * Middleware that adds a traceId to every response header.
 */
export const traceIdMiddleware: MiddlewareHandler = async (c, next) => {
  const traceId = generateTraceId();
  c.header("X-Trace-Id", traceId);
  await next();
};

/**
 * Global error handler that returns consistent JSON error responses.
 */
export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (err) {
    const traceId = generateTraceId();
    c.header("X-Trace-Id", traceId);

    if (err instanceof HTTPException) {
      const status = err.status;
      const response: ApiErrorResponse = {
        error: {
          code: getCodeForStatus(status),
          message: err.message || "An error occurred",
        },
        traceId,
      };

      logger.warn(`HTTP ${status}`, {
        traceId,
        method: c.req.method,
        path: c.req.path,
        message: err.message,
      });

      return c.json(response, status as 400 | 401 | 403 | 404 | 429 | 500);
    }

    if (err instanceof Error) {
      const response: ApiErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
        traceId,
      };

      logger.error("Unhandled error", {
        traceId,
        method: c.req.method,
        path: c.req.path,
        error: err.message,
        stack: err.stack,
      });

      return c.json(response, 500);
    }

    // Non-Error throw
    const response: ApiErrorResponse = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      traceId,
    };

    logger.error("Unhandled non-error throw", {
      traceId,
      method: c.req.method,
      path: c.req.path,
      error: String(err),
    });

    return c.json(response, 500);
  }
};

function getCodeForStatus(status: number): string {
  switch (status) {
    case 400: return "BAD_REQUEST";
    case 401: return "UNAUTHORIZED";
    case 403: return "FORBIDDEN";
    case 404: return "NOT_FOUND";
    case 429: return "RATE_LIMITED";
    default: return "ERROR";
  }
}
