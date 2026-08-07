"use client";

import { useState, type ReactNode } from "react";

export function AdminTabs({
  tabs,
}: {
  tabs: { key: string; label: string; content: ReactNode; badge?: number }[];
}) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div className="mt-10">
      <div className="flex gap-1 rounded-full bg-black/30 p-1 text-sm font-medium">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 transition-colors ${
              active === tab.key
                ? "bg-red-600 text-white"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {tab.label}
            {Boolean(tab.badge) && (
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tabs.find((tab) => tab.key === active)?.content}
      </div>
    </div>
  );
}
