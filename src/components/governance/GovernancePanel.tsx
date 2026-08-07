"use client";

import { useState, useTransition } from "react";
import { startRoleVote, agreeToRoleVote } from "@/app/actions/governance";
import type { OpenRoleVote } from "@/lib/governance";
import type { DirectoryUser } from "@/lib/users";

export function GovernancePanel({
  users,
  openVotes,
  currentAdminId,
}: {
  users: DirectoryUser[];
  openVotes: OpenRoleVote[];
  currentAdminId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const admins = users.filter((u) => u.role === "ADMIN");
  const coAdmins = users.filter((u) => u.role === "CO_ADMIN");
  const votesByTarget = new Map(openVotes.map((v) => [v.targetUserId, v]));
  const usernameById = new Map(users.map((u) => [u.id, u.username]));

  function nominate(userId: string, direction: "PROMOTE" | "DEMOTE") {
    setError(null);
    startTransition(async () => {
      const result = await startRoleVote(userId, direction);
      if (result.error) setError(result.error);
    });
  }

  function agree(voteId: string) {
    setError(null);
    startTransition(async () => {
      const result = await agreeToRoleVote(voteId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Role Governance</h2>
      <p className="mt-1 text-sm text-stone-400">
        Promoting a co-admin to admin needs 3 admins to agree. Demoting an
        admin back to co-admin needs 2 admins to agree.
      </p>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {openVotes.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
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
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50 disabled:opacity-50"
                >
                  {alreadyVoted ? "Agreed" : "Agree"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
                  Start Promotion Vote
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
                  Start Demotion Vote
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
