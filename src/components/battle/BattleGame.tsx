"use client";

import { useMemo, useReducer } from "react";
import { battleReducer, createInitialState } from "@/lib/battle/engine";
import { toBattleCard, type Card, type BattleCard } from "@/lib/cards";
import { PlayerZone } from "@/components/battle/PlayerZone";
import { BattleLegend } from "@/components/battle/BattleLegend";
import { getAttackEffects } from "@/components/battle/attackEffects";
import type { PlayerId } from "@/lib/battle/types";

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

  if (state.phase === "NOT_ENOUGH_CARDS") {
    return (
      <p className="text-sm text-stone-600">
        No attacker cards exist yet — an admin needs to create at least one
        before a duel can start.
      </p>
    );
  }

  const turnId: PlayerId = state.turn;
  const otherId: PlayerId = turnId === "P1" ? "P2" : "P1";
  const turnPlayer = state.players[turnId];
  const otherPlayer = state.players[otherId];

  return (
    <div className={`flex flex-col gap-4 ${shaking ? "animate-battle-shake" : ""}`}>
      <BattleLegend />

      {state.phase === "GAME_OVER" && (
        <div className="rounded-xl border border-amber-400 bg-amber-100 p-4 text-center">
          <p className="text-lg font-semibold text-amber-700">
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

      <PlayerZone
        label={otherId === "P1" ? "Player 1" : "Player 2"}
        isTurnHolder={false}
        flashed={flashTarget === otherId}
        active={otherPlayer.active}
        bench={otherPlayer.bench}
        discardCount={otherPlayer.discard.length}
        deckCount={otherPlayer.deck.length}
        energyPlayedThisTurn={otherPlayer.energyPlayedThisTurn}
        supportPlayedThisTurn={otherPlayer.supportPlayedThisTurn}
        hasSwitchedThisTurn={otherPlayer.hasSwitchedThisTurn}
        interactive={false}
        handCount={otherPlayer.hand.length}
      />

      <div className="rounded-xl border border-amber-200 bg-white/70 p-3">
        {state.phase === "IN_PROGRESS" && (
          <p className="text-center text-sm text-stone-700">
            Turn: <span className="font-semibold text-stone-900">{turnId}</span>
          </p>
        )}
        <div className="mt-2 max-h-24 overflow-y-auto text-xs text-stone-500">
          {state.log.slice(-6).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      <PlayerZone
        label={`${turnId === "P1" ? "Player 1" : "Player 2"} (your turn)`}
        isTurnHolder={true}
        flashed={flashTarget === turnId}
        active={turnPlayer.active}
        bench={turnPlayer.bench}
        discardCount={turnPlayer.discard.length}
        deckCount={turnPlayer.deck.length}
        energyPlayedThisTurn={turnPlayer.energyPlayedThisTurn}
        supportPlayedThisTurn={turnPlayer.supportPlayedThisTurn}
        hasSwitchedThisTurn={turnPlayer.hasSwitchedThisTurn}
        interactive
        hand={turnPlayer.hand}
        isYourTurn={state.phase === "IN_PROGRESS"}
        hasAttacked={state.hasAttacked}
        opponentHasActive={Boolean(otherPlayer.active)}
        onPlayAttacker={(handIndex) =>
          dispatch({ type: "PLAY_ATTACKER", player: turnId, handIndex })
        }
        onPlayEnergy={(handIndex) =>
          dispatch({ type: "PLAY_ENERGY", player: turnId, handIndex })
        }
        onPlaySupport={(handIndex) =>
          dispatch({ type: "PLAY_SUPPORT", player: turnId, handIndex })
        }
        onAttack={(attackIndex) =>
          dispatch({ type: "ATTACK", player: turnId, attackIndex })
        }
        onSwitch={(benchIndex) =>
          dispatch({ type: "SWITCH_ACTIVE", player: turnId, benchIndex })
        }
        onEndTurn={() => dispatch({ type: "END_TURN", player: turnId })}
      />
    </div>
  );
}
