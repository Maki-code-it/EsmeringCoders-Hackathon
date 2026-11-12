import { AppError } from '../../middleware/apiResponse.js';

/**
 * The dashboard has NO sign-in logic. Sign-in belongs to the auth owner, whose
 * shared middleware must run before this router and set `req.user = { id }`
 * (the verified user id). This guard only reads that value; it never reads a
 * user id from the query string or body.
 */
export const requireAuthenticatedUser = (req, res, next) => {
  const id = req.user?.id;
  if (!id) {
    return next(new AppError('Please sign in to view your dashboard', 401, 'UNAUTHENTICATED'));
  }
  req.dashboardUserId = String(id);
  return next();
};
