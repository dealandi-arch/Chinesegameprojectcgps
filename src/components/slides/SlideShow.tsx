"use client";

import { useState } from "react";
import { useGameTheme } from "@/components/theme/ThemeContext";
import type { Slide } from "@/lib/slides";

const SHOW_THEME = {
  light: {
    box: "border-amber-200 bg-white shadow-sm",
    title: "text-stone-900",
    body: "text-stone-600",
    nav: "border-amber-300 text-stone-700 hover:border-amber-500",
    dot: "bg-amber-300",
    dotActive: "bg-amber-600",
  },
  dark: {
    box: "border-white/10 bg-white/5",
    title: "text-white",
    body: "text-stone-400",
    nav: "border-white/20 text-stone-300 hover:border-white/40",
    dot: "bg-white/20",
    dotActive: "bg-amber-400",
  },
  lime: {
    box: "border-lime-300 bg-white shadow-sm",
    title: "text-lime-950",
    body: "text-stone-600",
    nav: "border-lime-400 text-lime-800 hover:border-lime-600",
    dot: "bg-lime-200",
    dotActive: "bg-lime-700",
  },
} as const;

export function SlideShow({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const { theme } = useGameTheme();
  const t = SHOW_THEME[theme];

  if (slides.length === 0) {
    return <p className="text-sm opacity-70">Nothing here yet — check back soon.</p>;
  }

  const slide = slides[Math.min(index, slides.length - 1)];

  function go(next: number) {
    setIndex((next + slides.length) % slides.length);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className={`overflow-hidden rounded-2xl border ${t.box}`}>
        {slide.imageUrls[0] && (
          <img
            src={slide.imageUrls[0]}
            alt=""
            className="h-56 w-full object-cover sm:h-72"
          />
        )}
        <div className="p-6">
          <h2 className={`text-xl font-bold ${t.title}`}>{slide.title}</h2>
          <p className={`mt-3 whitespace-pre-wrap text-sm ${t.body}`}>
            {slide.body}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => go(index - 1)}
          disabled={slides.length < 2}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${t.nav}`}
        >
          ← Prev
        </button>

        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === index ? t.dotActive : t.dot
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => go(index + 1)}
          disabled={slides.length < 2}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${t.nav}`}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
