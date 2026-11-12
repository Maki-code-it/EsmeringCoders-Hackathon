import { AppError } from './apiResponse.js';

/**
 * Basic request validation preparation.
 *
 * Usage in a module route:
 *   router.post('/', validateRequest((req) => {
 *     const errors = {};
 *     if (!req.body?.name) errors.name = 'name is required';
 *     return errors;           // empty object = valid
 *   }), handler);
 *
 * The validator returns an object of { field: message }. Messages must be safe
 * to show to users and must never echo sensitive values.
 */
export const validateRequest = (validator) => (req, res, next) => {
  try {
    const errors = validator(req) || {};
    if (Object.keys(errors).length > 0) {
      return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors));
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
