import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { payrollController as c } from './controller.js';
import { requirePayrollUser } from '../../middleware/userContext.js';
import { validatePayslipBody, validateRecordId } from './validators.js';

// Payroll breakdown API, mounted at /api/payroll by the project lead (app.js).
const router = Router();

// Preview needs no user: it only calculates and stores nothing.
router.post('/preview', validateRequest(validatePayslipBody), c.preview);

router.use('/records', requirePayrollUser);
router.get('/records', c.list);
router.post('/records', validateRequest(validatePayslipBody), c.create);
router.get('/records/:id', validateRequest(validateRecordId), c.get);
router.delete('/records/:id', validateRequest(validateRecordId), c.remove);

export default router;
