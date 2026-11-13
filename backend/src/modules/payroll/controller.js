import { sendSuccess } from '../../middleware/apiResponse.js';
import { payrollService } from './service.js';
import { parsePayslipBody } from './validators.js';

/** Thin HTTP layer. Express 5 forwards rejected promises to the error handler. */
export const createController = (service = payrollService) => ({
  preview: (req, res) =>
    sendSuccess(res, service.preview(parsePayslipBody(req.body)), 'Payroll breakdown calculated'),

  list: async (req, res) =>
    sendSuccess(res, await service.listRecords(req.payrollUserId), 'Payroll records loaded'),

  get: async (req, res) =>
    sendSuccess(res, await service.getRecord(req.payrollUserId, req.params.id), 'Payroll record loaded'),

  create: async (req, res) =>
    sendSuccess(
      res,
      await service.createRecord(req.payrollUserId, parsePayslipBody(req.body)),
      'Payroll breakdown saved',
      201,
    ),

  remove: async (req, res) =>
    sendSuccess(res, await service.deleteRecord(req.payrollUserId, req.params.id), 'Payroll record deleted'),
});

export const payrollController = createController();
