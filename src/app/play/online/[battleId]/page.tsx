import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBattleView } from "@/app/actions/battles";
import { OnlineBattleGame } from "@/components/battle/OnlineBattleGame";

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
      <main className="flex-1 bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 px-6 py-12 text-stone-900 sm:px-12">
        <p className="text-sm text-red-600">{initial.error}</p>
      </main>
    );
  }

  return (
    <main className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 px-4 py-3 text-stone-900 sm:px-8 sm:py-4">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
        <div className="shrink-0">
          <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">
            Online Duel
          </h1>
          <p className="mt-0.5 text-xs text-stone-600 sm:text-sm">
            {initial.hostUsername} vs {initial.guestUsername ?? "waiting…"}
          </p>
        </div>
        <div className="mt-2 min-h-0 flex-1">
          <OnlineBattleGame
            battleId={battleId}
            initialView={initial.view}
            initialVersion={initial.version}
            initialStatus={initial.status}
          />
        </div>
      </div>
    </main>
  );
}
