import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ThemedPage } from "@/components/theme/ThemedPage";

export default async function PlaySelectorPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  return (
    <ThemedPage className="flex-1 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-2xl font-bold">Choose Your Duel</h1>
        <p className="mt-1 text-sm opacity-70">Pick how you want to play.</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Link
            href="/play/local"
            className="rounded-2xl border border-amber-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-amber-400"
          >
            <div className="text-2xl">🪑</div>
            <h2 className="mt-3 font-semibold text-stone-900">Local Duel</h2>
            <p className="mt-1 text-sm text-stone-600">
              Pass-and-play with a friend on this device.
            </p>
          </Link>

          <Link
            href="/play/online"
            className="rounded-2xl border border-amber-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-amber-400"
          >
            <div className="text-2xl">🌐</div>
            <h2 className="mt-3 font-semibold text-stone-900">Online Duel</h2>
            <p className="mt-1 text-sm text-stone-600">
              Create or join a room and play against someone remotely.
            </p>
          </Link>

          <Link
            href="/play/ai"
            className="rounded-2xl border border-amber-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-amber-400"
          >
            <div className="text-2xl">🏆</div>
            <h2 className="mt-3 font-semibold text-stone-900">Play AI</h2>
            <p className="mt-1 text-sm text-stone-600">
              Duel a computer chef — 7 difficulty levels, from kitchen rookie
              to legendary master.
            </p>
          </Link>
        </div>
      </div>
    </ThemedPage>
  );
}
