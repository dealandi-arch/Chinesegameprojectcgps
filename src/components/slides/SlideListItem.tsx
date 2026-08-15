"use client";

import { useState } from "react";
import { SlideEditForm } from "@/components/slides/SlideEditForm";
import type { Slide } from "@/lib/slides";

export function SlideListItem({
  slide,
  mode,
}: {
  slide: Slide;
  mode: "admin" | "propose";
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-4">
        {slide.imageUrls[0] && (
          <img
            src={slide.imageUrls[0]}
            alt=""
            className="h-24 w-24 shrink-0 rounded-lg border border-white/10 object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-stone-500">Order {slide.orderIndex}</p>
          <h3 className="mt-0.5 truncate text-sm font-semibold text-white">
            {slide.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-stone-400">
            {slide.body}
          </p>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50"
        >
          {editing ? "Close" : mode === "admin" ? "Edit" : "Propose Edit"}
        </button>
      </div>

      {editing && (
        <SlideEditForm
          mode={mode === "admin" ? "edit" : "propose"}
          slide={slide}
          onDone={() => setEditing(false)}
        />
      )}
    </div>
  );
}
