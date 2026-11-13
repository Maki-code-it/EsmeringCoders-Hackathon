import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { payrollController as c } from './controller.js';
import { resolvePayrollUser } from './userContext.js';
import { validatePayslipBody, validateRecordId } from './validators.js';

/**
 * Payroll breakdown API, mounted at /api/payroll by the project lead (app.js).
 *
 *   POST   /preview       calculate a breakdown without saving
 *   GET    /records       list the user's saved breakdowns
 *   POST   /records       calculate and save a breakdown
 *   GET    /records/:id   load one saved breakdown
 *   DELETE /records/:id   delete one saved breakdown
 */
const router = Router();

// Preview needs no user: it only calculates and stores nothing.
router.post('/preview', validateRequest(validatePayslipBody), c.preview);

router.use('/records', resolvePayrollUser);
router.get('/records', c.list);
router.post('/records', validateRequest(validatePayslipBody), c.create);
router.get('/records/:id', validateRequest(validateRecordId), c.get);
router.delete('/records/:id', validateRequest(validateRecordId), c.remove);

export default router;
