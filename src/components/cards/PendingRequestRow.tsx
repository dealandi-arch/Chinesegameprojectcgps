"use client";

import { useState, useTransition } from "react";
import {
  approveCardEditRequest,
  rejectCardEditRequest,
} from "@/app/actions/cards";
import type { CardEditRequest } from "@/lib/cards";

export function PendingRequestRow({
  request,
  proposerUsername,
  cardTitle,
}: {
  request: CardEditRequest;
  proposerUsername: string;
  cardTitle: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [isPending, startTransition] = useTransition();

  function approve(force: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await approveCardEditRequest(request.id, force);
      if (result.error) {
        setError(result.error);
        setConflict(Boolean(result.conflict));
      } else {
        setConflict(false);
      }
    });
  }

  function reject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectCardEditRequest(request.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-stone-500">
            {cardTitle ? `Edit to "${cardTitle}"` : "New card"} by{" "}
            <span className="text-stone-300">{proposerUsername}</span>
          </p>
          <h3 className="mt-1 text-sm font-semibold text-white">
            {request.title}
          </h3>
          <p className="mt-1 text-xs text-stone-400">
            {request.role}
            {request.cardType ? ` · ${request.cardType}` : ""}
            {request.role === "ATTACKER" && ` · ♥ ${request.hp}`}
            {request.role === "ENERGY" && ` · +${request.energyAmount}⚡`}
          </p>
          <p className="mt-1 text-xs text-stone-400">{request.body}</p>
        </div>
      </div>

      {request.imageUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {request.imageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              className="h-14 w-14 rounded-lg border border-white/10 object-cover"
            />
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-3 flex gap-2">
        {conflict ? (
          <button
            onClick={() => approve(true)}
            disabled={isPending}
            className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-60"
          >
            Approve Anyway
          </button>
        ) : (
          <button
            onClick={() => approve(false)}
            disabled={isPending}
            className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
          >
            Approve
          </button>
        )}
        <button
          onClick={reject}
          disabled={isPending}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 hover:border-white/30 disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
