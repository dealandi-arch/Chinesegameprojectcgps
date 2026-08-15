"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { battleReducer, createInitialState } from "@/lib/battle/engine";
import { chooseAIAction } from "@/lib/battle/ai";
import { toBattleCard, type Card, type BattleCard } from "@/lib/cards";
import { PlayerZone } from "@/components/battle/PlayerZone";
import { BattleLegend } from "@/components/battle/BattleLegend";
import { BattleLog } from "@/components/battle/BattleLog";
import { getAttackEffects } from "@/components/battle/attackEffects";
import { useGameTheme } from "@/components/theme/ThemeContext";
import type { AiOpponent } from "@/lib/battle/aiRoster";
import type { BattleAction, BattleState, PlayerId } from "@/lib/battle/types";

const HUMAN: PlayerId = "P1";
const AI: PlayerId = "P2";
const AI_MOVE_DELAY_MS = 700;

const STRIP_THEME = {
  light: { bar: "border-amber-200 bg-white/80", text: "text-stone-700", log: "text-stone-500", banner: "border-amber-400 bg-amber-100 text-amber-700" },
  dark: { bar: "border-white/10 bg-white/5", text: "text-stone-200", log: "text-stone-500", banner: "border-white/20 bg-white/10 text-stone-100" },
  lime: { bar: "border-lime-300 bg-white/80", text: "text-lime-900", log: "text-stone-500", banner: "border-lime-400 bg-lime-100 text-lime-800" },
} as const;

type HumanAction = Exclude<BattleAction, { type: "RESET" }>;

export function AIBattleGame({
  cards,
  opponent,
}: {
  cards: Card[];
  opponent: AiOpponent;
}) {
  const battleCards = useMemo<BattleCard[]>(() => cards.map(toBattleCard), [cards]);
  const [state, setState] = useState<BattleState>(() =>
    createInitialState(battleCards)
  );

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const aiRunningRef = useRef(false);

  useEffect(() => {
    if (state.phase !== "IN_PROGRESS" || state.turn !== AI) return;
    if (aiRunningRef.current) return;
    aiRunningRef.current = true;
    let cancelled = false;

    (async () => {
      let iterations = 0;
      while (!cancelled && iterations++ < 20) {
        await new Promise((resolve) => setTimeout(resolve, AI_MOVE_DELAY_MS));
        if (cancelled) break;

        const current = stateRef.current;
        if (current.phase !== "IN_PROGRESS" || current.turn !== AI) break;

        const action = chooseAIAction(current, AI, opponent.level);
        const next = battleReducer(current, action);
        stateRef.current = next;
        setState(next);

        if (action.type === "END_TURN" || next.phase !== "IN_PROGRESS") break;
      }
      aiRunningRef.current = false;
    })();

    return () => {
      cancelled = true;
      aiRunningRef.current = false;
    };
  }, [state.turn, state.phase, opponent.level]);

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

  function dispatchHuman(action: HumanAction) {
    if (state.turn !== HUMAN) return;
    setState((prev) => battleReducer(prev, action));
  }

  const human = state.players[HUMAN];
  const ai = state.players[AI];
  const isYourTurn = state.turn === HUMAN && state.phase === "IN_PROGRESS";

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="shrink-0">
        <BattleLegend />
      </div>

      {state.phase === "GAME_OVER" && (
        <div className={`shrink-0 rounded-xl border p-4 text-center ${st.banner}`}>
          <p className="text-lg font-semibold">
            {state.winner === HUMAN ? "You win!" : `${opponent.name} wins.`}
          </p>
          <button
            onClick={() =>
              setState(battleReducer(state, { type: "RESET", cards: battleCards }))
            }
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
        <div className="min-h-0 flex-1">
          <PlayerZone
            label={`${opponent.emoji} ${opponent.name} · ${opponent.title}`}
            isTurnHolder={state.turn === AI && state.phase === "IN_PROGRESS"}
            flashed={flashTarget === AI}
            active={ai.active}
            bench={ai.bench}
            discardCount={ai.discard.length}
            deckCount={ai.deck.length}
            energyPlayedThisTurn={ai.energyPlayedThisTurn}
            supportPlayedThisTurn={ai.supportPlayedThisTurn}
            hasSwitchedThisTurn={ai.hasSwitchedThisTurn}
            interactive={false}
            handCount={ai.hand.length}
            rotated
          />
        </div>

        <div className={`shrink-0 rounded-lg border px-2 py-0.5 ${st.bar}`}>
          {state.phase === "IN_PROGRESS" && (
            <p className={`text-center text-[11px] ${st.text}`}>
              {isYourTurn ? "Your turn" : `${opponent.name} is thinking…`}
            </p>
          )}
          <BattleLog log={state.log} className={st.log} />
        </div>

        <div className="min-h-0 flex-1">
          <PlayerZone
            label="You"
            isTurnHolder={isYourTurn}
            flashed={flashTarget === HUMAN}
            active={human.active}
            bench={human.bench}
            discardCount={human.discard.length}
            deckCount={human.deck.length}
            energyPlayedThisTurn={human.energyPlayedThisTurn}
            supportPlayedThisTurn={human.supportPlayedThisTurn}
            hasSwitchedThisTurn={human.hasSwitchedThisTurn}
            interactive
            hand={human.hand}
            isYourTurn={isYourTurn}
            hasAttacked={state.hasAttacked}
            opponentHasActive={Boolean(ai.active)}
            onPlayAttacker={(handIndex) =>
              dispatchHuman({ type: "PLAY_ATTACKER", player: HUMAN, handIndex })
            }
            onPlayEnergy={(handIndex) =>
              dispatchHuman({ type: "PLAY_ENERGY", player: HUMAN, handIndex })
            }
            onPlaySupport={(handIndex) =>
              dispatchHuman({ type: "PLAY_SUPPORT", player: HUMAN, handIndex })
            }
            onAttack={(attackIndex) =>
              dispatchHuman({ type: "ATTACK", player: HUMAN, attackIndex })
            }
            onSwitch={(benchIndex) =>
              dispatchHuman({ type: "SWITCH_ACTIVE", player: HUMAN, benchIndex })
            }
            onEndTurn={() => dispatchHuman({ type: "END_TURN", player: HUMAN })}
          />
        </div>
      </div>
    </div>
  );
}
