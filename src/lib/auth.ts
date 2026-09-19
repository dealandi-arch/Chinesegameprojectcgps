import { createClient } from "@/utils/supabase/server";

export type Role = "USER" | "CO_ADMIN" | "ADMIN";

export type CurrentUser = {
  id: string;
  username: string;
  role: Role;
  // Super admin is a flag layered on top of the role, not a fourth role
  // value -- so every existing `role === "ADMIN"` check keeps working and
  // governance votes (USER <-> CO_ADMIN <-> ADMIN) stay untouched. It
  // grants destructive powers ordinary admins don't have, like deleting
  // staff chat messages.
  isSuperAdmin: boolean;
};

export type UserAppMetadata = {
  username?: string;
  role?: Role;
  super_admin?: boolean;
};

export function readIsSuperAdmin(appMetadata: unknown): boolean {
  return (appMetadata as UserAppMetadata | null)?.super_admin === true;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  // getUser() re-validates against Supabase Auth on every call (unlike
  // getSession()), so role changes made via the Admin API take effect
  // immediately instead of waiting for a token refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const meta = user.app_metadata as UserAppMetadata;

  return {
    id: user.id,
    username: meta.username ?? user.email?.split("@")[0] ?? "unknown",
    role: meta.role ?? "USER",
    isSuperAdmin: readIsSuperAdmin(user.app_metadata),
  };
}
