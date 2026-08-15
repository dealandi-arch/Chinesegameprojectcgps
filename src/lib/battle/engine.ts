import type { BattleCard } from "@/lib/cards";
import type {
  BattleAction,
  BattleState,
  PlayerId,
  PlayerState,
} from "@/lib/battle/types";

export const INITIAL_HAND_SIZE = 3;
export const MAX_HAND_SIZE = 7;
export const DECK_SIZE = 60;
export const ENERGY_SLOT_COUNT = 20;
export const MAX_COPIES_PER_CARD = 4;
export const MAX_BENCH_SIZE = 3;

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Builds one DECK_SIZE-card deck from the shared card pool, like a
// constructed-format TCG deck: up to MAX_COPIES_PER_CARD of each unique
// Attacker/Support card, with the rest filled by Energy cards (unlimited
// copies, matching how Basic Energy works in real TCGs).
function buildDeck(pool: BattleCard[]): BattleCard[] {
  const energyCards = pool.filter((c) => c.role === "ENERGY");
  const nonEnergyCards = pool.filter((c) => c.role !== "ENERGY");

  const deck: BattleCard[] = [];
  const nonEnergyTarget =
    energyCards.length > 0 ? DECK_SIZE - ENERGY_SLOT_COUNT : DECK_SIZE;

  outer: for (const card of shuffle(nonEnergyCards)) {
    for (let i = 0; i < MAX_COPIES_PER_CARD; i++) {
      if (deck.length >= nonEnergyTarget) break outer;
      deck.push({ ...card });
    }
  }

  // If the unique Attacker/Support pool is too small to hit the non-energy
  // target even at the per-card copy cap, keep repeating existing
  // non-energy cards past the cap instead of letting the shortfall spill
  // into extra Energy cards below -- otherwise a small card pool silently
  // skews decks toward mostly Energy, handing out attachable energy
  // through deck-composition luck instead of real per-turn play.
  while (deck.length < nonEnergyTarget && nonEnergyCards.length > 0) {
    const pick =
      nonEnergyCards[Math.floor(Math.random() * nonEnergyCards.length)];
    deck.push({ ...pick });
  }

  while (deck.length < DECK_SIZE && energyCards.length > 0) {
    const pick = energyCards[Math.floor(Math.random() * energyCards.length)];
    deck.push({ ...pick });
  }

  // Fallback for a small pool: pad by repeating whatever exists (ignoring
  // the copy cap) so the deck still reaches DECK_SIZE rather than leaving
  // a match unplayable.
  while (deck.length < DECK_SIZE && pool.length > 0) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    deck.push({ ...pick });
  }

  return shuffle(deck);
}

export function dealDecks(pool: BattleCard[]): {
  deckP1: BattleCard[];
  deckP2: BattleCard[];
} {
  return { deckP1: buildDeck(pool), deckP2: buildDeck(pool) };
}

function drawUpTo(player: PlayerState, count: number): PlayerState {
  const drawn: BattleCard[] = [];
  const deck = [...player.deck];
  for (
    let i = 0;
    i < count &&
    deck.length > 0 &&
    player.hand.length + drawn.length < MAX_HAND_SIZE;
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
    bench: [],
    discard: [],
    energyPlayedThisTurn: false,
    supportPlayedThisTurn: false,
    hasSwitchedThisTurn: false,
    pendingBonusDamage: 0,
    turnsTaken: 0,
  };
}

function checkLoss(p: PlayerState): boolean {
  return (
    p.active === null &&
    p.bench.length === 0 &&
    p.hand.length === 0 &&
    p.deck.length === 0
  );
}

export function createInitialState(cards: BattleCard[]): BattleState {
  const hasAttacker = cards.some((c) => c.role === "ATTACKER");
  if (!hasAttacker) {
    return {
      phase: "NOT_ENOUGH_CARDS",
      players: { P1: emptyPlayer("P1"), P2: emptyPlayer("P2") },
      turn: "P1",
      winner: null,
      hasAttacked: false,
      lastAttack: null,
      log: [],
    };
  }

  const { deckP1, deckP2 } = dealDecks(cards);

  // P1 is already "in" their first turn (turnsTaken = 1) so startTurn treats
  // P2's later first turn as turn 1 too, not turn 2.
  const p1 = drawUpTo({ ...emptyPlayer("P1"), deck: deckP1, turnsTaken: 1 }, INITIAL_HAND_SIZE);
  const p2 = drawUpTo({ ...emptyPlayer("P2"), deck: deckP2 }, INITIAL_HAND_SIZE);

  return {
    phase: "IN_PROGRESS",
    players: { P1: p1, P2: p2 },
    turn: "P1",
    winner: null,
    hasAttacked: false,
    lastAttack: null,
    log: ["Match started."],
  };
}

function startTurn(state: BattleState, player: PlayerId): BattleState {
  let p: PlayerState = {
    ...state.players[player],
    turnsTaken: state.players[player].turnsTaken + 1,
    energyPlayedThisTurn: false,
    supportPlayedThisTurn: false,
    hasSwitchedThisTurn: false,
    pendingBonusDamage: 0,
  };
  p = drawUpTo(p, 1);

  const next: BattleState = {
    ...state,
    turn: player,
    hasAttacked: false,
    lastAttack: null,
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

export function playAttacker(
  state: BattleState,
  player: PlayerId,
  handIndex: number
): BattleState {
  if (state.phase !== "IN_PROGRESS" || state.turn !== player) return state;
  const p = state.players[player];
  const card = p.hand[handIndex];
  if (!card || card.role !== "ATTACKER") return state;
  if (p.active !== null && p.bench.length >= MAX_BENCH_SIZE) return state;

  const hand = p.hand.filter((_, i) => i !== handIndex);
  const inPlay: BattleCard = { ...card, currentHp: card.maxHp, attachedEnergy: 0 };

  const nextP: PlayerState =
    p.active === null
      ? { ...p, hand, active: inPlay }
      : { ...p, hand, bench: [...p.bench, inPlay] };

  return {
    ...state,
    lastAttack: null,
    players: { ...state.players, [player]: nextP },
    log: [
      ...state.log,
      p.active === null
        ? `${player} plays ${card.title}.`
        : `${player} benches ${card.title}.`,
    ],
  };
}

export function switchActive(
  state: BattleState,
  player: PlayerId,
  benchIndex: number
): BattleState {
  if (state.phase !== "IN_PROGRESS" || state.turn !== player) return state;
  const p = state.players[player];
  const incoming = p.bench[benchIndex];
  if (!p.active || p.hasSwitchedThisTurn || !incoming) return state;

  const bench = p.bench.filter((_, i) => i !== benchIndex);
  bench.push(p.active);

  const nextP: PlayerState = {
    ...p,
    active: incoming,
    bench,
    hasSwitchedThisTurn: true,
  };

  return {
    ...state,
    lastAttack: null,
    players: { ...state.players, [player]: nextP },
    log: [...state.log, `${player} switches in ${incoming.title}.`],
  };
}

export function playEnergy(
  state: BattleState,
  player: PlayerId,
  handIndex: number
): BattleState {
  if (state.phase !== "IN_PROGRESS" || state.turn !== player) return state;
  const p = state.players[player];
  const card = p.hand[handIndex];
  if (
    !card ||
    card.role !== "ENERGY" ||
    p.energyPlayedThisTurn ||
    !p.active
  ) {
    return state;
  }

  const hand = p.hand.filter((_, i) => i !== handIndex);
  const nextP: PlayerState = {
    ...p,
    hand,
    discard: [...p.discard, card],
    active: {
      ...p.active,
      attachedEnergy: p.active.attachedEnergy + card.energyAmount,
    },
    energyPlayedThisTurn: true,
  };
  return {
    ...state,
    lastAttack: null,
    players: { ...state.players, [player]: nextP },
    log: [
      ...state.log,
      `${player} attaches ${card.title} (+${card.energyAmount} energy).`,
    ],
  };
}

export function playSupport(
  state: BattleState,
  player: PlayerId,
  handIndex: number
): BattleState {
  if (state.phase !== "IN_PROGRESS" || state.turn !== player) return state;
  const p = state.players[player];
  const card = p.hand[handIndex];
  const effect = card?.abilities[0];
  if (!card || card.role !== "SUPPORT" || p.supportPlayedThisTurn || !effect) {
    return state;
  }

  const magnitude = effect.magnitude ?? 0;
  let nextP: PlayerState = { ...p };
  const log = `${player} plays ${card.title}.`;

  switch (effect.effectType) {
    case "DRAW":
      nextP = drawUpTo(nextP, magnitude);
      break;
    case "HEAL": {
      if (!nextP.active) return state;
      nextP.active = {
        ...nextP.active,
        currentHp: Math.min(nextP.active.maxHp, nextP.active.currentHp + magnitude),
      };
      break;
    }
    case "ADD_ENERGY": {
      if (!nextP.active) return state;
      nextP.active = {
        ...nextP.active,
        attachedEnergy: nextP.active.attachedEnergy + magnitude,
      };
      break;
    }
    case "BOOST_DAMAGE":
      nextP.pendingBonusDamage += magnitude;
      break;
    default:
      return state;
  }

  nextP.hand = nextP.hand.filter((_, i) => i !== handIndex);
  nextP.discard = [...nextP.discard, card];
  nextP.supportPlayedThisTurn = true;

  return {
    ...state,
    lastAttack: null,
    players: { ...state.players, [player]: nextP },
    log: [...state.log, log],
  };
}

export function attack(
  state: BattleState,
  player: PlayerId,
  attackIndex: number
): BattleState {
  if (state.phase !== "IN_PROGRESS" || state.turn !== player || state.hasAttacked) {
    return state;
  }
  const attacker = state.players[player];
  const opponentId: PlayerId = player === "P1" ? "P2" : "P1";
  const defender = state.players[opponentId];
  const ability = attacker.active?.abilities[attackIndex];
  if (!attacker.active || !defender.active || !ability) return state;

  const energyCost = ability.energyCost ?? 0;
  if (attacker.active.attachedEnergy < energyCost) return state;

  const damage = (ability.damage ?? 0) + attacker.pendingBonusDamage;
  const remainingHp = defender.active.currentHp - damage;

  let nextDefender: PlayerState;
  let log = `${player}'s ${attacker.active.title} uses ${ability.name} for ${damage} damage.`;

  if (remainingHp <= 0) {
    const koCard = { ...defender.active, currentHp: 0 };
    if (defender.bench.length > 0) {
      const [promoted, ...restBench] = defender.bench;
      nextDefender = {
        ...defender,
        active: promoted,
        bench: restBench,
        discard: [...defender.discard, koCard],
      };
      log += ` ${defender.active.title} is destroyed! ${promoted.title} is promoted from the bench.`;
    } else {
      nextDefender = {
        ...defender,
        active: null,
        discard: [...defender.discard, koCard],
      };
      log += ` ${defender.active.title} is destroyed.`;
    }
  } else {
    nextDefender = {
      ...defender,
      active: { ...defender.active, currentHp: remainingHp },
    };
  }

  const nextAttacker: PlayerState = { ...attacker, pendingBonusDamage: 0 };

  return {
    ...state,
    hasAttacked: true,
    lastAttack: { amount: damage, target: opponentId },
    players: {
      ...state.players,
      [player]: nextAttacker,
      [opponentId]: nextDefender,
    },
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
    case "PLAY_ATTACKER":
      return playAttacker(state, action.player, action.handIndex);
    case "PLAY_ENERGY":
      return playEnergy(state, action.player, action.handIndex);
    case "PLAY_SUPPORT":
      return playSupport(state, action.player, action.handIndex);
    case "ATTACK":
      return attack(state, action.player, action.attackIndex);
    case "SWITCH_ACTIVE":
      return switchActive(state, action.player, action.benchIndex);
    case "END_TURN":
      return endTurn(state, action.player);
    case "RESET":
      return createInitialState(action.cards);
    default:
      return state;
  }
}
