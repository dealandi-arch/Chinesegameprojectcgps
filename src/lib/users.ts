import { type Role } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

const ROLE_ORDER: Record<Role, number> = { ADMIN: 0, CO_ADMIN: 1, USER: 2 };

export type DirectoryUser = {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
};

export async function getAllUsers(): Promise<DirectoryUser[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.listUsers({
    perPage: 200,
  });

  return (error ? [] : data.users)
    .map((u) => {
      const meta = u.app_metadata as { username?: string; role?: Role };
      return {
        id: u.id,
        username: meta.username ?? u.email?.split("@")[0] ?? "unknown",
        role: meta.role ?? "USER",
        createdAt: u.created_at,
      };
    })
    .sort((a, b) => {
      if (ROLE_ORDER[a.role] !== ROLE_ORDER[b.role]) {
        return ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
      }
      return a.username.localeCompare(b.username);
    });
}
