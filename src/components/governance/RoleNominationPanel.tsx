"use client";

import { useState, useTransition } from "react";
import { startRoleVote } from "@/app/actions/governance";
import type { OpenRoleVote, RoleVoteDirection } from "@/lib/governance";
import type { DirectoryUser } from "@/lib/users";

export function RoleNominationPanel({
  users,
  openVotes,
}: {
  users: DirectoryUser[];
  openVotes: OpenRoleVote[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const members = users.filter((u) => u.role === "USER");
  const coAdmins = users.filter((u) => u.role === "CO_ADMIN");
  const admins = users.filter((u) => u.role === "ADMIN");
  const votesByTarget = new Map(openVotes.map((v) => [v.targetUserId, v]));

  function nominate(userId: string, direction: RoleVoteDirection) {
    setError(null);
    startTransition(async () => {
      const result = await startRoleVote(userId, direction);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Role Governance</h2>
      <p className="mt-1 text-sm text-stone-400">
        Promoting a member to co-admin, or a co-admin to admin, needs 2 or 3
        agreements from admins or co-admins respectively. Demoting an admin
        back to co-admin needs 2 agreements. Starting a vote counts as your
        own agreement — check Notifications to agree to open votes.
      </p>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Members
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {members.length === 0 && (
              <p className="text-sm text-stone-500">No members.</p>
            )}
            {members.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
              >
                <span className="text-sm text-white">{u.username}</span>
                <button
                  onClick={() => nominate(u.id, "PROMOTE_MEMBER")}
                  disabled={isPending || votesByTarget.has(u.id)}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50 disabled:opacity-50"
                >
                  {votesByTarget.has(u.id)
                    ? "Vote Open"
                    : "Start Promotion Vote"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Co-Admins
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {coAdmins.length === 0 && (
              <p className="text-sm text-stone-500">No co-admins.</p>
            )}
            {coAdmins.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
              >
                <span className="text-sm text-white">{u.username}</span>
                <button
                  onClick={() => nominate(u.id, "PROMOTE")}
                  disabled={isPending || votesByTarget.has(u.id)}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50 disabled:opacity-50"
                >
                  {votesByTarget.has(u.id)
                    ? "Vote Open"
                    : "Start Promotion Vote"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Admins
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {admins.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
              >
                <span className="text-sm text-white">{u.username}</span>
                <button
                  onClick={() => nominate(u.id, "DEMOTE")}
                  disabled={
                    isPending || admins.length <= 1 || votesByTarget.has(u.id)
                  }
                  className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50 disabled:opacity-50"
                >
                  {votesByTarget.has(u.id) ? "Vote Open" : "Start Demotion Vote"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
