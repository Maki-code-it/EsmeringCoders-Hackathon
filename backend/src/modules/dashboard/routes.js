import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { dashboardController as c } from './controller.js';
import { requireDashboardUser } from '../../middleware/userContext.js';
import { validateHistoryQuery, validateRangeQuery } from './validators.js';

// Dashboard router. The project lead registers it in app.js. All routes are read-only (GET). This module does not implement sign-in.
const router = Router();

router.use(requireDashboardUser);

router.get('/summary', c.summary);
router.get('/history', validateRequest(validateHistoryQuery), c.history);
router.get('/salary-trends', validateRequest(validateRangeQuery), c.salaryTrends);
router.get('/analytics', validateRequest(validateRangeQuery), c.analytics);
router.get('/reports/payroll', validateRequest(validateRangeQuery), c.payrollReport);

export default router;
