"use client";

import { useEffect, useRef, useState } from "react";
import { useGameTheme } from "@/components/theme/ThemeContext";
import type { ChatMessage } from "@/lib/chat";
import type { ChatActionResult } from "@/app/actions/chat";

const POLL_INTERVAL_MS = 3000;

const ROLE_TAG: Record<string, string> = {
  ADMIN: "[Admin] ",
  CO_ADMIN: "[Co-Admin] ",
};

// The super admin flag outranks the role tag -- a super admin is an ADMIN
// underneath, but showing "[Admin]" for them would hide who actually holds
// the moderation powers.
function tagFor(message: ChatMessage): string {
  if (message.senderIsSuperAdmin) return "[Super Admin] ";
  return ROLE_TAG[message.senderRole] ?? "";
}

type ChatTheme = "dark" | "light" | "lime";

const THEME = {
  dark: {
    container: "border-white/10 bg-white/5",
    message: "text-stone-300",
    username: "text-white",
    tag: "text-amber-300",
    timestamp: "text-stone-500",
    input: "border-white/10 bg-black/30 text-white focus:border-amber-400/60",
    empty: "text-stone-500",
    modBar: "border-white/10 text-stone-400",
    modButton: "border-white/10 text-stone-300 hover:border-red-400/60",
  },
  light: {
    container: "border-amber-200 bg-white/80",
    message: "text-stone-700",
    username: "text-stone-900",
    tag: "text-red-700",
    timestamp: "text-stone-400",
    input: "border-amber-200 bg-white text-stone-900 focus:border-amber-400",
    empty: "text-stone-400",
    modBar: "border-amber-200 text-stone-500",
    modButton: "border-amber-300 text-stone-600 hover:border-red-500",
  },
  lime: {
    container: "border-lime-300 bg-white/80",
    message: "text-stone-700",
    username: "text-lime-950",
    tag: "text-lime-700",
    timestamp: "text-stone-400",
    input: "border-lime-300 bg-white text-lime-950 focus:border-lime-500",
    empty: "text-stone-400",
    modBar: "border-lime-300 text-stone-500",
    modButton: "border-lime-400 text-lime-800 hover:border-red-500",
  },
} as const;

export function ChatPanel({
  fetchAction,
  sendAction,
  deleteAction,
  clearAction,
  theme,
  heightClass = "h-72",
}: {
  fetchAction: () => Promise<ChatMessage[]>;
  sendAction: (body: string) => Promise<ChatActionResult>;
  // Moderation is opt-in: the caller passes these only for a viewer
  // allowed to use them (staff chat + super admin). The server actions
  // re-check that permission themselves -- these props only decide
  // whether the controls render at all.
  deleteAction?: (messageId: string) => Promise<ChatActionResult>;
  clearAction?: () => Promise<ChatActionResult>;
  // Omit to follow the user's game theme picker (light/dark/lime); pass an
  // explicit value to pin it regardless (the admin staff chat always
  // passes "dark", independent of the game theme).
  theme?: ChatTheme;
  heightClass?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { theme: gameTheme } = useGameTheme();
  const t = THEME[theme ?? gameTheme];

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

  async function handleDelete(messageId: string) {
    if (!deleteAction || busyId) return;
    setBusyId(messageId);
    setError(null);
    const result = await deleteAction(messageId);
    setBusyId(null);

    if (result.error) {
      setError(result.error);
      return;
    }
    setMessages(await fetchAction());
  }

  async function handleClearAll() {
    if (!clearAction || busyId) return;
    setBusyId("__all__");
    setError(null);
    const result = await clearAction();
    setBusyId(null);
    setConfirmingClear(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setMessages(await fetchAction());
  }

  return (
    <div className={`flex flex-col rounded-xl border ${t.container}`}>
      {clearAction && (
        <div
          className={`flex items-center justify-between gap-2 border-b px-3 py-1.5 text-xs ${t.modBar}`}
        >
          <span>Super admin moderation</span>
          {confirmingClear ? (
            <span className="flex items-center gap-2">
              <span>Delete every staff message?</span>
              <button
                onClick={handleClearAll}
                disabled={busyId !== null}
                className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {busyId === "__all__" ? "Clearing..." : "Yes, clear"}
              </button>
              <button
                onClick={() => setConfirmingClear(false)}
                disabled={busyId !== null}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${t.modButton}`}
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmingClear(true)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${t.modButton}`}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <div className={`flex-1 overflow-y-auto p-3 ${heightClass}`}>
        {messages.length === 0 ? (
          <p className={`text-sm ${t.empty}`}>No messages yet — say hello.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => (
              <div key={m.id} className="group flex items-start gap-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className={`font-semibold ${t.tag}`}>{tagFor(m)}</span>
                  <span className={`font-semibold ${t.username}`}>
                    {m.senderUsername}
                  </span>
                  <span
                    className={`whitespace-pre-wrap break-words ${t.message}`}
                  >
                    : {m.body}
                  </span>
                </span>
                {deleteAction && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={busyId !== null}
                    title="Delete this message"
                    aria-label={`Delete message from ${m.senderUsername}`}
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 disabled:opacity-50 ${t.modButton}`}
                  >
                    {busyId === m.id ? "..." : "✕"}
                  </button>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && <p className="px-3 text-xs text-red-500">{error}</p>}

      <div className="flex items-end gap-2 border-t border-inherit p-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message… (Shift+Enter for a new line)"
          maxLength={4000}
          rows={3}
          className={`max-h-40 min-h-[4.5rem] flex-1 resize-y rounded-lg border px-3 py-2 text-sm outline-none ${t.input}`}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="shrink-0 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
