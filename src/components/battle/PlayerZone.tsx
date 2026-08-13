"use client";

import { CardFace } from "@/components/cards/CardFace";
import { MAX_BENCH_SIZE } from "@/lib/battle/engine";
import { useGameTheme } from "@/components/theme/ThemeContext";
import type { BattleCard } from "@/lib/cards";

const ZONE_THEME = {
  light: {
    turnHolder: "border-amber-400 bg-amber-100/70",
    idle: "border-amber-200 bg-white/70",
    label: "text-stone-800",
    sub: "text-stone-500",
    emptyBox: "border-amber-300 bg-white/40 text-stone-400",
    endTurn: "bg-stone-700 text-white hover:bg-stone-600",
  },
  dark: {
    turnHolder: "border-amber-400 bg-amber-500/10",
    idle: "border-white/10 bg-white/5",
    label: "text-white",
    sub: "text-stone-400",
    emptyBox: "border-white/20 bg-black/20 text-stone-500",
    endTurn: "bg-stone-200 text-stone-900 hover:bg-white",
  },
  lime: {
    turnHolder: "border-lime-500 bg-lime-100/80",
    idle: "border-lime-300 bg-white/70",
    label: "text-lime-950",
    sub: "text-lime-700",
    emptyBox: "border-lime-400 bg-white/40 text-lime-600",
    endTurn: "bg-lime-700 text-white hover:bg-lime-600",
  },
} as const;

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
  const { theme } = useGameTheme();
  const zt = ZONE_THEME[theme];

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border p-1.5 shadow-sm transition-colors sm:p-2 ${
        isTurnHolder ? zt.turnHolder : zt.idle
      } ${flashed ? "animate-battle-flash" : ""} ${rotated ? "rotate-180" : ""}`}
    >
      <div className="flex shrink-0 items-center justify-between text-[11px]">
        <span className={`font-semibold ${zt.label}`}>
          {label} {isTurnHolder && <span className="text-amber-600">●</span>}
        </span>
        <span className={zt.sub}>
          Deck {deckCount} · Discard {discardCount}
        </span>
      </div>

      {/* Active card — offset toward one side rather than centered, so the
          two players' active cards (yours bottom-left, theirs top-right
          once its whole zone is rotated 180°) can never collide near the
          shared middle of the mat. Anchored to the top (not centered) and
          scrolls internally if the card + attack buttons are taller than
          the available space, instead of overflowing into the bench/hand
          row below and getting covered by it (which made attack buttons
          unclickable). */}
      <div className="flex min-h-0 flex-1 items-start justify-start overflow-y-auto pl-1 pt-1 sm:pl-3">
        {active ? (
          <div className="flex flex-col items-start gap-1.5">
            <div className="w-32 sm:w-36">
              <CardFace card={active} size="full" theme={theme} />
            </div>
            {interactive && (
              <div className="flex flex-col gap-1">
                {active.abilities.map((ability, i) => {
                  const energyCost = ability.energyCost ?? 0;
                  const affordable = active.attachedEnergy >= energyCost;
                  const canAttack =
                    canAct && !hasAttacked && affordable && opponentHasActive;
                  let reason: string | null = null;
                  if (canAct && !canAttack) {
                    if (hasAttacked) reason = "Already attacked this turn";
                    else if (!opponentHasActive) reason = "Opponent has no active card";
                    else if (!affordable)
                      reason = `Needs ${energyCost - active.attachedEnergy} more energy`;
                  }
                  return (
                    <div key={i}>
                      <button
                        onClick={() => onAttack?.(i)}
                        disabled={!canAttack}
                        className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-500 disabled:opacity-40"
                      >
                        {ability.name} — {ability.damage ?? 0} dmg (
                        {ability.energyCost ?? 0}⚡)
                      </button>
                      {reason && (
                        <p className={`mt-0.5 text-[10px] ${zt.sub}`}>
                          {reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex h-24 w-20 items-center justify-center rounded-xl border border-dashed text-xs ${zt.emptyBox}`}
          >
            Empty
          </div>
        )}
      </div>

      {/* Edge band — bench centered along the middle of the edge, hand in the corner */}
      <div className="flex shrink-0 items-end gap-1.5">
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className={`text-[10px] font-medium ${zt.sub}`}>
            Bench ({bench.length}/{MAX_BENCH_SIZE})
          </span>
          <div className="flex justify-center gap-1.5 overflow-x-auto">
            {bench.map((card, i) => (
              <div key={`${card.id}-${i}`} className="w-20 shrink-0 sm:w-24">
                <CardFace card={card} size="compact" theme={theme} />
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

        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <span className={`text-[10px] font-medium ${zt.sub}`}>
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
                      <CardFace card={card} size="compact" theme={theme} />
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
        <div className="mt-1 flex shrink-0 justify-center">
          <button
            onClick={onEndTurn}
            disabled={!canAct}
            className={`rounded-full px-4 py-1 text-xs font-semibold shadow-sm transition-colors disabled:opacity-40 ${zt.endTurn}`}
          >
            End Turn
          </button>
        </div>
      )}
    </div>
  );
}
