import type { PackEditRequest, PackEditRequestStatus } from "@/lib/packs";

const STATUS_STYLES: Record<PackEditRequestStatus, string> = {
  PENDING: "bg-amber-400/20 text-amber-300",
  APPROVED: "bg-emerald-400/20 text-emerald-300",
  REJECTED: "bg-red-400/20 text-red-300",
};

export function MyProposalsList({
  proposals,
}: {
  proposals: PackEditRequest[];
}) {
  if (proposals.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">My Proposals</h2>
      <div className="mt-4 flex flex-col gap-3">
        {proposals.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div>
              <p className="text-xs text-stone-500">
                {p.packId ? "Edit proposal" : "New pack proposal"}
              </p>
              <h3 className="text-sm font-semibold text-white">{p.title}</h3>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[p.status]}`}
            >
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
