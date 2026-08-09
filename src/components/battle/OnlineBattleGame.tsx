"use client";

import { useEffect, useRef, useState } from "react";
import { getBattleView, submitBattleMove } from "@/app/actions/battles";
import { PlayerZone } from "@/components/battle/PlayerZone";
import { BattleLegend } from "@/components/battle/BattleLegend";
import { getAttackEffects } from "@/components/battle/attackEffects";
import type { RedactedBattleState } from "@/lib/battle/redact";
import type { BattleAction } from "@/lib/battle/types";

type OnlineAction = Exclude<BattleAction, { type: "RESET" }>;
type BattleStatus = "WAITING" | "ACTIVE" | "FINISHED";

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

  const versionRef = useRef(version);
  useEffect(() => {
    versionRef.current = version;
  }, [version]);

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
      <p className="text-sm text-stone-600">Waiting for an opponent to join…</p>
    );
  }

  const isYourTurn = view.turn === view.yourPlayerId;
  const opponentId = view.yourPlayerId === "P1" ? "P2" : "P1";

  return (
    <div className={`flex flex-col gap-4 ${shaking ? "animate-battle-shake" : ""}`}>
      <BattleLegend />

      {error && <p className="text-sm text-red-500">{error}</p>}

      {view.phase === "GAME_OVER" && (
        <div className="rounded-xl border border-amber-400 bg-amber-100 p-4 text-center">
          <p className="text-lg font-semibold text-amber-700">
            {view.winner === view.yourPlayerId ? "You win!" : "You lose."}
          </p>
        </div>
      )}

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
      />

      <div className="rounded-xl border border-amber-200 bg-white/70 p-3">
        {view.phase === "IN_PROGRESS" && (
          <p className="text-center text-sm text-stone-700">
            {isYourTurn ? "Your turn" : "Waiting for opponent…"}
          </p>
        )}
        <div className="mt-2 max-h-24 overflow-y-auto text-xs text-stone-500">
          {view.log.slice(-6).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

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
  );
}
