import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBattleReadyCards } from "@/lib/cards";
import { getAiOpponent } from "@/lib/battle/aiRoster";
import { AIBattleGame } from "@/components/battle/AIBattleGame";

export default async function AiBattlePage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level: levelParam } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  const opponent = getAiOpponent(Number(levelParam));
  if (!opponent) {
    return (
      <main className="flex-1 bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 px-6 py-12 text-stone-900 sm:px-12">
        <p className="text-sm text-stone-700">
          Unknown difficulty.{" "}
          <Link href="/play/ai" className="text-red-700 underline">
            Choose an opponent
          </Link>
          .
        </p>
      </main>
    );
  }

  const cards = await getBattleReadyCards();

  return (
    <main className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 px-4 py-3 text-stone-900 sm:px-8 sm:py-4">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
        <div className="shrink-0">
          <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">
            You vs {opponent.emoji} {opponent.name} ({opponent.title})
          </h1>
          <p className="mt-0.5 text-xs text-stone-600 sm:text-sm">
            Level {opponent.level} — {opponent.nameEn}
          </p>
        </div>
        <div className="mt-2 min-h-0 flex-1">
          <AIBattleGame cards={cards} opponent={opponent} />
        </div>
      </div>
    </main>
  );
}
