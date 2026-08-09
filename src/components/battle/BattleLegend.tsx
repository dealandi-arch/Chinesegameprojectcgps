"use client";

import { useState } from "react";

export function BattleLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-amber-200 bg-white/70 p-3 text-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between font-semibold text-stone-800"
      >
        How to Play
        <span className="text-xs text-amber-600">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="mt-3 grid gap-3 text-xs text-stone-600 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-stone-800">Icons</p>
            <p>⚡ Energy — needed to use an attack, attached from Energy cards.</p>
            <p>♥ HP — a card is destroyed when this hits 0.</p>
            <p>Attacker / Support / Energy — a card&apos;s role.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-800">Your turn</p>
            <p>1. Draw a card automatically.</p>
            <p>2. Play cards: an Attacker (active or bench), one Energy, one Support.</p>
            <p>3. Attack once, or Switch your active with a bench card once.</p>
            <p>4. End Turn.</p>
          </div>
        </div>
      )}
    </div>
  );
}
