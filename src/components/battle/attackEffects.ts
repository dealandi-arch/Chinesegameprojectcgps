import type { LastAttack, PlayerId } from "@/lib/battle/types";

const SHAKE_THRESHOLD = 20;

// Pure, derived from the current state -- no timers needed. `lastAttack` is
// only ever non-null on the exact state produced by an attack (every other
// action resets it to null), and the CSS animations it drives (see
// globals.css: animate-battle-shake / animate-battle-flash) settle back to
// their neutral frame on their own, so there's nothing to "clear" later.
export function getAttackEffects(lastAttack: LastAttack | null): {
  shaking: boolean;
  flashTarget: PlayerId | null;
} {
  return {
    shaking: lastAttack !== null && lastAttack.amount >= SHAKE_THRESHOLD,
    flashTarget: lastAttack?.target ?? null,
  };
}
