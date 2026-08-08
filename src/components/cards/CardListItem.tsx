"use client";

import { useState } from "react";
import { CardFace } from "@/components/cards/CardFace";
import { CardEditForm } from "@/components/cards/CardEditForm";
import type { Card } from "@/lib/cards";

export function CardListItem({
  card,
  mode,
}: {
  card: Card;
  mode: "admin" | "propose";
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-4">
        <div className="w-48 shrink-0">
          <CardFace card={card} size="full" />
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50"
        >
          {editing ? "Close" : mode === "admin" ? "Edit" : "Propose Edit"}
        </button>
      </div>

      {editing && (
        <CardEditForm
          mode={mode === "admin" ? "edit" : "propose"}
          card={card}
          onDone={() => setEditing(false)}
        />
      )}
    </div>
  );
}
