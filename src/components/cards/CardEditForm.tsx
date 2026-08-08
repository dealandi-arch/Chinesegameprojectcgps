"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createCard,
  updateCard,
  proposeCardEdit,
  type CardActionResult,
} from "@/app/actions/cards";
import type { Card, Ability, CardRole, EffectType } from "@/lib/cards";

const initialState: CardActionResult | null = null;

const EFFECT_OPTIONS: { value: EffectType; label: string }[] = [
  { value: "DRAW", label: "Draw cards" },
  { value: "HEAL", label: "Heal active card" },
  { value: "ADD_ENERGY", label: "Attach bonus energy" },
  { value: "BOOST_DAMAGE", label: "Boost next attack damage" },
];

export function CardEditForm({
  mode,
  card,
  onDone,
}: {
  mode: "create" | "edit" | "propose";
  card?: Card;
  onDone?: () => void;
}) {
  const action =
    mode === "create"
      ? createCard
      : mode === "edit"
        ? updateCard.bind(null, card!.id)
        : proposeCardEdit.bind(null, card?.id ?? null);

  const [state, formAction, pending] = useActionState(action, initialState);
  const [role, setRole] = useState<CardRole>(card?.role ?? "ATTACKER");
  const [abilities, setAbilities] = useState<Ability[]>(
    card?.role === role ? (card?.abilities ?? []) : []
  );

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (state && state.error === null) {
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const submitLabel =
    mode === "propose"
      ? pending
        ? "Submitting…"
        : "Submit Proposal"
      : pending
        ? "Saving…"
        : mode === "create"
          ? "Create Card"
          : "Save Changes";

  function handleRoleChange(next: CardRole) {
    setRole(next);
    setAbilities(next === card?.role ? (card?.abilities ?? []) : []);
  }

  function updateAbility(index: number, patch: Partial<Ability>) {
    setAbilities((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...patch } : a))
    );
  }

  function removeAbility(index: number) {
    setAbilities((prev) => prev.filter((_, i) => i !== index));
  }

  const maxAbilities = role === "ATTACKER" ? 2 : role === "SUPPORT" ? 1 : 0;

  return (
    <form
      action={formAction}
      className="mt-4 flex flex-col gap-4 rounded-xl border border-white/10 bg-black/20 p-4"
    >
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-400">
          Title
        </span>
        <input
          name="title"
          type="text"
          required
          defaultValue={card?.title}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-400">
            Role
          </span>
          <select
            name="role"
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as CardRole)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
          >
            <option value="ATTACKER">Attacker</option>
            <option value="SUPPORT">Support</option>
            <option value="ENERGY">Energy</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-400">
            Card Type
          </span>
          <input
            name="cardType"
            type="text"
            placeholder="e.g. Dumpling, Mala, Sauce"
            defaultValue={card?.cardType}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
          />
        </label>
      </div>

      {role === "ATTACKER" && (
        <label className="block w-32">
          <span className="mb-1 block text-xs font-medium text-stone-400">
            HP
          </span>
          <input
            name="hp"
            type="number"
            min={1}
            max={99}
            defaultValue={card?.hp ?? 50}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
          />
        </label>
      )}

      {role === "ENERGY" && (
        <label className="block w-32">
          <span className="mb-1 block text-xs font-medium text-stone-400">
            Energy Amount
          </span>
          <input
            name="energyAmount"
            type="number"
            min={1}
            max={10}
            defaultValue={card?.energyAmount ?? 1}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
          />
        </label>
      )}

      {maxAbilities > 0 && (
        <div>
          <span className="mb-1 block text-xs font-medium text-stone-400">
            {role === "ATTACKER" ? "Attacks" : "Effect"}
          </span>
          <div className="flex flex-col gap-2">
            {abilities.map((ability, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-lg border border-white/10 p-2"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={ability.name}
                    onChange={(e) =>
                      updateAbility(i, { name: e.target.value })
                    }
                    className="w-1/3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={ability.description}
                    onChange={(e) =>
                      updateAbility(i, { description: e.target.value })
                    }
                    className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
                  />
                  <button
                    type="button"
                    onClick={() => removeAbility(i)}
                    className="shrink-0 rounded-full border border-white/10 px-3 text-xs font-medium text-stone-300 hover:border-red-400/50"
                  >
                    Remove
                  </button>
                </div>

                {role === "ATTACKER" && (
                  <div className="flex gap-2">
                    <label className="flex-1 text-xs text-stone-400">
                      Damage
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={ability.damage ?? 0}
                        onChange={(e) =>
                          updateAbility(i, {
                            damage: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
                      />
                    </label>
                    <label className="flex-1 text-xs text-stone-400">
                      Energy Cost
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={ability.energyCost ?? 0}
                        onChange={(e) =>
                          updateAbility(i, {
                            energyCost: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
                      />
                    </label>
                  </div>
                )}

                {role === "SUPPORT" && (
                  <div className="flex gap-2">
                    <label className="flex-1 text-xs text-stone-400">
                      Effect Type
                      <select
                        value={ability.effectType ?? "DRAW"}
                        onChange={(e) =>
                          updateAbility(i, {
                            effectType: e.target.value as EffectType,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
                      >
                        {EFFECT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex-1 text-xs text-stone-400">
                      Magnitude
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={ability.magnitude ?? 0}
                        onChange={(e) =>
                          updateAbility(i, {
                            magnitude: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
          {abilities.length < maxAbilities && (
            <button
              type="button"
              onClick={() =>
                setAbilities((prev) => [
                  ...prev,
                  role === "ATTACKER"
                    ? { name: "", description: "", damage: 10, energyCost: 1 }
                    : {
                        name: "",
                        description: "",
                        effectType: "DRAW",
                        magnitude: 1,
                      },
                ])
              }
              className="mt-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50"
            >
              {role === "ATTACKER" ? "Add Attack" : "Add Effect"}
            </button>
          )}
          <input
            type="hidden"
            name="abilities"
            value={JSON.stringify(abilities)}
          />
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-400">
          Flavor / Dish Description
        </span>
        <textarea
          name="body"
          rows={4}
          defaultValue={card?.body}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
        />
      </label>

      {card && card.imageUrls.length > 0 && (
        <div>
          <span className="mb-1 block text-xs font-medium text-stone-400">
            Existing Images
          </span>
          <div className="flex flex-wrap gap-3">
            {card.imageUrls.map((url) => (
              <label
                key={url}
                className="flex flex-col items-center gap-1 text-xs text-stone-400"
              >
                <img
                  src={url}
                  alt=""
                  className="h-16 w-16 rounded-lg border border-white/10 object-cover"
                />
                <span className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    name="keepImages"
                    value={url}
                    defaultChecked
                  />
                  keep
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-400">
          Add Images
        </span>
        <input
          name="images"
          type="file"
          accept="image/*"
          multiple
          className="w-full text-sm text-stone-300 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-stone-200"
        />
      </label>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
        >
          {submitLabel}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-stone-300 hover:border-white/30"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
