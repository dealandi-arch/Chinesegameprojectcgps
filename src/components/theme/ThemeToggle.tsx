"use client";

import { useGameTheme, type GameTheme } from "@/components/theme/ThemeContext";

const OPTIONS: { value: GameTheme; emoji: string; label: string }[] = [
  { value: "light", emoji: "☀️", label: "Light" },
  { value: "dark", emoji: "🌙", label: "Dark" },
  { value: "lime", emoji: "🍏", label: "Lime" },
];

export function ThemeToggle() {
  const { theme, setTheme, setRandomTheme } = useGameTheme();

  return (
    <div className="flex items-center gap-1 rounded-full border border-amber-300/60 bg-white/40 p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          aria-pressed={theme === opt.value}
          className={`rounded-full px-2 py-1 text-sm transition-colors ${
            theme === opt.value ? "bg-white shadow-sm" : "opacity-60 hover:opacity-100"
          }`}
        >
          {opt.emoji}
        </button>
      ))}
      <button
        type="button"
        onClick={setRandomTheme}
        title="Random theme"
        className="rounded-full px-2 py-1 text-sm opacity-60 transition-opacity hover:opacity-100"
      >
        🎲
      </button>
    </div>
  );
}
