import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBattleView } from "@/app/actions/battles";
import { OnlineBattleGame } from "@/components/battle/OnlineBattleGame";
import { ThemedPage } from "@/components/theme/ThemedPage";

export default async function OnlineBattlePage({
  params,
}: {
  params: Promise<{ battleId: string }>;
}) {
  const { battleId } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  const initial = await getBattleView(battleId);
  if (initial.error !== null) {
    return (
      <ThemedPage className="flex-1 px-6 py-12 sm:px-12">
        <p className="text-sm text-red-600">{initial.error}</p>
      </ThemedPage>
    );
  }

  return (
    <ThemedPage className="flex h-full flex-col overflow-hidden px-4 py-1.5 sm:px-8 sm:py-2">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
        <div className="shrink-0 flex items-baseline gap-2">
          <h1 className="text-sm font-bold sm:text-base">Online Duel</h1>
          <p className="truncate text-[11px] opacity-70 sm:text-xs">
            {initial.hostUsername} vs {initial.guestUsername ?? "waiting…"}
          </p>
        </div>
        <div className="mt-1 min-h-0 flex-1">
          <OnlineBattleGame
            battleId={battleId}
            initialView={initial.view}
            initialVersion={initial.version}
            initialStatus={initial.status}
          />
        </div>
      </div>
    </ThemedPage>
  );
}
