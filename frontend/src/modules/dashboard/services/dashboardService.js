import { api } from '@/services/apiClient.js';

/**
 * Dashboard API calls. All HTTP goes through the shared api client. This module
 * has no sign-in logic: attaching the user's credentials to requests is the
 * auth owner's job (in the shared client), and the backend decides who the user is.
 */

const withQuery = (path, params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  return qs ? `${path}?${qs}` : path;
};

const get = (path, params, signal) => api.get(withQuery(path, params), { signal });

export const getSummary = (signal) => get('/dashboard/summary', {}, signal);
export const getSalaryTrends = (range, signal) => get('/dashboard/salary-trends', range, signal);
export const getAnalytics = (range, signal) => get('/dashboard/analytics', range, signal);
export const getHistory = (params, signal) => get('/dashboard/history', params, signal);
export const getPayrollReport = (range, signal) => get('/dashboard/reports/payroll', range, signal);
