"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBattle, joinBattle, getBattleView } from "@/app/actions/battles";
import { useGameTheme } from "@/components/theme/ThemeContext";

const LOBBY_THEME = {
  light: { box: "border-amber-200 bg-white", heading: "text-stone-900", body: "text-stone-600", code: "text-red-700", input: "border-amber-200 bg-white text-stone-900 focus:border-amber-500", joinBtn: "border-amber-300 text-stone-700 hover:border-amber-500" },
  dark: { box: "border-white/10 bg-white/5", heading: "text-white", body: "text-stone-400", code: "text-red-400", input: "border-white/15 bg-black/30 text-white focus:border-white/40", joinBtn: "border-white/20 text-stone-300 hover:border-white/40" },
  lime: { box: "border-lime-300 bg-white", heading: "text-lime-950", body: "text-stone-600", code: "text-red-700", input: "border-lime-300 bg-white text-lime-950 focus:border-lime-500", joinBtn: "border-lime-400 text-lime-800 hover:border-lime-600" },
} as const;

export function OnlineLobby() {
  const router = useRouter();
  const { theme } = useGameTheme();
  const t = LOBBY_THEME[theme];
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
      <div className={`rounded-2xl border p-6 text-center shadow-sm ${t.box}`}>
        <p className={`text-sm ${t.body}`}>Share this code:</p>
        <p className={`mt-2 text-4xl font-bold tracking-widest ${t.code}`}>
          {waitingRoom.joinCode}
        </p>
        <p className={`mt-4 text-sm ${t.body}`}>
          Waiting for an opponent to join…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={`rounded-2xl border p-6 shadow-sm ${t.box}`}>
        <h2 className={`font-semibold ${t.heading}`}>Create a Room</h2>
        <p className={`mt-1 text-sm ${t.body}`}>
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

      <div className={`rounded-2xl border p-6 shadow-sm ${t.box}`}>
        <h2 className={`font-semibold ${t.heading}`}>Join a Room</h2>
        <p className={`mt-1 text-sm ${t.body}`}>
          Enter the code your opponent shared.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm uppercase tracking-widest outline-none ${t.input}`}
          />
          <button
            onClick={handleJoin}
            disabled={isPending}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${t.joinBtn}`}
          >
            {isPending ? "Joining…" : "Join"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
