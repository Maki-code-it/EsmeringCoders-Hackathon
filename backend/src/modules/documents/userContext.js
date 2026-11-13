import { env } from '../../config/env.js';
import { AppError } from '../../middleware/apiResponse.js';

/**
 * Decides which user owns the documents for this request. Never reads user_id
 * from the request body or query params.
 *
 *   1. Signed-in user (req.user.id, set by the shared auth middleware): use it.
 *   2. Production with no signed-in user: refuse with 401.
 *   3. Development with no sign-in: use DEV_USER_ID from .env (same user as the
 *      payroll and dashboard modules), so stored data and displayed data match.
 */
export const requireAuthenticatedUser = (req, res, next) => {
  const id = req.user?.id;
  if (id) {
    req.documentUserId = String(id);
    return next();
  }

  if (env.isProduction) {
    return next(new AppError('Please sign in to manage your documents', 401, 'UNAUTHENTICATED'));
  }

  if (!env.devUserId) {
    return next(
      new AppError(
        'Documents are not set up for local development yet. Set DEV_USER_ID in .env.',
        503,
        'DEV_USER_NOT_CONFIGURED',
      ),
    );
  }

  req.documentUserId = env.devUserId;
  return next();
};
