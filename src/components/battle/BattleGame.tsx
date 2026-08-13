"use client";

import { useMemo, useReducer } from "react";
import { battleReducer, createInitialState } from "@/lib/battle/engine";
import { toBattleCard, type Card, type BattleCard } from "@/lib/cards";
import { PlayerZone } from "@/components/battle/PlayerZone";
import { BattleLegend } from "@/components/battle/BattleLegend";
import { getAttackEffects } from "@/components/battle/attackEffects";
import { useGameTheme } from "@/components/theme/ThemeContext";

const STRIP_THEME = {
  light: { bar: "border-amber-200 bg-white/80", text: "text-stone-700", strong: "text-stone-900", log: "text-stone-500", banner: "border-amber-400 bg-amber-100 text-amber-700" },
  dark: { bar: "border-white/10 bg-white/5", text: "text-stone-200", strong: "text-white", log: "text-stone-500", banner: "border-white/20 bg-white/10 text-stone-100" },
  lime: { bar: "border-lime-300 bg-white/80", text: "text-lime-900", strong: "text-lime-950", log: "text-stone-500", banner: "border-lime-400 bg-lime-100 text-lime-800" },
} as const;

export function BattleGame({ cards }: { cards: Card[] }) {
  const battleCards = useMemo<BattleCard[]>(
    () => cards.map(toBattleCard),
    [cards]
  );
  const [state, dispatch] = useReducer(
    battleReducer,
    battleCards,
    createInitialState
  );

  const { shaking, flashTarget } = getAttackEffects(state.lastAttack);
  const { theme } = useGameTheme();
  const st = STRIP_THEME[theme];

  if (state.phase === "NOT_ENOUGH_CARDS") {
    return (
      <p className="text-sm opacity-70">
        No attacker cards exist yet — an admin needs to create at least one
        before a duel can start.
      </p>
    );
  }

  const p1 = state.players.P1;
  const p2 = state.players.P2;

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="shrink-0">
        <BattleLegend />
      </div>

      {state.phase === "GAME_OVER" && (
        <div className={`shrink-0 rounded-xl border p-4 text-center ${st.banner}`}>
          <p className="text-lg font-semibold">
            {state.winner} wins!
          </p>
          <button
            onClick={() => dispatch({ type: "RESET", cards: battleCards })}
            className="mt-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
          >
            Play Again
          </button>
        </div>
      )}

      <div
        className={`flex min-h-0 flex-1 flex-col gap-1 ${
          shaking ? "animate-battle-shake" : ""
        }`}
      >
        {/* Player 2 — always the top half (rotated), same full UI as Player
            1 below, just gated by whose turn it is rather than hidden.
            Local pass-and-play has both real players on one screen, so
            there's no reason to hide either hand — only online needs that. */}
        <div className="min-h-0 flex-1">
          <PlayerZone
            label="Player 2"
            isTurnHolder={state.turn === "P2" && state.phase === "IN_PROGRESS"}
            flashed={flashTarget === "P2"}
            active={p2.active}
            bench={p2.bench}
            discardCount={p2.discard.length}
            deckCount={p2.deck.length}
            energyPlayedThisTurn={p2.energyPlayedThisTurn}
            supportPlayedThisTurn={p2.supportPlayedThisTurn}
            hasSwitchedThisTurn={p2.hasSwitchedThisTurn}
            interactive
            hand={p2.hand}
            isYourTurn={state.turn === "P2" && state.phase === "IN_PROGRESS"}
            hasAttacked={state.hasAttacked}
            opponentHasActive={Boolean(p1.active)}
            onPlayAttacker={(handIndex) =>
              dispatch({ type: "PLAY_ATTACKER", player: "P2", handIndex })
            }
            onPlayEnergy={(handIndex) =>
              dispatch({ type: "PLAY_ENERGY", player: "P2", handIndex })
            }
            onPlaySupport={(handIndex) =>
              dispatch({ type: "PLAY_SUPPORT", player: "P2", handIndex })
            }
            onAttack={(attackIndex) =>
              dispatch({ type: "ATTACK", player: "P2", attackIndex })
            }
            onSwitch={(benchIndex) =>
              dispatch({ type: "SWITCH_ACTIVE", player: "P2", benchIndex })
            }
            onEndTurn={() => dispatch({ type: "END_TURN", player: "P2" })}
            rotated
          />
        </div>

        <div className={`shrink-0 rounded-lg border px-2 py-0.5 ${st.bar}`}>
          {state.phase === "IN_PROGRESS" && (
            <p className={`text-center text-[11px] ${st.text}`}>
              Turn:{" "}
              <span className={`font-semibold ${st.strong}`}>
                {state.turn === "P1" ? "Player 1" : "Player 2"}
              </span>
            </p>
          )}
          <div className={`max-h-6 overflow-y-auto text-center text-[10px] ${st.log}`}>
            {state.log.slice(-2).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        {/* Player 1 — always the bottom half. */}
        <div className="min-h-0 flex-1">
          <PlayerZone
            label="Player 1"
            isTurnHolder={state.turn === "P1" && state.phase === "IN_PROGRESS"}
            flashed={flashTarget === "P1"}
            active={p1.active}
            bench={p1.bench}
            discardCount={p1.discard.length}
            deckCount={p1.deck.length}
            energyPlayedThisTurn={p1.energyPlayedThisTurn}
            supportPlayedThisTurn={p1.supportPlayedThisTurn}
            hasSwitchedThisTurn={p1.hasSwitchedThisTurn}
            interactive
            hand={p1.hand}
            isYourTurn={state.turn === "P1" && state.phase === "IN_PROGRESS"}
            hasAttacked={state.hasAttacked}
            opponentHasActive={Boolean(p2.active)}
            onPlayAttacker={(handIndex) =>
              dispatch({ type: "PLAY_ATTACKER", player: "P1", handIndex })
            }
            onPlayEnergy={(handIndex) =>
              dispatch({ type: "PLAY_ENERGY", player: "P1", handIndex })
            }
            onPlaySupport={(handIndex) =>
              dispatch({ type: "PLAY_SUPPORT", player: "P1", handIndex })
            }
            onAttack={(attackIndex) =>
              dispatch({ type: "ATTACK", player: "P1", attackIndex })
            }
            onSwitch={(benchIndex) =>
              dispatch({ type: "SWITCH_ACTIVE", player: "P1", benchIndex })
            }
            onEndTurn={() => dispatch({ type: "END_TURN", player: "P1" })}
          />
        </div>
      </div>
    </div>
  );
}
