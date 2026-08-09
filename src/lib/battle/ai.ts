import type { BattleCard } from "@/lib/cards";
import type { BattleAction, BattleState, PlayerId } from "@/lib/battle/types";
import { MAX_BENCH_SIZE } from "@/lib/battle/engine";

const MISTAKE_CHANCE: Record<number, number> = {
  1: 0.7,
  2: 0.55,
  3: 0.4,
  4: 0.25,
  5: 0.12,
  6: 0.05,
  7: 0,
};

type Candidate = { action: BattleAction; score: number };

function averageDamage(card: BattleCard): number {
  const dmgAbilities = card.abilities.filter((a) => typeof a.damage === "number");
  if (dmgAbilities.length === 0) return 0;
  return (
    dmgAbilities.reduce((sum, a) => sum + (a.damage ?? 0), 0) / dmgAbilities.length
  );
}

function highestDamage(card: BattleCard | null): number {
  if (!card) return 0;
  return card.abilities.reduce((max, a) => Math.max(max, a.damage ?? 0), 0);
}

// Scores every currently-legal action for `aiPlayer` and picks one, with a
// per-level chance of picking a random legal action instead (a "mistake"),
// plus a light lookahead tweak at levels 5-7. Never proposes an action that
// battleReducer would reject -- every candidate is built from the same
// legality checks engine.ts's own functions use.
export function chooseAIAction(
  state: BattleState,
  aiPlayer: PlayerId,
  level: number
): BattleAction {
  const opponentId: PlayerId = aiPlayer === "P1" ? "P2" : "P1";
  const me = state.players[aiPlayer];
  const opponent = state.players[opponentId];

  const candidates: Candidate[] = [];

  // Play Attacker (active if empty, else bench if there's room)
  me.hand.forEach((card, i) => {
    if (card.role !== "ATTACKER") return;
    if (me.active !== null && me.bench.length >= MAX_BENCH_SIZE) return;
    const base = averageDamage(card) + card.maxHp * 0.4;
    const score = me.active === null ? base + 50 : base * 0.6;
    candidates.push({
      action: { type: "PLAY_ATTACKER", player: aiPlayer, handIndex: i },
      score,
    });
  });

  // Play Energy (only ever targets the active card)
  if (me.active && !me.energyPlayedThisTurn) {
    me.hand.forEach((card, i) => {
      if (card.role !== "ENERGY") return;
      const active = me.active!;
      const unlocksAttack = active.abilities.some(
        (a) =>
          (a.energyCost ?? 0) > active.attachedEnergy &&
          active.attachedEnergy + card.energyAmount >= (a.energyCost ?? 0)
      );
      candidates.push({
        action: { type: "PLAY_ENERGY", player: aiPlayer, handIndex: i },
        score: unlocksAttack ? 40 : 8,
      });
    });
  }

  // Play Support
  if (!me.supportPlayedThisTurn) {
    me.hand.forEach((card, i) => {
      if (card.role !== "SUPPORT") return;
      const effect = card.abilities[0];
      if (!effect || !effect.effectType) return;
      const magnitude = effect.magnitude ?? 0;
      let score: number | null = null;

      switch (effect.effectType) {
        case "DRAW":
          score = 12 + magnitude * 2;
          break;
        case "HEAL":
          if (!me.active) return;
          score = (1 - me.active.currentHp / me.active.maxHp) * 60;
          break;
        case "ADD_ENERGY":
          if (!me.active) return;
          score = 15 + magnitude * 10;
          break;
        case "BOOST_DAMAGE": {
          const canAttackNow =
            me.active !== null &&
            !state.hasAttacked &&
            me.active.abilities.some(
              (a) => (a.energyCost ?? 0) <= me.active!.attachedEnergy
            );
          score = 10 + magnitude + (canAttackNow ? 20 : 0);
          break;
        }
      }

      if (score !== null) {
        candidates.push({
          action: { type: "PLAY_SUPPORT", player: aiPlayer, handIndex: i },
          score,
        });
      }
    });
  }

  // Attack
  if (me.active && !state.hasAttacked && opponent.active) {
    me.active.abilities.forEach((ability, i) => {
      const energyCost = ability.energyCost ?? 0;
      if (me.active!.attachedEnergy < energyCost) return;
      const damage = (ability.damage ?? 0) + me.pendingBonusDamage;
      const lethal = damage >= opponent.active!.currentHp;
      candidates.push({
        action: { type: "ATTACK", player: aiPlayer, attackIndex: i },
        score: damage + (lethal ? 200 : 0),
      });
    });
  }

  // Switch Active
  if (me.active && !me.hasSwitchedThisTurn) {
    me.bench.forEach((benchCard, i) => {
      const active = me.active!;
      const activeCritical = active.currentHp / active.maxHp < 0.35;
      const benchHealthier =
        benchCard.currentHp / benchCard.maxHp > active.currentHp / active.maxHp;
      candidates.push({
        action: { type: "SWITCH_ACTIVE", player: aiPlayer, benchIndex: i },
        score: activeCritical && benchHealthier ? 25 : -5,
      });
    });
  }

  // End Turn -- always available, the guaranteed fallback.
  candidates.push({ action: { type: "END_TURN", player: aiPlayer }, score: 1 });

  // Levels 5-7: hold a non-lethal attack for a turn if a bigger one is one
  // energy card away and the active can plausibly survive being hit back.
  let pool = candidates;
  if (level >= 5 && me.active) {
    const sortedByScore = [...candidates].sort((a, b) => b.score - a.score);
    const top = sortedByScore[0];

    if (top.action.type === "ATTACK") {
      const activeNow = me.active;
      const currentAbility = activeNow.abilities[top.action.attackIndex];
      const currentDamage = (currentAbility?.damage ?? 0) + me.pendingBonusDamage;
      const isLethal = opponent.active
        ? currentDamage >= opponent.active.currentHp
        : false;

      if (!isLethal) {
        const biggerAttackUnlockable = me.hand.some((card) => {
          if (card.role !== "ENERGY") return false;
          return activeNow.abilities.some(
            (a) =>
              (a.damage ?? 0) > currentDamage &&
              (a.energyCost ?? 0) > activeNow.attachedEnergy &&
              activeNow.attachedEnergy + card.energyAmount >= (a.energyCost ?? 0)
          );
        });
        const wouldSurvive = activeNow.currentHp > highestDamage(opponent.active);

        if (biggerAttackUnlockable && wouldSurvive) {
          pool = candidates.filter((c) => c.action.type !== "ATTACK");
        }
      }
    }
  }

  const mistakeChance = MISTAKE_CHANCE[level] ?? 0;
  if (Math.random() < mistakeChance) {
    const nonEndTurn = pool.filter((c) => c.action.type !== "END_TURN");
    const randomPool = nonEndTurn.length > 0 ? nonEndTurn : pool;
    return randomPool[Math.floor(Math.random() * randomPool.length)].action;
  }

  const bestFirst = [...pool].sort((a, b) => b.score - a.score);
  const topScore = bestFirst[0].score;
  const topTier = bestFirst.filter((c) => c.score === topScore);
  return topTier[Math.floor(Math.random() * topTier.length)].action;
}
