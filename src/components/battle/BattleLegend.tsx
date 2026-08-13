"use client";

import { useState } from "react";
import { useGameTheme } from "@/components/theme/ThemeContext";

const LEGEND_THEME = {
  light: { box: "border-amber-200 bg-white/70", heading: "text-stone-800", toggle: "text-amber-600", body: "text-stone-600" },
  dark: { box: "border-white/10 bg-white/5", heading: "text-stone-100", toggle: "text-amber-400", body: "text-stone-400" },
  lime: { box: "border-lime-300 bg-white/70", heading: "text-lime-950", toggle: "text-lime-700", body: "text-stone-600" },
} as const;

export function BattleLegend() {
  const [open, setOpen] = useState(false);
  const { theme } = useGameTheme();
  const t = LEGEND_THEME[theme];

  return (
    <div className={`rounded-xl border p-3 text-sm ${t.box}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between font-semibold ${t.heading}`}
      >
        How to Play
        <span className={`text-xs ${t.toggle}`}>{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className={`mt-3 grid gap-3 text-xs sm:grid-cols-2 ${t.body}`}>
          <div>
            <p className={`font-semibold ${t.heading}`}>Icons</p>
            <p>⚡ Energy — needed to use an attack, attached from Energy cards.</p>
            <p>♥ HP — a card is destroyed when this hits 0.</p>
            <p>Attacker / Support / Energy — a card&apos;s role.</p>
          </div>
          <div>
            <p className={`font-semibold ${t.heading}`}>Your turn</p>
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
