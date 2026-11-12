import { AppError } from '../../middleware/apiResponse.js';

/**
 * The dashboard has NO sign-in logic. If the auth owner's middleware sets
 * `req.user = { id }`, the dashboard scopes every query to that user. It never
 * reads a user id from the query string or body.
 *
 * While the app has no sign-in (development), the dashboard uses DEV_USER_ID
 * (same as the payroll module), or shows ALL rows if it is not set. That would
 * expose everyone's payroll data, so in production a missing user is refused
 * with 401.
 */
export const requireAuthenticatedUser = (req, res, next) => {
  const id = req.user?.id;
  if (id) {
    req.dashboardUserId = String(id);
    return next();
  }
  if (process.env.NODE_ENV === 'production') {
    return next(new AppError('Please sign in to view your dashboard', 401, 'UNAUTHENTICATED'));
  }
  // Development without sign-in: show the same user the payroll module saves
  // to (DEV_USER_ID), so what is stored is what is displayed. If it is not set,
  // fall back to showing all rows.
  req.dashboardUserId = (process.env.DEV_USER_ID || '').trim() || null;
  return next();
};
