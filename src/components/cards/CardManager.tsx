"use client";

import { useState } from "react";
import { CardListItem } from "@/components/cards/CardListItem";
import { CardEditForm } from "@/components/cards/CardEditForm";
import type { Card } from "@/lib/cards";

export function CardManager({
  mode,
  cards,
}: {
  mode: "admin" | "propose";
  cards: Card[];
}) {
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Cards</h2>
        <button
          onClick={() => setCreating((v) => !v)}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50"
        >
          {creating
            ? "Cancel"
            : mode === "admin"
              ? "New Card"
              : "Propose New Card"}
        </button>
      </div>

      {creating && (
        <CardEditForm
          mode={mode === "admin" ? "create" : "propose"}
          onDone={() => setCreating(false)}
        />
      )}

      <div className="mt-4 flex flex-col gap-3">
        {cards.length === 0 && (
          <p className="text-sm text-stone-500">No cards yet.</p>
        )}
        {cards.map((card) => (
          <CardListItem key={card.id} card={card} mode={mode} />
        ))}
      </div>
    </div>
  );
}
