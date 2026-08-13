"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat";
import type { ChatActionResult } from "@/app/actions/chat";

const POLL_INTERVAL_MS = 3000;

const ROLE_TAG: Record<string, string> = {
  ADMIN: "[Admin] ",
  CO_ADMIN: "[Co-Admin] ",
};

type ChatTheme = "dark" | "light";

const THEME = {
  dark: {
    container: "border-white/10 bg-white/5",
    message: "text-stone-300",
    username: "text-white",
    tag: "text-amber-300",
    timestamp: "text-stone-500",
    input: "border-white/10 bg-black/30 text-white focus:border-amber-400/60",
    empty: "text-stone-500",
  },
  light: {
    container: "border-amber-200 bg-white/80",
    message: "text-stone-700",
    username: "text-stone-900",
    tag: "text-red-700",
    timestamp: "text-stone-400",
    input: "border-amber-200 bg-white text-stone-900 focus:border-amber-400",
    empty: "text-stone-400",
  },
} as const;

export function ChatPanel({
  fetchAction,
  sendAction,
  theme = "light",
  heightClass = "h-72",
}: {
  fetchAction: () => Promise<ChatMessage[]>;
  sendAction: (body: string) => Promise<ChatActionResult>;
  theme?: ChatTheme;
  heightClass?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const t = THEME[theme];

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const result = await fetchAction();
      if (!cancelled) setMessages(result);
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchAction]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const result = await sendAction(body);
    setSending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setInput("");
    const refreshed = await fetchAction();
    setMessages(refreshed);
  }

  return (
    <div className={`flex flex-col rounded-xl border ${t.container}`}>
      <div className={`flex-1 overflow-y-auto p-3 ${heightClass}`}>
        {messages.length === 0 ? (
          <p className={`text-sm ${t.empty}`}>No messages yet — say hello.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className={`font-semibold ${t.tag}`}>
                  {ROLE_TAG[m.senderRole] ?? ""}
                </span>
                <span className={`font-semibold ${t.username}`}>
                  {m.senderUsername}
                </span>
                <span className={t.message}>: {m.body}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && <p className="px-3 text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 border-t border-inherit p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Type a message…"
          maxLength={500}
          className={`flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none ${t.input}`}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
