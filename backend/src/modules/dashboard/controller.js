import { sendSuccess } from '../../middleware/apiResponse.js';
import { dashboardService } from './service.js';
import { parseHistoryQuery, parseRange } from './validators.js';

/** Thin HTTP layer. Express 5 forwards rejected promises to the error handler. */
export const createController = (service = dashboardService) => ({
  summary: async (req, res) =>
    sendSuccess(res, await service.getSummary(req.dashboardUserId), 'Dashboard summary loaded'),

  history: async (req, res) =>
    sendSuccess(
      res,
      await service.getHistory(req.dashboardUserId, parseHistoryQuery(req.query)),
      'Document history loaded',
    ),

  salaryTrends: async (req, res) =>
    sendSuccess(
      res,
      await service.getSalaryTrends(req.dashboardUserId, parseRange(req.query)),
      'Salary trends loaded',
    ),

  analytics: async (req, res) =>
    sendSuccess(
      res,
      await service.getAnalytics(req.dashboardUserId, parseRange(req.query)),
      'Analytics loaded',
    ),

  payrollReport: async (req, res) =>
    sendSuccess(
      res,
      await service.getPayrollReport(req.dashboardUserId, parseRange(req.query)),
      'Payroll report generated',
    ),
});

export const dashboardController = createController();
