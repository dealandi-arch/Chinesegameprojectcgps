"use client";

import { useState } from "react";
import { PackEditForm } from "@/components/packs/PackEditForm";
import type { Pack } from "@/lib/packs";

export function PackCard({
  pack,
  mode,
}: {
  pack: Pack;
  mode: "admin" | "propose";
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{pack.title}</h3>
          <p className="mt-1 text-xs text-stone-400">{pack.body}</p>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50"
        >
          {editing
            ? "Close"
            : mode === "admin"
              ? "Edit"
              : "Propose Edit"}
        </button>
      </div>

      {pack.imageUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {pack.imageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              className="h-14 w-14 rounded-lg border border-white/10 object-cover"
            />
          ))}
        </div>
      )}

      {editing && (
        <PackEditForm
          mode={mode === "admin" ? "edit" : "propose"}
          pack={pack}
          onDone={() => setEditing(false)}
        />
      )}
    </div>
  );
}
