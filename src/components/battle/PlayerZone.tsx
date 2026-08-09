"use client";

import { CardFace } from "@/components/cards/CardFace";
import { MAX_BENCH_SIZE } from "@/lib/battle/engine";
import type { BattleCard } from "@/lib/cards";

export function PlayerZone({
  label,
  isTurnHolder,
  flashed,
  active,
  bench,
  discardCount,
  deckCount,
  energyPlayedThisTurn,
  supportPlayedThisTurn,
  hasSwitchedThisTurn,
  interactive,
  hand,
  handCount,
  isYourTurn = false,
  hasAttacked = false,
  opponentHasActive = false,
  moving = false,
  onPlayAttacker,
  onPlayEnergy,
  onPlaySupport,
  onAttack,
  onSwitch,
  onEndTurn,
}: {
  label: string;
  isTurnHolder: boolean;
  flashed: boolean;
  active: BattleCard | null;
  bench: BattleCard[];
  discardCount: number;
  deckCount: number;
  energyPlayedThisTurn: boolean;
  supportPlayedThisTurn: boolean;
  hasSwitchedThisTurn: boolean;
  interactive: boolean;
  hand?: BattleCard[];
  handCount?: number;
  isYourTurn?: boolean;
  hasAttacked?: boolean;
  opponentHasActive?: boolean;
  moving?: boolean;
  onPlayAttacker?: (handIndex: number) => void;
  onPlayEnergy?: (handIndex: number) => void;
  onPlaySupport?: (handIndex: number) => void;
  onAttack?: (attackIndex: number) => void;
  onSwitch?: (benchIndex: number) => void;
  onEndTurn?: () => void;
}) {
  const canAct = interactive && isYourTurn && !moving;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-colors ${
        isTurnHolder
          ? "border-amber-400 bg-amber-100/70"
          : "border-amber-200 bg-white/70"
      } ${flashed ? "animate-battle-flash" : ""}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-800">
          {label}{" "}
          {isTurnHolder && <span className="text-amber-600">(turn)</span>}
        </h3>
        <div className="text-xs text-stone-500">
          Deck {deckCount} · Discard {discardCount}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        <div className="w-36 shrink-0">
          <span className="mb-1 block text-xs font-medium text-stone-500">
            Active
          </span>
          {active ? (
            <>
              <CardFace card={active} size="full" theme="light" />
              {interactive && (
                <div className="mt-2 flex flex-col gap-1">
                  {active.abilities.map((ability, i) => {
                    const affordable =
                      active.attachedEnergy >= (ability.energyCost ?? 0);
                    const canAttack =
                      canAct && !hasAttacked && affordable && opponentHasActive;
                    return (
                      <button
                        key={i}
                        onClick={() => onAttack?.(i)}
                        disabled={!canAttack}
                        className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
                      >
                        {ability.name} — {ability.damage ?? 0} dmg (
                        {ability.energyCost ?? 0}⚡)
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-amber-300 bg-white/40 text-xs text-stone-400">
              Empty
            </div>
          )}
        </div>

        <div className="w-full sm:w-auto">
          <span className="mb-1 block text-xs font-medium text-stone-500">
            Bench ({bench.length}/{MAX_BENCH_SIZE})
          </span>
          <div className="flex gap-2">
            {bench.map((card, i) => (
              <div key={`${card.id}-${i}`} className="w-24 shrink-0">
                <CardFace card={card} size="compact" theme="light" />
                {interactive && (
                  <button
                    onClick={() => onSwitch?.(i)}
                    disabled={!canAct || hasSwitchedThisTurn}
                    className="mt-1 w-full rounded-full border border-amber-300 py-1 text-xs font-medium text-stone-600 transition-colors hover:border-amber-500 disabled:opacity-40"
                  >
                    Switch In
                  </button>
                )}
              </div>
            ))}
            {bench.length === 0 && (
              <p className="text-xs text-stone-400">No benched cards.</p>
            )}
          </div>
        </div>

        <div className="min-w-[200px] flex-1">
          <span className="mb-1 block text-xs font-medium text-stone-500">
            Hand ({interactive ? (hand?.length ?? 0) : (handCount ?? 0)})
          </span>
          {interactive ? (
            <div className="flex flex-wrap gap-2">
              {(hand ?? []).map((card, i) => {
                let actionLabel = "";
                let disabled = !canAct;
                let onClick = () => {};

                if (card.role === "ATTACKER") {
                  actionLabel = "Play";
                  disabled = disabled || (active !== null && bench.length >= MAX_BENCH_SIZE);
                  onClick = () => onPlayAttacker?.(i);
                } else if (card.role === "ENERGY") {
                  actionLabel = "Attach";
                  disabled = disabled || !active || energyPlayedThisTurn;
                  onClick = () => onPlayEnergy?.(i);
                } else {
                  actionLabel = "Use";
                  disabled = disabled || supportPlayedThisTurn;
                  onClick = () => onPlaySupport?.(i);
                }

                return (
                  <div key={`${card.id}-${i}`} className="w-24 shrink-0">
                    <CardFace card={card} size="compact" theme="light" />
                    <button
                      onClick={onClick}
                      disabled={disabled}
                      className="mt-1 w-full rounded-full border border-amber-300 py-1 text-xs font-medium text-stone-600 transition-colors hover:border-amber-500 disabled:opacity-40"
                    >
                      {actionLabel}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: handCount ?? 0 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-28 w-20 items-center justify-center rounded-xl border border-amber-300 bg-gradient-to-br from-red-600 to-red-800 text-2xl text-amber-100 shadow-sm"
                >
                  🂠
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {interactive && (
        <div className="mt-3">
          <button
            onClick={onEndTurn}
            disabled={!canAct}
            className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-500 disabled:opacity-40"
          >
            End Turn
          </button>
        </div>
      )}
    </div>
  );
}
