import { logger } from "../utils/logger.js";

export function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, req, res, _next) {
  const statusCode = error.statusCode || error.status || 500;

  logger.error("request_error", {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });

  res.status(statusCode).json({
    requestId: req.id,
    message: error.message || "Unexpected server error",
    details: process.env.NODE_ENV === "production" ? undefined : error.details
  });
}
