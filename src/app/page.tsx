export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.25),_transparent_65%)]"
        />

        <span className="mb-6 text-5xl">🍜</span>

        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
          Wok Quest
        </h1>
        <p className="mt-2 text-lg font-medium text-amber-400">
          厨神之路 · A Chinese Cooking Game
        </p>

        <p className="mt-6 max-w-xl text-balance text-stone-300">
          Cook real Chinese dishes step by step, and unlock the history,
          ingredients, and stories behind every recipe as you go.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button
            disabled
            title="The game is coming soon"
            className="cursor-not-allowed rounded-full bg-red-600/60 px-8 py-3 text-base font-semibold text-white/80"
          >
            Start Cooking — Coming Soon
          </button>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            emoji="🍲"
            title="Cook Real Recipes"
            description="Follow authentic Chinese dishes from start to finish."
          />
          <FeatureCard
            emoji="📖"
            title="Learn the Story"
            description="Every dish you cook reveals its history and culture."
          />
          <FeatureCard
            emoji="✍️"
            title="Built by Us"
            description="Content is written and edited by the project team."
          />
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-stone-500 sm:px-12">
        Wok Quest is under construction — more coming soon.
      </footer>
    </div>
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-3 font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-stone-400">{description}</p>
    </div>
  );
}
