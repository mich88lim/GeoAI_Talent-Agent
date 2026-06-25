import { createClient } from '@supabase/supabase-js'

// Service-role client — SERVER ONLY, never expose to the browser.
// Bypasses Row-Level Security. Use only for privileged server-side operations
// (e.g., checking the admin_allowlist during registration).
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_KEY is not set')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
