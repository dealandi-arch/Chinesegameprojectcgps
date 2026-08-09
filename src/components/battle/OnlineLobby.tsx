"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBattle, joinBattle, getBattleView } from "@/app/actions/battles";

export function OnlineLobby() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState<{
    battleId: string;
    joinCode: string;
  } | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleCreate() {
    setError(null);
    setIsPending(true);
    const result = await createBattle();
    setIsPending(false);

    if (result.error !== null) {
      setError(result.error);
      return;
    }

    setWaitingRoom({ battleId: result.battleId, joinCode: result.joinCode });

    pollRef.current = setInterval(async () => {
      const view = await getBattleView(result.battleId);
      if (view.error === null && view.status === "ACTIVE") {
        if (pollRef.current) clearInterval(pollRef.current);
        router.push(`/play/online/${result.battleId}`);
      }
    }, 2000);
  }

  async function handleJoin() {
    setError(null);
    if (!joinCodeInput.trim()) {
      setError("Enter a room code.");
      return;
    }
    setIsPending(true);
    const result = await joinBattle(joinCodeInput);
    setIsPending(false);

    if (result.error !== null) {
      setError(result.error);
      return;
    }
    router.push(`/play/online/${result.battleId}`);
  }

  if (waitingRoom) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-stone-600">Share this code:</p>
        <p className="mt-2 text-4xl font-bold tracking-widest text-red-700">
          {waitingRoom.joinCode}
        </p>
        <p className="mt-4 text-sm text-stone-600">
          Waiting for an opponent to join…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-stone-900">Create a Room</h2>
        <p className="mt-1 text-sm text-stone-600">
          Get a code to share with your opponent.
        </p>
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create Room"}
        </button>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-stone-900">Join a Room</h2>
        <p className="mt-1 text-sm text-stone-600">
          Enter the code your opponent shared.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm uppercase tracking-widest text-stone-900 outline-none focus:border-amber-500"
          />
          <button
            onClick={handleJoin}
            disabled={isPending}
            className="rounded-full border border-amber-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-amber-500 disabled:opacity-60"
          >
            {isPending ? "Joining…" : "Join"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
