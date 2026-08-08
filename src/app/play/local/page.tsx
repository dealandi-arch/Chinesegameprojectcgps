import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBattleReadyCards } from "@/lib/cards";
import { BattleGame } from "@/components/battle/BattleGame";

export default async function LocalPlayPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  const cards = await getBattleReadyCards();

  return (
    <main className="flex-1 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-white">Local Duel</h1>
        <p className="mt-1 text-sm text-stone-400">
          Local pass-and-play — whoever&apos;s turn it is, act on this device.
        </p>
        <div className="mt-8">
          <BattleGame cards={cards} />
        </div>
      </div>
    </main>
  );
}
