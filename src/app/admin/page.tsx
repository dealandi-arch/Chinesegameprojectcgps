import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAllUsers } from "@/lib/users";
import {
  getAllPacks,
  getPendingPackEditRequests,
  getMyPendingProposals,
} from "@/lib/packs";
import { getOpenRoleVotes } from "@/lib/governance";
import { AdminUserRow } from "@/components/AdminUserRow";
import { GovernancePanel } from "@/components/governance/GovernancePanel";
import { PackManager } from "@/components/packs/PackManager";
import { PendingRequestList } from "@/components/packs/PendingRequestList";
import { MyProposalsList } from "@/components/packs/MyProposalsList";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "CO_ADMIN")
  ) {
    redirect("/");
  }

  const isAdmin = currentUser.role === "ADMIN";

  const [users, packs, pendingRequests, openVotes, myProposals] =
    await Promise.all([
      getAllUsers(),
      getAllPacks(),
      isAdmin ? getPendingPackEditRequests() : Promise.resolve([]),
      isAdmin ? getOpenRoleVotes() : Promise.resolve([]),
      isAdmin ? Promise.resolve([]) : getMyPendingProposals(currentUser.id),
    ]);

  return (
    <main className="flex-1 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white">
          {isAdmin ? "Admin Panel" : "Co-Admin Panel"}
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          {isAdmin
            ? "Grant or remove co-admin status, manage pack content, and run role votes."
            : "View players and propose pack content edits for an admin to review."}
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Users</h2>
          <table className="mt-4 w-full border-collapse">
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
                  canManage={isAdmin}
                />
              ))}
            </tbody>
          </table>
        </section>

        {isAdmin && (
          <section className="mt-10">
            <GovernancePanel
              users={users}
              openVotes={openVotes}
              currentAdminId={currentUser.id}
            />
          </section>
        )}

        {isAdmin && (
          <section className="mt-10">
            <PendingRequestList
              requests={pendingRequests}
              users={users}
              packs={packs}
            />
          </section>
        )}

        <section className="mt-10">
          <PackManager mode={isAdmin ? "admin" : "propose"} packs={packs} />
        </section>

        {!isAdmin && (
          <section className="mt-10">
            <MyProposalsList proposals={myProposals} />
          </section>
        )}
      </div>
    </main>
  );
}
