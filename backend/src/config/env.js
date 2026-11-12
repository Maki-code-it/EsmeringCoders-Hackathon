import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load the single root-level .env (shared with Vite). Missing file is fine in CI.
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(currentDir, '../../../.env');
dotenv.config({ path: rootEnvPath, quiet: true });

const toList = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Central, read-only backend configuration. PRIVATE: never send to the browser.
 */
export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  frontendUrls: toList(process.env.FRONTEND_URL || 'http://localhost:5173'),

  // Development only: the Supabase auth user that owns data while sign-in is not
  // built yet. Ignored in production, where a signed-in user is required.
  devUserId: (process.env.DEV_USER_ID || '').trim(),

  supabase: Object.freeze({
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  }),

  // Placeholders only. Endpoints/request formats must come from the official
  // OVERCLOCK 2026 Lumen documentation. Headers: "lumen-api-key", "lumen-api-secret".
  lumen: Object.freeze({
    apiKey: process.env.LUMEN_API_KEY || '',
    apiSecret: process.env.LUMEN_API_SECRET || '',
    ocrEndpoint: process.env.LUMEN_OCR_ENDPOINT || '',
    chatEndpoint: process.env.LUMEN_CHAT_ENDPOINT || '',
  }),
});
