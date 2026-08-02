import { redirect } from "next/navigation";
import { getCurrentUser, type Role } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { AdminUserRow } from "@/components/AdminUserRow";

const ROLE_ORDER: Record<Role, number> = { ADMIN: 0, CO_ADMIN: 1, USER: 2 };

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.listUsers({
    perPage: 200,
  });

  const users = (error ? [] : data.users)
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

  return (
    <main className="flex-1 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="mt-1 text-sm text-stone-400">
          Grant or remove co-admin status for players.
        </p>

        <table className="mt-8 w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-stone-500">
              <th className="pb-2 font-medium">Username</th>
              <th className="pb-2 font-medium">Role</th>
              <th className="pb-2 font-medium">Joined</th>
              <th className="pb-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <AdminUserRow
                key={u.id}
                id={u.id}
                username={u.username}
                role={u.role}
                createdAt={u.createdAt}
              />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
