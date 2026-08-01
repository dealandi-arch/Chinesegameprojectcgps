"use client";

import { useState, useTransition } from "react";
import { setCoAdminStatus } from "@/app/actions/admin";

type Role = "USER" | "CO_ADMIN" | "ADMIN";

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: "bg-amber-400/20 text-amber-300",
  CO_ADMIN: "bg-emerald-400/20 text-emerald-300",
  USER: "bg-white/10 text-stone-300",
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  CO_ADMIN: "Co-Admin",
  USER: "Player",
};

export function AdminUserRow({
  id,
  username,
  role,
  createdAt,
}: {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleCoAdmin() {
    setError(null);
    startTransition(async () => {
      const result = await setCoAdminStatus(id, role !== "CO_ADMIN");
      if (result.error) setError(result.error);
    });
  }

  return (
    <tr className="border-b border-white/5">
      <td className="py-3 pr-4 text-sm text-white">{username}</td>
      <td className="py-3 pr-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${ROLE_STYLES[role]}`}
        >
          {ROLE_LABEL[role]}
        </span>
      </td>
      <td className="py-3 pr-4 text-xs text-stone-500">
        {new Date(createdAt).toLocaleDateString("en-US")}
      </td>
      <td className="py-3 text-right">
        {role === "ADMIN" ? (
          <span className="text-xs text-stone-600">—</span>
        ) : (
          <button
            onClick={toggleCoAdmin}
            disabled={isPending}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-amber-400/50 disabled:opacity-50"
          >
            {isPending
              ? "Saving…"
              : role === "CO_ADMIN"
                ? "Remove Co-Admin"
                : "Make Co-Admin"}
          </button>
        )}
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </td>
    </tr>
  );
}
