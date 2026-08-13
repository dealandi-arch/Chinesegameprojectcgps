"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type GameTheme = "light" | "dark" | "lime";

const THEME_OPTIONS: GameTheme[] = ["light", "dark", "lime"];
const STORAGE_KEY = "wq-theme";

type ThemeContextValue = {
  theme: GameTheme;
  setTheme: (theme: GameTheme) => void;
  setRandomTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<GameTheme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "lime") {
      // One-time sync from localStorage (an external system) on mount --
      // can't be done during render since window/localStorage don't exist
      // during SSR, so this intentionally runs after mount rather than
      // matching the rule's "subscribe to external updates" shape exactly.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(stored);
    }
  }, []);

  function setTheme(next: GameTheme) {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage can throw in private browsing -- theme just won't persist.
    }
  }

  function setRandomTheme() {
    setTheme(THEME_OPTIONS[Math.floor(Math.random() * THEME_OPTIONS.length)]);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, setRandomTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Falls back to "light" if rendered outside the provider (shouldn't happen
// since the provider wraps the whole app in layout.tsx, but keeps
// theme-aware components crash-proof either way).
export function useGameTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: "light", setTheme: () => {}, setRandomTheme: () => {} };
  }
  return ctx;
}
