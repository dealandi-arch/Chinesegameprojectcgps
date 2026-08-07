import { PendingRequestRow } from "@/components/packs/PendingRequestRow";
import type { PackEditRequest, Pack } from "@/lib/packs";
import type { DirectoryUser } from "@/lib/users";

export function PendingRequestList({
  requests,
  users,
  packs,
}: {
  requests: PackEditRequest[];
  users: DirectoryUser[];
  packs: Pack[];
}) {
  if (requests.length === 0) return null;

  const usernameById = new Map(users.map((u) => [u.id, u.username]));
  const titleById = new Map(packs.map((p) => [p.id, p.title]));

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">
        Pending Pack Edit Requests
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {requests.map((request) => (
          <PendingRequestRow
            key={request.id}
            request={request}
            proposerUsername={usernameById.get(request.proposedBy) ?? "unknown"}
            packTitle={request.packId ? titleById.get(request.packId) ?? null : null}
          />
        ))}
      </div>
    </div>
  );
}
