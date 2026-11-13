// Shared API response contract. Success: { success: true, message, data }; error: { success: false, message, error: { code, details } }

export class AppError extends Error {
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
