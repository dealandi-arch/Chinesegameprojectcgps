import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAllUsers } from "@/lib/users";
import {
  getAllCards,
  getPendingCardEditRequests,
  getMyPendingProposals,
} from "@/lib/cards";
import { getOpenRoleVotes } from "@/lib/governance";
import {
  getAllSlides,
  getPendingSlideEditRequests,
  getMySlideProposals,
} from "@/lib/slides";
import { AdminUserRow } from "@/components/AdminUserRow";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { RoleNominationPanel } from "@/components/governance/RoleNominationPanel";
import { VoteNotificationList } from "@/components/notifications/VoteNotificationList";
import { CardManager } from "@/components/cards/CardManager";
import { PendingRequestList } from "@/components/cards/PendingRequestList";
import { MyProposalsList } from "@/components/cards/MyProposalsList";
import { SlideManager } from "@/components/slides/SlideManager";
import { PendingSlideRequestList } from "@/components/slides/PendingSlideRequestList";
import { MySlideProposalsList } from "@/components/slides/MySlideProposalsList";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { getStaffMessages, sendStaffMessage } from "@/app/actions/chat";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "CO_ADMIN")
  ) {
    redirect("/");
  }

  const isAdmin = currentUser.role === "ADMIN";

  const [
    users,
    cards,
    pendingRequests,
    openVotes,
    myProposals,
    slides,
    pendingSlideRequests,
    mySlideProposals,
  ] = await Promise.all([
    getAllUsers(),
    getAllCards(),
    isAdmin ? getPendingCardEditRequests() : Promise.resolve([]),
    getOpenRoleVotes(),
    isAdmin ? Promise.resolve([]) : getMyPendingProposals(currentUser.id),
    getAllSlides(),
    isAdmin ? getPendingSlideEditRequests() : Promise.resolve([]),
    isAdmin ? Promise.resolve([]) : getMySlideProposals(currentUser.id),
  ]);

  const votesNeedingMyVote = openVotes.filter(
    (v) =>
      !v.yesVoterIds.includes(currentUser.id) &&
      !v.noVoterIds.includes(currentUser.id)
  );
  const notificationBadge =
    votesNeedingMyVote.length +
    (isAdmin
      ? pendingRequests.length + pendingSlideRequests.length
      : myProposals.filter((p) => p.status !== "PENDING").length +
        mySlideProposals.filter((p) => p.status !== "PENDING").length);

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

      <div className="mt-8">
        <RoleNominationPanel users={users} openVotes={openVotes} />
      </div>
    </div>
  );

  const notificationsTabContent = (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Votes Needing Your Agreement
        </h2>
        <div className="mt-4">
          <VoteNotificationList
            openVotes={openVotes}
            users={users}
            currentUserId={currentUser.id}
          />
        </div>
      </div>
      {isAdmin ? (
        <>
          <PendingRequestList
            requests={pendingRequests}
            users={users}
            cards={cards}
          />
          <PendingSlideRequestList
            requests={pendingSlideRequests}
            users={users}
            slides={slides}
          />
        </>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-white">
            Your Proposal Updates
          </h2>
          <div className="mt-4 flex flex-col gap-8">
            {myProposals.length === 0 ? (
              <p className="text-sm text-stone-500">
                You haven&apos;t proposed any card edits yet.
              </p>
            ) : (
              <MyProposalsList proposals={myProposals} />
            )}
            <MySlideProposalsList proposals={mySlideProposals} />
          </div>
        </div>
      )}
    </div>
  );

  const cardsTabContent = (
    <CardManager mode={isAdmin ? "admin" : "propose"} cards={cards} />
  );

  const slidesTabContent = (
    <SlideManager mode={isAdmin ? "admin" : "propose"} slides={slides} />
  );

  const chatTabContent = (
    <div>
      <h2 className="text-lg font-semibold text-white">Staff Chat</h2>
      <p className="mt-1 text-sm text-stone-400">
        Visible to admins and co-admins only.
      </p>
      <div className="mt-4">
        <ChatPanel
          fetchAction={getStaffMessages}
          sendAction={sendStaffMessage}
          theme="dark"
        />
      </div>
    </div>
  );

  return (
    <main className="flex-1 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white">
          {isAdmin ? "Admin Panel" : "Co-Admin Panel"}
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          {isAdmin
            ? "Manage players, run role votes, and review card content."
            : "View players, vote on role changes, and propose card content edits for an admin to review."}
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
            { key: "cards", label: "Cards", content: cardsTabContent },
            { key: "slides", label: "Slides", content: slidesTabContent },
            { key: "chat", label: "Chat", content: chatTabContent },
          ]}
        />
      </div>
    </main>
  );
}
