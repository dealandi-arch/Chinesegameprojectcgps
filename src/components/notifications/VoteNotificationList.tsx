"use client";

import { useState, useTransition } from "react";
import { agreeToRoleVote } from "@/app/actions/governance";
import type { OpenRoleVote } from "@/lib/governance";
import type { DirectoryUser } from "@/lib/users";

export function VoteNotificationList({
  openVotes,
  users,
  currentAdminId,
}: {
  openVotes: OpenRoleVote[];
  users: DirectoryUser[];
  currentAdminId: string;
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

  if (openVotes.length === 0) {
    return <p className="text-sm text-stone-500">No open role votes.</p>;
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      <div className="flex flex-col gap-3">
        {openVotes.map((vote) => {
          const alreadyVoted = vote.ballotAdminIds.includes(currentAdminId);
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
                  —{" "}
                  {vote.direction === "PROMOTE"
                    ? "Promotion to Admin"
                    : "Demotion to Co-Admin"}{" "}
                  — {vote.ballotAdminIds.length}/{vote.requiredCount} agreed
                </span>
              </div>
              <button
                onClick={() => agree(vote.id)}
                disabled={isPending || alreadyVoted}
                className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50 disabled:opacity-50"
              >
                {alreadyVoted ? "Agreed" : "Agree"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
