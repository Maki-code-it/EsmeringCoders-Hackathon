/**
 * Shared API response contract.
 *
 * Success: { success: true,  message, data }
 * Error:   { success: false, message, error: { code, details } }
 */

export class AppError extends Error {
  /**
   * @param {string} message  Safe, user-facing message.
   * @param {number} statusCode  HTTP status code.
   * @param {string} code  Stable machine-readable error code.
   * @param {unknown} details  Safe extra info (e.g. field errors). Never internals.
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const sendSuccess = (
  res,
  data = {},
  message = 'Request completed successfully',
  statusCode = 200,
) => res.status(statusCode).json({ success: true, message, data });

export const sendError = (
  res,
  statusCode = 500,
  message = 'An error occurred',
  code = 'INTERNAL_SERVER_ERROR',
  details = null,
) => res.status(statusCode).json({ success: false, message, error: { code, details } });
