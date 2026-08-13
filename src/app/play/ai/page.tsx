import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AI_ROSTER } from "@/lib/battle/aiRoster";
import { ThemedPage } from "@/components/theme/ThemedPage";

export default async function AiRosterPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/sign-in");
  }

  return (
    <ThemedPage className="flex-1 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">Play AI</h1>
        <p className="mt-1 text-sm opacity-70">
          Choose your opponent — difficulty rises from kitchen rookie to
          legendary master chef.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {AI_ROSTER.map((opponent) => (
            <Link
              key={opponent.level}
              href={`/play/ai/${opponent.level}`}
              className="rounded-2xl border border-amber-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-amber-400"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{opponent.emoji}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Level {opponent.level}
                </span>
              </div>
              <h2 className="mt-3 font-semibold text-stone-900">
                {opponent.name}{" "}
                <span className="text-sm font-normal text-stone-500">
                  ({opponent.nameEn})
                </span>
              </h2>
              <p className="mt-1 text-sm text-stone-600">{opponent.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </ThemedPage>
  );
}
