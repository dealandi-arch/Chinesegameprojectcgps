"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getBattleView, submitBattleMove } from "@/app/actions/battles";
import { getBattleMessages, sendBattleMessage } from "@/app/actions/chat";
import { PlayerZone } from "@/components/battle/PlayerZone";
import { BattleLegend } from "@/components/battle/BattleLegend";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { getAttackEffects } from "@/components/battle/attackEffects";
import { useGameTheme } from "@/components/theme/ThemeContext";
import type { RedactedBattleState } from "@/lib/battle/redact";
import type { BattleAction } from "@/lib/battle/types";

type OnlineAction = Exclude<BattleAction, { type: "RESET" }>;
type BattleStatus = "WAITING" | "ACTIVE" | "FINISHED";

const STRIP_THEME = {
  light: { bar: "border-amber-200 bg-white/80", text: "text-stone-700", log: "text-stone-500", chatBtn: "border-amber-300 text-stone-700 hover:border-amber-500", banner: "border-amber-400 bg-amber-100 text-amber-700" },
  dark: { bar: "border-white/10 bg-white/5", text: "text-stone-200", log: "text-stone-500", chatBtn: "border-white/20 text-stone-300 hover:border-white/40", banner: "border-white/20 bg-white/10 text-stone-100" },
  lime: { bar: "border-lime-300 bg-white/80", text: "text-lime-900", log: "text-stone-500", chatBtn: "border-lime-400 text-lime-800 hover:border-lime-600", banner: "border-lime-400 bg-lime-100 text-lime-800" },
} as const;

export function OnlineBattleGame({
  battleId,
  initialView,
  initialVersion,
  initialStatus,
}: {
  battleId: string;
  initialView: RedactedBattleState | null;
  initialVersion: number;
  initialStatus: BattleStatus;
}) {
  const [view, setView] = useState(initialView);
  const [version, setVersion] = useState(initialVersion);
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const versionRef = useRef(version);
  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  const fetchBattleMessages = useMemo(
    () => getBattleMessages.bind(null, battleId),
    [battleId]
  );
  const sendBattleChatMessage = useMemo(
    () => sendBattleMessage.bind(null, battleId),
    [battleId]
  );

  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getBattleView(battleId);
      if (result.error === null) {
        setStatus(result.status);
        setVersion(result.version);
        if (result.view) setView(result.view);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [battleId]);

  const { shaking, flashTarget } = getAttackEffects(view?.lastAttack ?? null);
  const { theme } = useGameTheme();
  const st = STRIP_THEME[theme];

  async function submitMove(action: OnlineAction) {
    setError(null);
    setMoving(true);
    const result = await submitBattleMove(battleId, action, versionRef.current);
    setMoving(false);

    if (result.error !== null) {
      setError(result.error);
      if (result.conflict) {
        const refreshed = await getBattleView(battleId);
        if (refreshed.error === null) {
          setStatus(refreshed.status);
          setVersion(refreshed.version);
          if (refreshed.view) setView(refreshed.view);
        }
      }
      return;
    }

    setView(result.view);
    setVersion(result.version);
    if (result.view.phase === "GAME_OVER") setStatus("FINISHED");
  }

  if (status === "WAITING" || !view) {
    return (
      <p className="text-sm opacity-70">Waiting for an opponent to join…</p>
    );
  }

  const isYourTurn = view.turn === view.yourPlayerId;
  const opponentId = view.yourPlayerId === "P1" ? "P2" : "P1";

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="shrink-0">
        <BattleLegend />
      </div>

      {error && <p className="shrink-0 text-sm text-red-500">{error}</p>}

      {view.phase === "GAME_OVER" && (
        <div className={`shrink-0 rounded-xl border p-4 text-center ${st.banner}`}>
          <p className="text-lg font-semibold">
            {view.winner === view.yourPlayerId ? "You win!" : "You lose."}
          </p>
        </div>
      )}

      <div
        className={`flex min-h-0 flex-1 flex-col gap-1 ${
          shaking ? "animate-battle-shake" : ""
        }`}
      >
        <div className="min-h-0 flex-1">
          <PlayerZone
            label="Opponent"
            isTurnHolder={!isYourTurn && view.phase === "IN_PROGRESS"}
            flashed={flashTarget === opponentId}
            active={view.opponent.active}
            bench={view.opponent.bench}
            discardCount={view.opponent.discard.length}
            deckCount={view.opponent.deckCount}
            energyPlayedThisTurn={view.opponent.energyPlayedThisTurn}
            supportPlayedThisTurn={view.opponent.supportPlayedThisTurn}
            hasSwitchedThisTurn={view.opponent.hasSwitchedThisTurn}
            interactive={false}
            handCount={view.opponent.handCount}
            rotated
          />
        </div>

        <div className={`shrink-0 rounded-lg border px-2 py-0.5 ${st.bar}`}>
          {view.phase === "IN_PROGRESS" && (
            <p className={`text-center text-[11px] ${st.text}`}>
              {isYourTurn ? "Your turn" : "Waiting for opponent…"}
            </p>
          )}
          <div className={`max-h-6 overflow-y-auto text-center text-[10px] ${st.log}`}>
            {view.log.slice(-2).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <PlayerZone
            label="You"
            isTurnHolder={isYourTurn && view.phase === "IN_PROGRESS"}
            flashed={flashTarget === view.yourPlayerId}
            active={view.you.active}
            bench={view.you.bench}
            discardCount={view.you.discard.length}
            deckCount={view.you.deckCount}
            energyPlayedThisTurn={view.you.energyPlayedThisTurn}
            supportPlayedThisTurn={view.you.supportPlayedThisTurn}
            hasSwitchedThisTurn={view.you.hasSwitchedThisTurn}
            interactive
            hand={view.you.hand}
            isYourTurn={isYourTurn && !moving && view.phase === "IN_PROGRESS"}
            hasAttacked={view.hasAttacked}
            opponentHasActive={Boolean(view.opponent.active)}
            moving={moving}
            onPlayAttacker={(handIndex) =>
              submitMove({ type: "PLAY_ATTACKER", player: view.yourPlayerId, handIndex })
            }
            onPlayEnergy={(handIndex) =>
              submitMove({ type: "PLAY_ENERGY", player: view.yourPlayerId, handIndex })
            }
            onPlaySupport={(handIndex) =>
              submitMove({ type: "PLAY_SUPPORT", player: view.yourPlayerId, handIndex })
            }
            onAttack={(attackIndex) =>
              submitMove({ type: "ATTACK", player: view.yourPlayerId, attackIndex })
            }
            onSwitch={(benchIndex) =>
              submitMove({ type: "SWITCH_ACTIVE", player: view.yourPlayerId, benchIndex })
            }
            onEndTurn={() =>
              submitMove({ type: "END_TURN", player: view.yourPlayerId })
            }
          />
        </div>
      </div>

      <div className="shrink-0">
        <button
          onClick={() => setChatOpen((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${st.chatBtn}`}
        >
          💬 Chat {chatOpen ? "▲" : "▼"}
        </button>
        {chatOpen && (
          <div className="mt-2">
            <ChatPanel
              fetchAction={fetchBattleMessages}
              sendAction={sendBattleChatMessage}
              heightClass="h-56"
            />
          </div>
        )}
      </div>
    </div>
  );
}
