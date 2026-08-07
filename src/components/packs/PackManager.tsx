"use client";

import { useState } from "react";
import { PackCard } from "@/components/packs/PackCard";
import { PackEditForm } from "@/components/packs/PackEditForm";
import type { Pack } from "@/lib/packs";

export function PackManager({
  mode,
  packs,
}: {
  mode: "admin" | "propose";
  packs: Pack[];
}) {
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Packs</h2>
        <button
          onClick={() => setCreating((v) => !v)}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50"
        >
          {creating
            ? "Cancel"
            : mode === "admin"
              ? "New Pack"
              : "Propose New Pack"}
        </button>
      </div>

      {creating && (
        <PackEditForm
          mode={mode === "admin" ? "create" : "propose"}
          onDone={() => setCreating(false)}
        />
      )}

      <div className="mt-4 flex flex-col gap-3">
        {packs.length === 0 && (
          <p className="text-sm text-stone-500">No packs yet.</p>
        )}
        {packs.map((pack) => (
          <PackCard key={pack.id} pack={pack} mode={mode} />
        ))}
      </div>
    </div>
  );
}
