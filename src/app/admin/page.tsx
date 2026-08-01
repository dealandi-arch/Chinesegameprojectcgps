import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";
import { AdminUserRow } from "@/components/AdminUserRow";

type UserRow = Pick<User, "id" | "username" | "role" | "createdAt">;

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
    select: { id: true, username: true, role: true, createdAt: true },
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
            {users.map((u: UserRow) => (
              <AdminUserRow
                key={u.id}
                id={u.id}
                username={u.username}
                role={u.role}
                createdAt={u.createdAt.toISOString()}
              />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
