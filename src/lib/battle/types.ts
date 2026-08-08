import type { BattleCard } from "@/lib/cards";

export type PlayerId = "P1" | "P2";

export type PlayerState = {
  id: PlayerId;
  deck: BattleCard[];
  hand: BattleCard[];
  active: BattleCard | null;
  discard: BattleCard[];
  energy: number;
  maxEnergy: number;
  turnsTaken: number;
};

export type BattlePhase = "NOT_ENOUGH_CARDS" | "IN_PROGRESS" | "GAME_OVER";

export type BattleState = {
  phase: BattlePhase;
  players: Record<PlayerId, PlayerState>;
  turn: PlayerId;
  winner: PlayerId | null;
  hasAttacked: boolean;
  log: string[];
};

export type BattleAction =
  | { type: "PLAY_CARD"; player: PlayerId; handIndex: number }
  | { type: "ATTACK"; player: PlayerId }
  | { type: "END_TURN"; player: PlayerId }
  | { type: "RESET"; cards: BattleCard[] };
