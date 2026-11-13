import { env } from '../../config/env.js';
import { AppError } from '../../middleware/apiResponse.js';

/**
 * Decides which user owns the payroll data for this request. This module does
 * not implement sign-in. It never reads a user id from the query string or body.
 *
 *   1. Signed-in user (req.user.id, set by the auth middleware): use it.
 *   2. Production with no signed-in user: refuse with 401.
 *   3. Development with no sign-in: use DEV_USER_ID from .env, a real Supabase
 *      auth user created for local testing. Every query is still scoped to it.
 */
export const resolvePayrollUser = (req, res, next) => {
  const signedInId = req.user?.id;
  if (signedInId) {
    req.payrollUserId = String(signedInId);
    return next();
  }

  if (env.isProduction) {
    return next(new AppError('Please sign in to use the payroll breakdown', 401, 'UNAUTHENTICATED'));
  }

  if (!env.devUserId) {
    return next(
      new AppError(
        'Payroll is not set up for local development yet. Set DEV_USER_ID in .env.',
        503,
        'DEV_USER_NOT_CONFIGURED',
      ),
    );
  }

  req.payrollUserId = env.devUserId;
  return next();
};
