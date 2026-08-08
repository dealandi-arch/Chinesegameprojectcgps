import type { BattleCard } from "@/lib/cards";
import type {
  BattleAction,
  BattleState,
  PlayerId,
  PlayerState,
} from "@/lib/battle/types";

export const INITIAL_HAND_SIZE = 3;
export const MAX_HAND_SIZE = 7;
export const INITIAL_ENERGY_CAP = 1;
export const ENERGY_CAP_MAX = 10;

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function dealDecks(pool: BattleCard[]): {
  deckP1: BattleCard[];
  deckP2: BattleCard[];
} {
  const shuffled = shuffle(pool.map((c) => ({ ...c })));
  const deckP1: BattleCard[] = [];
  const deckP2: BattleCard[] = [];
  shuffled.forEach((card, i) => (i % 2 === 0 ? deckP1 : deckP2).push(card));
  return { deckP1, deckP2 };
}

function drawUpTo(player: PlayerState, count: number): PlayerState {
  const drawn: BattleCard[] = [];
  const deck = [...player.deck];
  for (
    let i = 0;
    i < count && deck.length > 0 && player.hand.length + drawn.length < MAX_HAND_SIZE;
    i++
  ) {
    drawn.push(deck.shift()!);
  }
  return { ...player, deck, hand: [...player.hand, ...drawn] };
}

function emptyPlayer(id: PlayerId): PlayerState {
  return {
    id,
    deck: [],
    hand: [],
    active: null,
    discard: [],
    energy: 0,
    maxEnergy: 0,
    turnsTaken: 0,
  };
}

function checkLoss(p: PlayerState): boolean {
  return p.active === null && p.hand.length === 0 && p.deck.length === 0;
}

export function createInitialState(cards: BattleCard[]): BattleState {
  if (cards.length < 2) {
    return {
      phase: "NOT_ENOUGH_CARDS",
      players: { P1: emptyPlayer("P1"), P2: emptyPlayer("P2") },
      turn: "P1",
      winner: null,
      hasAttacked: false,
      log: [],
    };
  }

  const { deckP1, deckP2 } = dealDecks(cards);

  // P1 is already "in" their first turn (turnsTaken = 1) so startTurn treats
  // P2's later first turn as turn 1 too (not accidentally turn 2) -- see
  // startTurn's turnsTaken > 1 check.
  const p1 = drawUpTo(
    {
      id: "P1",
      deck: deckP1,
      hand: [],
      active: null,
      discard: [],
      energy: INITIAL_ENERGY_CAP,
      maxEnergy: INITIAL_ENERGY_CAP,
      turnsTaken: 1,
    },
    INITIAL_HAND_SIZE
  );
  const p2 = drawUpTo(
    {
      id: "P2",
      deck: deckP2,
      hand: [],
      active: null,
      discard: [],
      energy: INITIAL_ENERGY_CAP,
      maxEnergy: INITIAL_ENERGY_CAP,
      turnsTaken: 0,
    },
    INITIAL_HAND_SIZE
  );

  return {
    phase: "IN_PROGRESS",
    players: { P1: p1, P2: p2 },
    turn: "P1",
    winner: null,
    hasAttacked: false,
    log: ["Match started."],
  };
}

function startTurn(state: BattleState, player: PlayerId): BattleState {
  const prev = state.players[player];
  const turnsTaken = prev.turnsTaken + 1;
  const maxEnergy =
    turnsTaken > 1
      ? Math.min(prev.maxEnergy + 1, ENERGY_CAP_MAX)
      : prev.maxEnergy;

  let p: PlayerState = {
    ...prev,
    turnsTaken,
    maxEnergy,
    energy: maxEnergy,
  };
  p = drawUpTo(p, 1);

  const next: BattleState = {
    ...state,
    turn: player,
    hasAttacked: false,
    players: { ...state.players, [player]: p },
  };

  if (checkLoss(p)) {
    const winner: PlayerId = player === "P1" ? "P2" : "P1";
    return {
      ...next,
      phase: "GAME_OVER",
      winner,
      log: [...next.log, `${player} has no cards left and loses.`],
    };
  }

  return next;
}

export function playCard(
  state: BattleState,
  player: PlayerId,
  handIndex: number
): BattleState {
  if (state.phase !== "IN_PROGRESS" || state.turn !== player) return state;
  const p = state.players[player];
  const card = p.hand[handIndex];
  if (!card || p.active !== null || card.cost > p.energy) return state;

  const hand = p.hand.filter((_, i) => i !== handIndex);
  const nextP: PlayerState = {
    ...p,
    hand,
    active: card,
    energy: p.energy - card.cost,
  };
  return {
    ...state,
    players: { ...state.players, [player]: nextP },
    log: [...state.log, `${player} plays ${card.title}.`],
  };
}

export function attack(state: BattleState, player: PlayerId): BattleState {
  if (state.phase !== "IN_PROGRESS" || state.turn !== player || state.hasAttacked) {
    return state;
  }
  const attacker = state.players[player];
  const opponentId: PlayerId = player === "P1" ? "P2" : "P1";
  const defender = state.players[opponentId];
  if (!attacker.active || !defender.active) return state;

  const remainingHp = defender.active.currentHp - attacker.active.attack;
  let nextDefender: PlayerState;
  let log = `${player}'s ${attacker.active.title} hits ${defender.active.title} for ${attacker.active.attack}.`;

  if (remainingHp <= 0) {
    nextDefender = {
      ...defender,
      active: null,
      discard: [...defender.discard, { ...defender.active, currentHp: 0 }],
    };
    log += ` ${defender.active.title} is destroyed.`;
  } else {
    nextDefender = {
      ...defender,
      active: { ...defender.active, currentHp: remainingHp },
    };
  }

  return {
    ...state,
    hasAttacked: true,
    players: { ...state.players, [opponentId]: nextDefender },
    log: [...state.log, log],
  };
}

export function endTurn(state: BattleState, player: PlayerId): BattleState {
  if (state.phase !== "IN_PROGRESS" || state.turn !== player) return state;
  const nextPlayer: PlayerId = player === "P1" ? "P2" : "P1";
  return startTurn(state, nextPlayer);
}

export function battleReducer(
  state: BattleState,
  action: BattleAction
): BattleState {
  switch (action.type) {
    case "PLAY_CARD":
      return playCard(state, action.player, action.handIndex);
    case "ATTACK":
      return attack(state, action.player);
    case "END_TURN":
      return endTurn(state, action.player);
    case "RESET":
      return createInitialState(action.cards);
    default:
      return state;
  }
}
