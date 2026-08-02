import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS and can manage any user via the Admin
 * API (create/list/update users, set app_metadata). Server-only — never
 * import this from a "use client" file or expose the service role key to
 * the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
