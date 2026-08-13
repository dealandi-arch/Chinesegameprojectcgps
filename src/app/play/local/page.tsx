import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBattleReadyCards } from "@/lib/cards";
import { BattleGame } from "@/components/battle/BattleGame";
import { ThemedPage } from "@/components/theme/ThemedPage";

export default async function LocalPlayPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  const cards = await getBattleReadyCards();

  return (
    <ThemedPage className="flex h-full flex-col overflow-hidden px-4 py-3 sm:px-8 sm:py-4">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
        <div className="shrink-0">
          <h1 className="text-xl font-bold sm:text-2xl">Local Duel</h1>
          <p className="mt-0.5 text-xs opacity-70 sm:text-sm">
            Local pass-and-play — whoever&apos;s turn it is, act on this device.
          </p>
        </div>
        <div className="mt-2 min-h-0 flex-1">
          <BattleGame cards={cards} />
        </div>
      </div>
    </ThemedPage>
  );
}
