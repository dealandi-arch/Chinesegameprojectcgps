"use client";

import { useEffect, useRef, useState } from "react";
import { getBattleView, submitBattleMove } from "@/app/actions/battles";
import { CardFace } from "@/components/cards/CardFace";
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
      <p className="text-sm text-stone-400">Waiting for an opponent to join…</p>
    );
  }

  const isYourTurn = view.turn === view.yourPlayerId;
  const you = view.you;
  const opponent = view.opponent;

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-400">{error}</p>}

      {view.phase === "GAME_OVER" && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-center">
          <p className="text-lg font-semibold text-amber-300">
            {view.winner === view.yourPlayerId ? "You win!" : "You lose."}
          </p>
        </div>
      )}

      {/* Opponent panel (read-only) */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Opponent {!isYourTurn && view.phase === "IN_PROGRESS" && (
              <span className="text-amber-300">(their turn)</span>
            )}
          </h3>
          <div className="text-xs text-stone-400">
            Deck {opponent.deckCount} · Discard {opponent.discard.length}
          </div>
        </div>
        <div className="mt-3 flex gap-4">
          <div className="w-40 shrink-0">
            <span className="mb-1 block text-xs font-medium text-stone-500">
              Active
            </span>
            {opponent.active ? (
              <CardFace card={opponent.active} size="full" />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-stone-600">
                Empty
              </div>
            )}
          </div>
          <div className="flex-1">
            <span className="mb-1 block text-xs font-medium text-stone-500">
              Hand ({opponent.handCount})
            </span>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: opponent.handCount }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-32 w-20 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-2xl"
                >
                  🂠
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Turn strip */}
      <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center text-sm text-stone-300">
        {view.phase === "IN_PROGRESS" && (
          <p>{isYourTurn ? "Your turn" : "Waiting for opponent…"}</p>
        )}
        <div className="mt-2 max-h-24 overflow-y-auto text-xs text-stone-500">
          {view.log.slice(-6).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      {/* Your panel (interactive) */}
      <div
        className={`rounded-xl border p-4 ${
          isYourTurn
            ? "border-amber-400/50 bg-amber-400/5"
            : "border-white/10 bg-white/5"
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            You {isYourTurn && <span className="text-amber-300">(your turn)</span>}
          </h3>
          <div className="text-xs text-stone-400">
            Deck {you.deckCount} · Discard {you.discard.length}
          </div>
        </div>

        <div className="mt-3 flex gap-4">
          <div className="w-40 shrink-0">
            <span className="mb-1 block text-xs font-medium text-stone-500">
              Active
            </span>
            {you.active ? (
              <>
                <CardFace card={you.active} size="full" />
                <div className="mt-2 flex flex-col gap-1">
                  {you.active.abilities.map((ability, i) => {
                    const affordable =
                      (you.active?.attachedEnergy ?? 0) >=
                      (ability.energyCost ?? 0);
                    const canAttack =
                      isYourTurn &&
                      !view.hasAttacked &&
                      affordable &&
                      Boolean(opponent.active) &&
                      !moving;
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          submitMove({
                            type: "ATTACK",
                            player: view.yourPlayerId,
                            attackIndex: i,
                          })
                        }
                        disabled={!canAttack}
                        className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
                      >
                        {ability.name} — {ability.damage ?? 0} dmg (
                        {ability.energyCost ?? 0}⚡)
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-stone-600">
                Empty
              </div>
            )}
          </div>

          <div className="flex-1">
            <span className="mb-1 block text-xs font-medium text-stone-500">
              Hand ({you.hand.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {you.hand.map((card, i) => {
                let label = "";
                let disabled = !isYourTurn || moving;
                let action: OnlineAction | null = null;

                if (card.role === "ATTACKER") {
                  label = "Play";
                  disabled = disabled || you.active !== null;
                  action = {
                    type: "PLAY_ATTACKER",
                    player: view.yourPlayerId,
                    handIndex: i,
                  };
                } else if (card.role === "ENERGY") {
                  label = "Attach";
                  disabled =
                    disabled || !you.active || you.energyPlayedThisTurn;
                  action = {
                    type: "PLAY_ENERGY",
                    player: view.yourPlayerId,
                    handIndex: i,
                  };
                } else {
                  label = "Use";
                  disabled = disabled || you.supportPlayedThisTurn;
                  action = {
                    type: "PLAY_SUPPORT",
                    player: view.yourPlayerId,
                    handIndex: i,
                  };
                }

                return (
                  <div key={`${card.id}-${i}`} className="w-28 shrink-0">
                    <CardFace card={card} size="compact" />
                    <button
                      onClick={() => action && submitMove(action)}
                      disabled={disabled}
                      className="mt-1 w-full rounded-full border border-white/10 py-1 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50 disabled:opacity-40"
                    >
                      {label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={() =>
              submitMove({ type: "END_TURN", player: view.yourPlayerId })
            }
            disabled={!isYourTurn || moving}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 hover:border-white/30 disabled:opacity-40"
          >
            End Turn
          </button>
        </div>
      </div>
    </div>
  );
}
