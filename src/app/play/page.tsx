import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function PlaySelectorPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  return (
    <main className="flex-1 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-2xl font-bold text-white">Choose Your Duel</h1>
        <p className="mt-1 text-sm text-stone-400">
          Pick how you want to play.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Link
            href="/play/local"
            className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:border-amber-400/50"
          >
            <div className="text-2xl">🪑</div>
            <h2 className="mt-3 font-semibold text-white">Local Duel</h2>
            <p className="mt-1 text-sm text-stone-400">
              Pass-and-play with a friend on this device.
            </p>
          </Link>

          <Link
            href="/play/online"
            className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:border-amber-400/50"
          >
            <div className="text-2xl">🌐</div>
            <h2 className="mt-3 font-semibold text-white">Online Duel</h2>
            <p className="mt-1 text-sm text-stone-400">
              Create or join a room and play against someone remotely.
            </p>
          </Link>

          <div className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 p-6 text-left opacity-50">
            <div className="text-2xl">🤖</div>
            <h2 className="mt-3 font-semibold text-white">Vs AI</h2>
            <p className="mt-1 text-sm text-stone-400">Coming soon.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
