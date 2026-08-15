"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createSlide,
  updateSlide,
  proposeSlideEdit,
  type SlideActionResult,
} from "@/app/actions/slides";
import type { Slide } from "@/lib/slides";

const initialState: SlideActionResult | null = null;

export function SlideEditForm({
  mode,
  slide,
  nextOrderIndex,
  onDone,
}: {
  mode: "create" | "edit" | "propose";
  slide?: Slide;
  nextOrderIndex?: number;
  onDone?: () => void;
}) {
  const action =
    mode === "create"
      ? createSlide
      : mode === "edit"
        ? updateSlide.bind(null, slide!.id)
        : proposeSlideEdit.bind(null, slide?.id ?? null);

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
          ? "Create Slide"
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
          defaultValue={slide?.title}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
        />
      </label>

      <label className="block w-32">
        <span className="mb-1 block text-xs font-medium text-stone-400">
          Order
        </span>
        <input
          name="orderIndex"
          type="number"
          min={0}
          max={9999}
          defaultValue={slide?.orderIndex ?? nextOrderIndex ?? 0}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
        />
        <span className="mt-1 block text-[11px] text-stone-500">
          Lower numbers show first in the slideshow.
        </span>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-400">
          Body
        </span>
        <textarea
          name="body"
          rows={6}
          defaultValue={slide?.body}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
        />
      </label>

      {slide && slide.imageUrls.length > 0 && (
        <div>
          <span className="mb-1 block text-xs font-medium text-stone-400">
            Existing Images
          </span>
          <div className="flex flex-wrap gap-3">
            {slide.imageUrls.map((url) => (
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
