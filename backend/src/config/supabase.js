import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { AppError } from '../middleware/apiResponse.js';

let adminClient = null;

// Whether the backend has the minimum Supabase configuration.
export const isSupabaseConfigured = () =>
  Boolean(env.supabase.url && env.supabase.serviceRoleKey);

// Returns a lazily created, reusable Supabase client that uses the service-role key.
export const getSupabaseAdminClient = () => {
  if (!isSupabaseConfigured()) {
    throw new AppError(
      'Supabase is not configured on the server',
      503,
      'SUPABASE_NOT_CONFIGURED',
    );
  }

  if (!adminClient) {
    adminClient = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return adminClient;
};
