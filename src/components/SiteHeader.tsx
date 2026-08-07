import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  CO_ADMIN: "Co-Admin",
  USER: "Player",
};

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-12">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl">🥢</span>
        <span className="font-semibold tracking-wide text-white">
          Wok Quest
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {(user?.role === "ADMIN" || user?.role === "CO_ADMIN") && (
          <Link
            href="/admin"
            className="rounded-full border border-amber-400/30 px-4 py-1.5 text-xs font-medium text-amber-300/80 transition-colors hover:border-amber-400/60"
          >
            Admin Panel
          </Link>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-300">
              {user.username}{" "}
              <span className="text-xs text-stone-500">
                ({ROLE_LABEL[user.role]})
              </span>
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-white/30"
              >
                Sign Out
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/sign-in"
            className="rounded-full border border-amber-400/30 px-4 py-1.5 text-xs font-medium text-amber-300/80 transition-colors hover:border-amber-400/60"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
