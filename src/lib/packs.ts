import { createAdminClient } from "@/utils/supabase/admin";

export type Pack = {
  id: string;
  title: string;
  body: string;
  imageUrls: string[];
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type PackEditRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PackEditRequest = {
  id: string;
  packId: string | null;
  baseVersion: number | null;
  proposedBy: string;
  title: string;
  body: string;
  imageUrls: string[];
  status: PackEditRequestStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type PackRow = {
  id: string;
  title: string;
  body: string;
  image_urls: string[];
  version: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

type PackEditRequestRow = {
  id: string;
  pack_id: string | null;
  base_version: number | null;
  proposed_by: string;
  title: string;
  body: string;
  image_urls: string[];
  status: PackEditRequestStatus;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function mapPack(row: PackRow): Pack {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrls: row.image_urls,
    version: row.version,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPackEditRequest(row: PackEditRequestRow): PackEditRequest {
  return {
    id: row.id,
    packId: row.pack_id,
    baseVersion: row.base_version,
    proposedBy: row.proposed_by,
    title: row.title,
    body: row.body,
    imageUrls: row.image_urls,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

export async function getAllPacks(): Promise<Pack[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("packs")
    .select("*")
    .order("title", { ascending: true });

  if (error || !data) return [];
  return (data as PackRow[]).map(mapPack);
}

export async function getPendingPackEditRequests(): Promise<PackEditRequest[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("pack_edit_requests")
    .select("*")
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as PackEditRequestRow[]).map(mapPackEditRequest);
}

export async function getMyPendingProposals(
  userId: string
): Promise<PackEditRequest[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("pack_edit_requests")
    .select("*")
    .eq("proposed_by", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as PackEditRequestRow[]).map(mapPackEditRequest);
}
