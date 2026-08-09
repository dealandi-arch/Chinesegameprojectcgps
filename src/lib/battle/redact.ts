import type { BattleCard } from "@/lib/cards";
import type {
  BattlePhase,
  BattleState,
  LastAttack,
  PlayerId,
} from "@/lib/battle/types";

export type PublicPlayerView = {
  active: BattleCard | null;
  bench: BattleCard[];
  discard: BattleCard[];
  deckCount: number;
  energyPlayedThisTurn: boolean;
  supportPlayedThisTurn: boolean;
  hasSwitchedThisTurn: boolean;
  pendingBonusDamage: number;
};

export type RedactedBattleState = {
  phase: BattlePhase;
  turn: PlayerId;
  winner: PlayerId | null;
  hasAttacked: boolean;
  lastAttack: LastAttack | null;
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
    lastAttack: state.lastAttack,
    log: state.log,
    yourPlayerId: viewerId,
    you: {
      active: you.active,
      bench: you.bench,
      discard: you.discard,
      deckCount: you.deck.length,
      energyPlayedThisTurn: you.energyPlayedThisTurn,
      supportPlayedThisTurn: you.supportPlayedThisTurn,
      hasSwitchedThisTurn: you.hasSwitchedThisTurn,
      pendingBonusDamage: you.pendingBonusDamage,
      hand: you.hand,
    },
    opponent: {
      active: opponent.active,
      bench: opponent.bench,
      discard: opponent.discard,
      deckCount: opponent.deck.length,
      energyPlayedThisTurn: opponent.energyPlayedThisTurn,
      supportPlayedThisTurn: opponent.supportPlayedThisTurn,
      hasSwitchedThisTurn: opponent.hasSwitchedThisTurn,
      pendingBonusDamage: opponent.pendingBonusDamage,
      handCount: opponent.hand.length,
    },
  };
}
