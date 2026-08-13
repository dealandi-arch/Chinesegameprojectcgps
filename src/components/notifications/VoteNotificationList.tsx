"use client";

import { useState, useTransition } from "react";
import { agreeToRoleVote, disagreeWithRoleVote } from "@/app/actions/governance";
import type { OpenRoleVote, RoleVoteDirection } from "@/lib/governance";
import type { DirectoryUser } from "@/lib/users";

const DIRECTION_LABEL: Record<RoleVoteDirection, string> = {
  PROMOTE: "Promotion to Admin",
  DEMOTE: "Demotion to Co-Admin",
  PROMOTE_MEMBER: "Promotion to Co-Admin",
};

export function VoteNotificationList({
  openVotes,
  users,
  currentUserId,
}: {
  openVotes: OpenRoleVote[];
  users: DirectoryUser[];
  currentUserId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const usernameById = new Map(users.map((u) => [u.id, u.username]));

  function agree(voteId: string) {
    setError(null);
    startTransition(async () => {
      const result = await agreeToRoleVote(voteId);
      if (result.error) setError(result.error);
    });
  }

  function disagree(voteId: string) {
    setError(null);
    startTransition(async () => {
      const result = await disagreeWithRoleVote(voteId);
      if (result.error) setError(result.error);
    });
  }

  if (openVotes.length === 0) {
    return <p className="text-sm text-stone-500">No open role votes.</p>;
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      <div className="flex flex-col gap-3">
        {openVotes.map((vote) => {
          const alreadyVoted =
            vote.yesVoterIds.includes(currentUserId) ||
            vote.noVoterIds.includes(currentUserId);
          return (
            <div
              key={vote.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="text-sm text-white">
                <span className="font-semibold">
                  {usernameById.get(vote.targetUserId) ?? "unknown"}
                </span>{" "}
                <span className="text-stone-400">
                  — {DIRECTION_LABEL[vote.direction]} — {vote.netScore}/
                  {vote.requiredCount} (✓{vote.yesVoterIds.length} · ✗
                  {vote.noVoterIds.length})
                </span>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => agree(vote.id)}
                  disabled={isPending || alreadyVoted}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-emerald-400/50 disabled:opacity-50"
                >
                  Agree
                </button>
                <button
                  onClick={() => disagree(vote.id)}
                  disabled={isPending || alreadyVoted}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-red-400/50 disabled:opacity-50"
                >
                  No
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
