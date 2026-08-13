"use client";

import type { ReactNode } from "react";
import { useGameTheme } from "@/components/theme/ThemeContext";

const BG = {
  light: "bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 text-stone-900",
  dark: "bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-stone-100",
  lime: "bg-gradient-to-b from-lime-50 via-lime-100 to-lime-50 text-lime-950",
} as const;

// Wraps a game-facing page so its background/text colors follow the user's
// selected theme (light/dark/lime) instead of being hardcoded. Renders a
// <main> by default; pass as="div" for pages that already have their own
// inner <main> (e.g. the homepage, which wraps <main> + <footer>).
export function ThemedPage({
  className = "",
  as = "main",
  children,
}: {
  className?: string;
  as?: "main" | "div";
  children: ReactNode;
}) {
  const { theme } = useGameTheme();
  const Tag = as;
  return <Tag className={`${BG[theme]} ${className}`}>{children}</Tag>;
}
