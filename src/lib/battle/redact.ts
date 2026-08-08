import type { BattleCard } from "@/lib/cards";
import type { BattlePhase, BattleState, PlayerId } from "@/lib/battle/types";

export type PublicPlayerView = {
  active: BattleCard | null;
  discard: BattleCard[];
  deckCount: number;
  energyPlayedThisTurn: boolean;
  supportPlayedThisTurn: boolean;
  pendingBonusDamage: number;
};

export type RedactedBattleState = {
  phase: BattlePhase;
  turn: PlayerId;
  winner: PlayerId | null;
  hasAttacked: boolean;
  log: string[];
  yourPlayerId: PlayerId;
  you: PublicPlayerView & { hand: BattleCard[] };
  opponent: PublicPlayerView & { handCount: number };
};

export function redactStateFor(
  state: BattleState,
  viewerId: PlayerId
): RedactedBattleState {
  const opponentId: PlayerId = viewerId === "P1" ? "P2" : "P1";
  const you = state.players[viewerId];
  const opponent = state.players[opponentId];

  return {
    phase: state.phase,
    turn: state.turn,
    winner: state.winner,
    hasAttacked: state.hasAttacked,
    log: state.log,
    yourPlayerId: viewerId,
    you: {
      active: you.active,
      discard: you.discard,
      deckCount: you.deck.length,
      energyPlayedThisTurn: you.energyPlayedThisTurn,
      supportPlayedThisTurn: you.supportPlayedThisTurn,
      pendingBonusDamage: you.pendingBonusDamage,
      hand: you.hand,
    },
    opponent: {
      active: opponent.active,
      discard: opponent.discard,
      deckCount: opponent.deck.length,
      energyPlayedThisTurn: opponent.energyPlayedThisTurn,
      supportPlayedThisTurn: opponent.supportPlayedThisTurn,
      pendingBonusDamage: opponent.pendingBonusDamage,
      handCount: opponent.hand.length,
    },
  };
}
