"use client";

import { useState, useTransition } from "react";
import { claimSuperAdmin } from "@/app/actions/admin";

// Shown in the Notifications tab to every admin who isn't already a super
// admin: if they hold the super admin code, they can enter it here and be
// promoted on the spot, rather than the code only working at signup.
export function SuperAdminClaimPanel() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const trimmed = code.trim();
    if (!trimmed || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await claimSuperAdmin(trimmed);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCode("");
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4">
        <h3 className="text-sm font-semibold text-red-300">
          You are now a super admin
        </h3>
        <p className="mt-1 text-xs text-stone-400">
          You can now delete staff chat messages. Reload the panel to see
          your new badge.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-white">
        Have the super admin code?
      </h3>
      <p className="mt-1 text-xs text-stone-400">
        Enter it to promote yourself to super admin — the only role that can
        delete staff chat messages. Leave this alone if you weren&apos;t
        given a code.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Super admin code"
          autoComplete="off"
          className="w-56 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
        />
        <button
          onClick={submit}
          disabled={isPending || !code.trim()}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          {isPending ? "Checking…" : "Promote me"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
