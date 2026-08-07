"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createPack,
  updatePack,
  proposePackEdit,
  type PackActionResult,
} from "@/app/actions/packs";
import type { Pack } from "@/lib/packs";

const initialState: PackActionResult | null = null;

export function PackEditForm({
  mode,
  pack,
  onDone,
}: {
  mode: "create" | "edit" | "propose";
  pack?: Pack;
  onDone?: () => void;
}) {
  const action =
    mode === "create"
      ? createPack
      : mode === "edit"
        ? updatePack.bind(null, pack!.id)
        : proposePackEdit.bind(null, pack?.id ?? null);

  const [state, formAction, pending] = useActionState(action, initialState);

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
          ? "Create Pack"
          : "Save Changes";

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
          defaultValue={pack?.title}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-400">
          Info Text
        </span>
        <textarea
          name="body"
          rows={4}
          defaultValue={pack?.body}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
        />
      </label>

      {pack && pack.imageUrls.length > 0 && (
        <div>
          <span className="mb-1 block text-xs font-medium text-stone-400">
            Existing Images
          </span>
          <div className="flex flex-wrap gap-3">
            {pack.imageUrls.map((url) => (
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
