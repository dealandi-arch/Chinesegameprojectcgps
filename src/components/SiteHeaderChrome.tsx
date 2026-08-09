"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import type { Role } from "@/lib/auth";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  CO_ADMIN: "Co-Admin",
  USER: "Player",
};

export function SiteHeaderChrome({
  user,
}: {
  user: { username: string; role: Role } | null;
}) {
  const pathname = usePathname();
  const isGameRoute = pathname === "/" || pathname.startsWith("/play");

  const theme = isGameRoute
    ? {
        header: "border-b border-amber-200 bg-amber-50/95 backdrop-blur",
        brand: "text-stone-900",
        pill: "border-amber-300 text-amber-700 hover:border-amber-500",
        username: "text-stone-700",
        usernameSub: "text-stone-500",
        signOut: "border-stone-300 text-stone-700 hover:border-stone-500",
      }
    : {
        header: "",
        brand: "text-white",
        pill: "border-amber-400/30 text-amber-300/80 hover:border-amber-400/60",
        username: "text-stone-300",
        usernameSub: "text-stone-500",
        signOut: "border-white/10 text-stone-300 hover:border-white/30",
      };

  return (
    <header
      className={`flex items-center justify-between px-6 py-5 sm:px-12 ${theme.header}`}
    >
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl">🥢</span>
        <span className={`font-semibold tracking-wide ${theme.brand}`}>
          Wok Quest
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {user && (
          <Link
            href="/play"
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${theme.pill}`}
          >
            Duel
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
