/**
 * Supabase client wrappers — Undangin.studio
 *
 * Two clients are exported:
 *  1. `supabaseBrowser` — Uses NEXT_PUBLIC_ keys, safe for client components.
 *  2. `supabaseAdmin`   — Uses SUPABASE_SERVICE_ROLE_KEY, SERVER-SIDE ONLY.
 *                         This client bypasses Row Level Security (RLS).
 *                         NEVER import in client components or pages.
 */
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Browser Client (Client Components, useEffect, etc.)
// Uses anon key — RLS enforced. Safe to expose.
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[Undangin.studio] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
  );
}

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ---------------------------------------------------------------------------
// Admin / Server Client (Server Actions, Route Handlers, Server Components)
// Uses service role key — bypasses RLS. NEVER expose to browser.
// ---------------------------------------------------------------------------

/**
 * Creates a privileged Supabase admin client.
 * Must ONLY be called from server-side code.
 * Throws at import time if the env var is missing.
 */
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "[Undangin.studio] SUPABASE_SERVICE_ROLE_KEY is required for admin operations. " +
        "This variable must remain server-side only."
    );
  }

  return createClient(supabaseUrl!, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
