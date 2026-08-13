"use client";

import { CardFace } from "@/components/cards/CardFace";
import { MAX_BENCH_SIZE } from "@/lib/battle/engine";
import type { BattleCard } from "@/lib/cards";

// A play-mat half: label/deck info pinned at the outer edge, the active
// card near the shared middle of the screen, and a bottom band with the
// bench centered along the edge and the hand tucked into the corner. For
// the opponent's half this whole thing is rotated 180 degrees (via the
// `rotated` prop) so it reads as sitting "across the table" from you.
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
  rotated = false,
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
  rotated?: boolean;
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
      className={`flex h-full flex-col rounded-2xl border p-2 shadow-sm transition-colors sm:p-3 ${
        isTurnHolder
          ? "border-amber-400 bg-amber-100/70"
          : "border-amber-200 bg-white/70"
      } ${flashed ? "animate-battle-flash" : ""} ${rotated ? "rotate-180" : ""}`}
    >
      <div className="flex shrink-0 items-center justify-between text-xs">
        <span className="font-semibold text-stone-800">
          {label} {isTurnHolder && <span className="text-amber-600">●</span>}
        </span>
        <span className="text-stone-500">
          Deck {deckCount} · Discard {discardCount}
        </span>
      </div>

      {/* Active card — sits near the shared middle of the mat. No overflow
          clipping here: the card and its attack buttons must always be
          fully visible and clickable, never cut off. */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {active ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-32 sm:w-36">
              <CardFace card={active} size="full" theme="light" />
            </div>
            {interactive && (
              <div className="flex flex-wrap justify-center gap-1.5">
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
                      className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-500 disabled:opacity-40"
                    >
                      {ability.name} — {ability.damage ?? 0} dmg (
                      {ability.energyCost ?? 0}⚡)
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-24 w-20 items-center justify-center rounded-xl border border-dashed border-amber-300 bg-white/40 text-xs text-stone-400">
            Empty
          </div>
        )}
      </div>

      {/* Edge band — bench centered along the middle of the edge, hand in the corner */}
      <div className="flex shrink-0 items-end gap-2">
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs font-medium text-stone-500">
            Bench ({bench.length}/{MAX_BENCH_SIZE})
          </span>
          <div className="flex justify-center gap-1.5 overflow-x-auto">
            {bench.map((card, i) => (
              <div key={`${card.id}-${i}`} className="w-20 shrink-0 sm:w-24">
                <CardFace card={card} size="compact" theme="light" />
                {interactive && (
                  <button
                    onClick={() => onSwitch?.(i)}
                    disabled={!canAct || hasSwitchedThisTurn}
                    className="mt-1 w-full rounded-full bg-indigo-600 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-40"
                  >
                    Switch In
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <span className="text-xs font-medium text-stone-500">
            Hand ({interactive ? (hand?.length ?? 0) : (handCount ?? 0)})
          </span>
          <div className="flex justify-end gap-1.5 overflow-x-auto">
            {interactive
              ? (hand ?? []).map((card, i) => {
                  let actionLabel = "";
                  let actionColor = "";
                  let disabled = !canAct;
                  let onClick = () => {};

                  if (card.role === "ATTACKER") {
                    actionLabel = "Play";
                    actionColor = "bg-emerald-600 hover:bg-emerald-500";
                    disabled =
                      disabled ||
                      (active !== null && bench.length >= MAX_BENCH_SIZE);
                    onClick = () => onPlayAttacker?.(i);
                  } else if (card.role === "ENERGY") {
                    actionLabel = "Attach";
                    actionColor = "bg-amber-500 hover:bg-amber-400";
                    disabled = disabled || !active || energyPlayedThisTurn;
                    onClick = () => onPlayEnergy?.(i);
                  } else {
                    actionLabel = "Use";
                    actionColor = "bg-sky-600 hover:bg-sky-500";
                    disabled = disabled || supportPlayedThisTurn;
                    onClick = () => onPlaySupport?.(i);
                  }

                  return (
                    <div key={`${card.id}-${i}`} className="w-20 shrink-0 sm:w-24">
                      <CardFace card={card} size="compact" theme="light" />
                      <button
                        onClick={onClick}
                        disabled={disabled}
                        className={`mt-1 w-full rounded-full py-1 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-40 ${actionColor}`}
                      >
                        {actionLabel}
                      </button>
                    </div>
                  );
                })
              : Array.from({ length: handCount ?? 0 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-gradient-to-br from-red-600 to-red-800 text-lg text-amber-100 shadow-sm sm:h-24 sm:w-16"
                  >
                    🂠
                  </div>
                ))}
          </div>
        </div>
      </div>

      {interactive && (
        <div className="mt-1.5 flex shrink-0 justify-center">
          <button
            onClick={onEndTurn}
            disabled={!canAct}
            className="rounded-full bg-stone-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-stone-600 disabled:opacity-40"
          >
            End Turn
          </button>
        </div>
      )}
    </div>
  );
}
