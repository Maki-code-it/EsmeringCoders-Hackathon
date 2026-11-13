import { AppError } from './apiResponse.js';

// Owner comes from req.user.id (401 in production without it), else DEV_USER_ID; never from body/query. Without DEV_USER_ID in dev: 503 if devMissingMessage is set, else null (all rows).
export const createUserResolver = ({ requestKey, signInMessage, devMissingMessage }) => (req, res, next) => {
  const id = req.user?.id;
  if (id) {
    req[requestKey] = String(id);
    return next();
  }
  if (process.env.NODE_ENV === 'production') {
    return next(new AppError(signInMessage, 401, 'UNAUTHENTICATED'));
  }
  const devUserId = (process.env.DEV_USER_ID || '').trim();
  if (!devUserId && devMissingMessage) {
    return next(new AppError(devMissingMessage, 503, 'DEV_USER_NOT_CONFIGURED'));
  }
  req[requestKey] = devUserId || null;
  return next();
};

// Dashboard: in dev with no DEV_USER_ID it deliberately shows all rows (401 in production).
export const requireDashboardUser = createUserResolver({
  requestKey: 'dashboardUserId',
  signInMessage: 'Please sign in to view your dashboard',
});

export const requireDocumentsUser = createUserResolver({
  requestKey: 'documentUserId',
  signInMessage: 'Please sign in to manage your documents',
  devMissingMessage: 'Documents are not set up for local development yet. Set DEV_USER_ID in .env.',
});

export const requirePayrollUser = createUserResolver({
  requestKey: 'payrollUserId',
  signInMessage: 'Please sign in to use the payroll breakdown',
  devMissingMessage: 'Payroll is not set up for local development yet. Set DEV_USER_ID in .env.',
});
