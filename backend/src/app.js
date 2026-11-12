import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { sendSuccess } from './middleware/apiResponse.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import dashboardRouter from './modules/dashboard/routes.js'; // LOCAL TEST ONLY - do not commit

const app = express();

app.disable('x-powered-by');

// CORS: only the configured frontend origin(s) may call the API from a browser.
app.use(
  cors({
    origin: env.frontendUrls,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ---------------------------------------------------------------------------
// API route registration (PROJECT LEAD ONLY)
// Each module exposes an Express router from its own folder. The lead registers
// it here under the /api prefix. Do NOT register routes anywhere else.
//
//   import documentsRouter from './modules/documents/routes.js';
//   app.use('/api/documents', documentsRouter);
//   app.use('/api/ai-assistant', aiAssistantRouter);
//   app.use('/api/payroll', payrollRouter);
//   app.use('/api/dashboard', dashboardRouter);
// ---------------------------------------------------------------------------

app.use('/api/dashboard', dashboardRouter); // LOCAL TEST ONLY - do not commit

app.get('/api/health', (req, res) =>
  sendSuccess(res, { status: 'healthy' }, 'SahodSuri API is running'),
);

// Must stay last
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
