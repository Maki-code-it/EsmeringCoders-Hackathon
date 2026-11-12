import { AppError, sendError } from './apiResponse.js';

/** 404 for any unmatched route. */
export const notFoundHandler = (req, res) =>
  sendError(res, 404, 'Resource not found', 'NOT_FOUND');

/**
 * Centralized error handler. Must be registered last.
 * Never exposes stack traces or internal error messages to clients, and never
 * logs request bodies (they may contain payslip or contract data).
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.code, err.details);
  }

  // Malformed JSON body from express.json()
  if (err?.type === 'entity.parse.failed') {
    return sendError(res, 400, 'Request body contains invalid JSON', 'INVALID_JSON');
  }

  if (err?.type === 'entity.too.large') {
    return sendError(res, 413, 'Request body is too large', 'PAYLOAD_TOO_LARGE');
  }

  // Log only the error name/message, not the request payload.
  console.error(`[error] ${req.method} ${req.path}:`, err?.name, err?.message);

  return sendError(res, 500, 'An unexpected error occurred', 'INTERNAL_SERVER_ERROR');
};
