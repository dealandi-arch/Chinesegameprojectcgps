"use client";

import { useState } from "react";
import { SlideListItem } from "@/components/slides/SlideListItem";
import { SlideEditForm } from "@/components/slides/SlideEditForm";
import type { Slide } from "@/lib/slides";

export function SlideManager({
  mode,
  slides,
}: {
  mode: "admin" | "propose";
  slides: Slide[];
}) {
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Info Slides</h2>
          <p className="mt-1 text-sm text-stone-400">
            Shown on the public{" "}
            <span className="text-stone-300">/info</span> slideshow, in order.
          </p>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50"
        >
          {creating
            ? "Cancel"
            : mode === "admin"
              ? "New Slide"
              : "Propose New Slide"}
        </button>
      </div>

      {creating && (
        <SlideEditForm
          mode={mode === "admin" ? "create" : "propose"}
          nextOrderIndex={slides.length}
          onDone={() => setCreating(false)}
        />
      )}

      <div className="mt-4 flex flex-col gap-3">
        {slides.length === 0 && (
          <p className="text-sm text-stone-500">No slides yet.</p>
        )}
        {slides.map((slide) => (
          <SlideListItem key={slide.id} slide={slide} mode={mode} />
        ))}
      </div>
    </div>
  );
}
