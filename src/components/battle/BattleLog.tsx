"use client";

import { useEffect, useRef } from "react";

// Renders the full battle log (never truncated -- a trimmed-down "last N
// lines" view can silently hide the one line that explains a confusing
// moment, like a support card boosting an attack's damage) inside a small
// scrollable box, auto-scrolled to the newest line by default while still
// letting you scroll up to review what actually happened this match.
export function BattleLog({
  log,
  className = "",
}: {
  log: string[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  return (
    <div
      ref={ref}
      className={`max-h-28 overflow-y-auto text-center text-[10px] leading-tight ${className}`}
    >
      {log.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  );
}
