import { PendingSlideRequestRow } from "@/components/slides/PendingSlideRequestRow";
import type { SlideEditRequest, Slide } from "@/lib/slides";
import type { DirectoryUser } from "@/lib/users";

export function PendingSlideRequestList({
  requests,
  users,
  slides,
}: {
  requests: SlideEditRequest[];
  users: DirectoryUser[];
  slides: Slide[];
}) {
  const usernameById = new Map(users.map((u) => [u.id, u.username]));
  const titleById = new Map(slides.map((s) => [s.id, s.title]));

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">
        Pending Slide Edit Requests
      </h2>
      {requests.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">
          No pending slide submissions.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {requests.map((request) => (
            <PendingSlideRequestRow
              key={request.id}
              request={request}
              proposerUsername={
                usernameById.get(request.proposedBy) ?? "unknown"
              }
              slideTitle={
                request.slideId ? titleById.get(request.slideId) ?? null : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
