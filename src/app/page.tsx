import Link from "next/link";
import { ThemedPage } from "@/components/theme/ThemedPage";

export default function Home() {
  return (
    <ThemedPage as="div" className="flex flex-1 flex-col">
      {/* Hero */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(ellipse_at_top,_rgba(217,119,6,0.18),_transparent_65%)]"
        />

        <span className="mb-6 text-5xl">🍜</span>

        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-stone-900 sm:text-6xl">
          Wok Quest
        </h1>
        <p className="mt-2 text-lg font-medium text-red-700">
          厨神之路 · A Cantonese Card Battler
        </p>

        <p className="mt-6 max-w-xl text-balance text-stone-600">
          Collect real Cantonese dishes as battle cards, build a 60-card deck,
          and duel friends locally or online — while learning the real
          history behind every dish.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/play"
            className="rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-500"
          >
            Duel Now!
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            emoji="🥟"
            title="Real Dishes as Cards"
            description="Attackers, support, and energy cards modeled on genuine Cantonese dishes and condiments."
          />
          <FeatureCard
            emoji="⚔️"
            title="Strategic Duels"
            description="Build a 60-card deck, attach energy, bench reserves, and switch your active card mid-battle."
          />
          <FeatureCard
            emoji="📖"
            title="Real History"
            description="Every card's flavor text is genuine culinary history, not filler."
          />
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-stone-500 sm:px-12">
        Wok Quest is actively growing — new cards and modes coming soon.
      </footer>
    </ThemedPage>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-6 text-left shadow-sm">
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-3 font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-600">{description}</p>
    </div>
  );
}
