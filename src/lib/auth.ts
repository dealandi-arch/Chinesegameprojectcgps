import { createClient } from "@/utils/supabase/server";

export type Role = "USER" | "CO_ADMIN" | "ADMIN";

export type CurrentUser = {
  id: string;
  username: string;
  role: Role;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  // getUser() re-validates against Supabase Auth on every call (unlike
  // getSession()), so role changes made via the Admin API take effect
  // immediately instead of waiting for a token refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const meta = user.app_metadata as { username?: string; role?: Role };

  return {
    id: user.id,
    username: meta.username ?? user.email?.split("@")[0] ?? "unknown",
    role: meta.role ?? "USER",
  };
}
