import { PendingRequestRow } from "@/components/cards/PendingRequestRow";
import type { CardEditRequest, Card } from "@/lib/cards";
import type { DirectoryUser } from "@/lib/users";

export function PendingRequestList({
  requests,
  users,
  cards,
}: {
  requests: CardEditRequest[];
  users: DirectoryUser[];
  cards: Card[];
}) {
  const usernameById = new Map(users.map((u) => [u.id, u.username]));
  const titleById = new Map(cards.map((c) => [c.id, c.title]));

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">
        Pending Card Edit Requests
      </h2>
      {requests.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">
          No pending card submissions.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {requests.map((request) => (
            <PendingRequestRow
              key={request.id}
              request={request}
              proposerUsername={
                usernameById.get(request.proposedBy) ?? "unknown"
              }
              cardTitle={
                request.cardId ? titleById.get(request.cardId) ?? null : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
