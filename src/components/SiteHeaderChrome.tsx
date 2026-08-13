"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { useGameTheme } from "@/components/theme/ThemeContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { Role } from "@/lib/auth";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  CO_ADMIN: "Co-Admin",
  USER: "Player",
};

const HEADER_THEME = {
  light: {
    header: "border-b border-amber-200 bg-amber-50/95 backdrop-blur",
    brand: "text-stone-900",
    pill: "border-amber-300 text-amber-700 hover:border-amber-500",
    username: "text-stone-700",
    usernameSub: "text-stone-500",
    signOut: "border-stone-300 text-stone-700 hover:border-stone-500",
  },
  dark: {
    header: "border-b border-white/10 bg-stone-950/95 backdrop-blur",
    brand: "text-white",
    pill: "border-amber-400/30 text-amber-300/80 hover:border-amber-400/60",
    username: "text-stone-300",
    usernameSub: "text-stone-500",
    signOut: "border-white/10 text-stone-300 hover:border-white/30",
  },
  lime: {
    header: "border-b border-lime-300 bg-lime-50/95 backdrop-blur",
    brand: "text-lime-950",
    pill: "border-lime-400 text-lime-700 hover:border-lime-600",
    username: "text-lime-800",
    usernameSub: "text-lime-600",
    signOut: "border-lime-400 text-lime-800 hover:border-lime-600",
  },
} as const;

// Non-game routes (admin, sign-in) always keep this fixed dark look,
// regardless of the game theme picker -- admin is a separate "backstage"
// area on purpose.
const STAFF_THEME = {
  header: "",
  brand: "text-white",
  pill: "border-amber-400/30 text-amber-300/80 hover:border-amber-400/60",
  username: "text-stone-300",
  usernameSub: "text-stone-500",
  signOut: "border-white/10 text-stone-300 hover:border-white/30",
};

export function SiteHeaderChrome({
  user,
}: {
  user: { username: string; role: Role } | null;
}) {
  const pathname = usePathname();
  const { theme: gameTheme } = useGameTheme();
  const isGameRoute =
    pathname === "/" ||
    pathname.startsWith("/play") ||
    pathname.startsWith("/chat");

  const theme = isGameRoute ? HEADER_THEME[gameTheme] : STAFF_THEME;

  return (
    <header
      className={`flex items-center justify-between px-6 sm:px-12 ${
        isGameRoute ? "py-2" : "py-5"
      } ${theme.header}`}
    >
      <Link href="/" className="flex items-center gap-2">
        <span className={isGameRoute ? "text-lg" : "text-2xl"}>🥢</span>
        <span className={`font-semibold tracking-wide ${theme.brand} ${isGameRoute ? "text-sm" : ""}`}>
          Wok Quest
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {isGameRoute && user && <ThemeToggle />}

        {user && (
          <Link
            href="/play"
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${theme.pill}`}
          >
            Duel
          </Link>
        )}

        {user && (
          <Link
            href="/chat"
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${theme.pill}`}
          >
            Chat
          </Link>
        )}

        {(user?.role === "ADMIN" || user?.role === "CO_ADMIN") && (
          <Link
            href="/admin"
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${theme.pill}`}
          >
            Admin Panel
          </Link>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <span className={`text-sm ${theme.username}`}>
              {user.username}{" "}
              <span className={`text-xs ${theme.usernameSub}`}>
                ({ROLE_LABEL[user.role]})
              </span>
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${theme.signOut}`}
              >
                Sign Out
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/sign-in"
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${theme.pill}`}
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
