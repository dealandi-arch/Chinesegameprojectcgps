import { createAdminClient } from "@/utils/supabase/admin";

export type Slide = {
  id: string;
  title: string;
  body: string;
  imageUrls: string[];
  orderIndex: number;
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type SlideEditRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SlideEditRequest = {
  id: string;
  slideId: string | null;
  baseVersion: number | null;
  proposedBy: string;
  title: string;
  body: string;
  imageUrls: string[];
  orderIndex: number;
  status: SlideEditRequestStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type SlideRow = {
  id: string;
  title: string;
  body: string;
  image_urls: string[];
  order_index: number;
  version: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

type SlideEditRequestRow = {
  id: string;
  slide_id: string | null;
  base_version: number | null;
  proposed_by: string;
  title: string;
  body: string;
  image_urls: string[];
  order_index: number;
  status: SlideEditRequestStatus;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function mapSlide(row: SlideRow): Slide {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrls: row.image_urls,
    orderIndex: row.order_index,
    version: row.version,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSlideEditRequest(row: SlideEditRequestRow): SlideEditRequest {
  return {
    id: row.id,
    slideId: row.slide_id,
    baseVersion: row.base_version,
    proposedBy: row.proposed_by,
    title: row.title,
    body: row.body,
    imageUrls: row.image_urls,
    orderIndex: row.order_index,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

export async function getAllSlides(): Promise<Slide[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("slides")
    .select("*")
    .order("order_index", { ascending: true })
    .order("title", { ascending: true });

  if (error || !data) return [];
  return (data as SlideRow[]).map(mapSlide);
}

export async function getPendingSlideEditRequests(): Promise<
  SlideEditRequest[]
> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("slide_edit_requests")
    .select("*")
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as SlideEditRequestRow[]).map(mapSlideEditRequest);
}

export async function getMySlideProposals(
  userId: string
): Promise<SlideEditRequest[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("slide_edit_requests")
    .select("*")
    .eq("proposed_by", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as SlideEditRequestRow[]).map(mapSlideEditRequest);
}
