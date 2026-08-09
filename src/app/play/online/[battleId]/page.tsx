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
    <main className="flex-1 bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 px-6 py-12 text-stone-900 sm:px-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-stone-900">Online Duel</h1>
        <p className="mt-1 text-sm text-stone-600">
          {initial.hostUsername} vs {initial.guestUsername ?? "waiting…"}
        </p>
        <div className="mt-8">
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
