// Public frontend configuration. Everything here is bundled into browser code, so ONLY public values (VITE_*) belong here. Never add secrets.
export const env = Object.freeze({
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, ''),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
});
