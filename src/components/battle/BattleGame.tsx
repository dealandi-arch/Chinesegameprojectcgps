"use client";

import { useMemo, useReducer } from "react";
import { battleReducer, createInitialState } from "@/lib/battle/engine";
import { toBattleCard, type Card, type BattleCard } from "@/lib/cards";
import { CardFace } from "@/components/cards/CardFace";
import type { BattleState, PlayerId } from "@/lib/battle/types";

function PlayerPanel({
  id,
  label,
  state,
  dispatch,
}: {
  id: PlayerId;
  label: string;
  state: BattleState;
  dispatch: React.Dispatch<
    | { type: "PLAY_CARD"; player: PlayerId; handIndex: number }
    | { type: "ATTACK"; player: PlayerId }
    | { type: "END_TURN"; player: PlayerId }
  >;
}) {
  const player = state.players[id];
  const opponentId: PlayerId = id === "P1" ? "P2" : "P1";
  const opponent = state.players[opponentId];
  const isTurn = state.phase === "IN_PROGRESS" && state.turn === id;
  const canAttack =
    isTurn && !state.hasAttacked && Boolean(player.active) && Boolean(opponent.active);

  return (
    <div
      className={`rounded-xl border p-4 ${
        isTurn ? "border-amber-400/50 bg-amber-400/5" : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {label} {isTurn && <span className="text-amber-300">(your turn)</span>}
        </h3>
        <div className="text-xs text-stone-400">
          ⚡ {player.energy}/{player.maxEnergy} · Deck {player.deck.length} · Discard{" "}
          {player.discard.length}
        </div>
      </div>

      <div className="mt-3 flex gap-4">
        <div className="w-40 shrink-0">
          <span className="mb-1 block text-xs font-medium text-stone-500">
            Active
          </span>
          {player.active ? (
            <CardFace card={player.active} size="full" />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-stone-600">
              Empty
            </div>
          )}
        </div>

        <div className="flex-1">
          <span className="mb-1 block text-xs font-medium text-stone-500">
            Hand ({player.hand.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {player.hand.map((card, i) => (
              <button
                key={`${card.id}-${i}`}
                onClick={() => dispatch({ type: "PLAY_CARD", player: id, handIndex: i })}
                disabled={!isTurn || player.active !== null || card.cost > player.energy}
                className="w-24 shrink-0 text-left disabled:opacity-40"
              >
                <CardFace card={card} size="compact" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => dispatch({ type: "ATTACK", player: id })}
          disabled={!canAttack}
          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
        >
          Attack
        </button>
        <button
          onClick={() => dispatch({ type: "END_TURN", player: id })}
          disabled={!isTurn}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 hover:border-white/30 disabled:opacity-40"
        >
          End Turn
        </button>
      </div>
    </div>
  );
}

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

  if (state.phase === "NOT_ENOUGH_CARDS") {
    return (
      <p className="text-sm text-stone-400">
        Not enough cards exist yet — an admin needs to create at least 2
        before a duel can start.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {state.phase === "GAME_OVER" && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-center">
          <p className="text-lg font-semibold text-amber-300">
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

      <PlayerPanel id="P2" label="Player 2" state={state} dispatch={dispatch} />

      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
        {state.phase === "IN_PROGRESS" && (
          <p className="text-center text-sm text-stone-300">
            Turn: <span className="font-semibold text-white">{state.turn}</span>
          </p>
        )}
        <div className="mt-2 max-h-24 overflow-y-auto text-xs text-stone-500">
          {state.log.slice(-6).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      <PlayerPanel id="P1" label="Player 1" state={state} dispatch={dispatch} />
    </div>
  );
}
