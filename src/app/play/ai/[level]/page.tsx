import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBattleReadyCards } from "@/lib/cards";
import { getAiOpponent } from "@/lib/battle/aiRoster";
import { AIBattleGame } from "@/components/battle/AIBattleGame";
import { ThemedPage } from "@/components/theme/ThemedPage";

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
      <ThemedPage className="flex-1 px-6 py-12 sm:px-12">
        <p className="text-sm opacity-80">
          Unknown difficulty.{" "}
          <Link href="/play/ai" className="text-red-700 underline">
            Choose an opponent
          </Link>
          .
        </p>
      </ThemedPage>
    );
  }

  const cards = await getBattleReadyCards();

  return (
    <ThemedPage className="flex h-full flex-col overflow-hidden px-4 py-1.5 sm:px-8 sm:py-2">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
        <div className="shrink-0 flex items-baseline gap-2">
          <h1 className="truncate text-sm font-bold sm:text-base">
            You vs {opponent.emoji} {opponent.name} ({opponent.title})
          </h1>
          <p className="shrink-0 text-[11px] opacity-70 sm:text-xs">
            Level {opponent.level} — {opponent.nameEn}
          </p>
        </div>
        <div className="mt-1 min-h-0 flex-1">
          <AIBattleGame cards={cards} opponent={opponent} />
        </div>
      </div>
    </ThemedPage>
  );
}
