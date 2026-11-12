import { AppError } from '../../middleware/apiResponse.js';

/**
 * Reads `req.user = { id }` populated by the shared auth middleware.
 * Never reads user_id from request body or query params.
 */
export const requireAuthenticatedUser = (req, res, next) => {
  const id = req.user?.id;
  if (!id) {
    return next(new AppError('Please sign in to manage your documents', 401, 'UNAUTHENTICATED'));
  }
  req.documentUserId = String(id);
  return next();
};