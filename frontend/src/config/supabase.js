import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

let client = null;

export const isSupabaseConfigured = () => Boolean(env.supabaseUrl && env.supabaseAnonKey);

/**
 * Returns the shared browser Supabase client (public URL + anon key only), or
 * null when not configured. Prepared for future Supabase Auth; no auth flows
 * are implemented yet. The service-role key must never be used here.
 */
export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseAnonKey);
  }
  return client;
};
