import { readIsSuperAdmin, type Role, type UserAppMetadata } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

const ROLE_ORDER: Record<Role, number> = { ADMIN: 0, CO_ADMIN: 1, USER: 2 };

export type DirectoryUser = {
  id: string;
  username: string;
  role: Role;
  isSuperAdmin: boolean;
  createdAt: string;
};

export async function getAllUsers(): Promise<DirectoryUser[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.listUsers({
    perPage: 200,
  });

  return (error ? [] : data.users)
    .map((u) => {
      const meta = u.app_metadata as UserAppMetadata;
      return {
        id: u.id,
        username: meta.username ?? u.email?.split("@")[0] ?? "unknown",
        role: meta.role ?? "USER",
        isSuperAdmin: readIsSuperAdmin(u.app_metadata),
        createdAt: u.created_at,
      };
    })
    .sort((a, b) => {
      // Super admins sort above other admins, then by role, then by name.
      if (a.isSuperAdmin !== b.isSuperAdmin) return a.isSuperAdmin ? -1 : 1;
      if (ROLE_ORDER[a.role] !== ROLE_ORDER[b.role]) {
        return ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
      }
      return a.username.localeCompare(b.username);
    });
}
