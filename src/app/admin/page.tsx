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
import { AdminTabs } from "@/components/admin/AdminTabs";
import { RoleNominationPanel } from "@/components/governance/RoleNominationPanel";
import { VoteNotificationList } from "@/components/notifications/VoteNotificationList";
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

  const votesNeedingMyVote = openVotes.filter(
    (v) => !v.ballotAdminIds.includes(currentUser.id)
  );
  const notificationBadge = isAdmin
    ? votesNeedingMyVote.length + pendingRequests.length
    : myProposals.filter((p) => p.status !== "PENDING").length;

  const usersTabContent = (
    <div>
      <table className="w-full border-collapse">
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

      {isAdmin && (
        <div className="mt-8">
          <RoleNominationPanel users={users} openVotes={openVotes} />
        </div>
      )}
    </div>
  );

  const notificationsTabContent = isAdmin ? (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Votes Needing Your Agreement
        </h2>
        <div className="mt-4">
          <VoteNotificationList
            openVotes={openVotes}
            users={users}
            currentAdminId={currentUser.id}
          />
        </div>
      </div>
      <PendingRequestList
        requests={pendingRequests}
        users={users}
        packs={packs}
      />
    </div>
  ) : (
    <div>
      <h2 className="text-lg font-semibold text-white">
        Your Proposal Updates
      </h2>
      <div className="mt-4">
        {myProposals.length === 0 ? (
          <p className="text-sm text-stone-500">
            You haven&apos;t proposed any pack edits yet.
          </p>
        ) : (
          <MyProposalsList proposals={myProposals} />
        )}
      </div>
    </div>
  );

  const packsTabContent = (
    <PackManager mode={isAdmin ? "admin" : "propose"} packs={packs} />
  );

  return (
    <main className="flex-1 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white">
          {isAdmin ? "Admin Panel" : "Co-Admin Panel"}
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          {isAdmin
            ? "Manage players, run role votes, and review pack content."
            : "View players and propose pack content edits for an admin to review."}
        </p>

        <AdminTabs
          tabs={[
            { key: "users", label: "Users", content: usersTabContent },
            {
              key: "notifications",
              label: "Notifications",
              content: notificationsTabContent,
              badge: notificationBadge,
            },
            { key: "packs", label: "Packs", content: packsTabContent },
          ]}
        />
      </div>
    </main>
  );
}
