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
      className={`flex h-full flex-col overflow-hidden rounded-2xl border p-2 shadow-sm transition-colors sm:p-3 ${
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

      {/* Active card — sits near the shared middle of the mat */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {active ? (
          <div className="flex flex-col items-center gap-1">
            <div className="w-24 sm:w-28">
              <CardFace card={active} size="full" theme="light" />
            </div>
            {interactive && (
              <div className="flex flex-wrap justify-center gap-1">
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
                      className="rounded-full bg-red-600 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
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
          <div className="flex h-20 w-16 items-center justify-center rounded-xl border border-dashed border-amber-300 bg-white/40 text-[11px] text-stone-400">
            Empty
          </div>
        )}
      </div>

      {/* Edge band — bench centered along the middle of the edge, hand in the corner */}
      <div className="flex shrink-0 items-end gap-2">
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[11px] font-medium text-stone-500">
            Bench ({bench.length}/{MAX_BENCH_SIZE})
          </span>
          <div className="flex justify-center gap-1 overflow-x-auto">
            {bench.map((card, i) => (
              <div key={`${card.id}-${i}`} className="w-14 shrink-0 sm:w-16">
                <CardFace card={card} size="compact" theme="light" />
                {interactive && (
                  <button
                    onClick={() => onSwitch?.(i)}
                    disabled={!canAct || hasSwitchedThisTurn}
                    className="mt-0.5 w-full rounded-full border border-amber-300 py-0.5 text-[10px] font-medium text-stone-600 transition-colors hover:border-amber-500 disabled:opacity-40"
                  >
                    Switch In
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <span className="text-[11px] font-medium text-stone-500">
            Hand ({interactive ? (hand?.length ?? 0) : (handCount ?? 0)})
          </span>
          <div className="flex justify-end gap-1 overflow-x-auto">
            {interactive
              ? (hand ?? []).map((card, i) => {
                  let actionLabel = "";
                  let disabled = !canAct;
                  let onClick = () => {};

                  if (card.role === "ATTACKER") {
                    actionLabel = "Play";
                    disabled =
                      disabled ||
                      (active !== null && bench.length >= MAX_BENCH_SIZE);
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
                    <div key={`${card.id}-${i}`} className="w-14 shrink-0 sm:w-16">
                      <CardFace card={card} size="compact" theme="light" />
                      <button
                        onClick={onClick}
                        disabled={disabled}
                        className="mt-0.5 w-full rounded-full border border-amber-300 py-0.5 text-[10px] font-medium text-stone-600 transition-colors hover:border-amber-500 disabled:opacity-40"
                      >
                        {actionLabel}
                      </button>
                    </div>
                  );
                })
              : Array.from({ length: handCount ?? 0 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-16 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-gradient-to-br from-red-600 to-red-800 text-base text-amber-100 shadow-sm sm:h-20 sm:w-14"
                  >
                    🂠
                  </div>
                ))}
          </div>
        </div>
      </div>

      {interactive && (
        <div className="mt-1 flex shrink-0 justify-center">
          <button
            onClick={onEndTurn}
            disabled={!canAct}
            className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-600 transition-colors hover:border-stone-500 disabled:opacity-40"
          >
            End Turn
          </button>
        </div>
      )}
    </div>
  );
}
