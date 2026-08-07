"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

export type PackActionResult =
  | { error: string; conflict?: boolean }
  | { error: null; packId?: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BUCKET = "pack-images";

async function uploadPackImages(
  files: File[],
  scope: string
): Promise<string[]> {
  const adminClient = createAdminClient();
  const urls: string[] = [];

  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error("Images must be under 5MB.");
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${scope}/${randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error } = await adminClient.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (error) {
      throw new Error("Image upload failed. Try again.");
    }

    const { data } = adminClient.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

function readTextFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  return { title, body };
}

export async function createPack(
  _prevState: PackActionResult | null,
  formData: FormData
): Promise<PackActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can create packs." };
  }

  const { title, body } = readTextFields(formData);
  if (!title) {
    return { error: "Title is required." };
  }

  let imageUrls: string[];
  try {
    imageUrls = await uploadPackImages(
      formData.getAll("images").filter((f): f is File => f instanceof File),
      "new"
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("packs")
    .insert({
      title,
      body,
      image_urls: imageUrls,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Failed to create pack. Try again." };
  }

  revalidatePath("/admin");
  return { error: null, packId: data.id };
}

export async function updatePack(
  packId: string,
  _prevState: PackActionResult | null,
  formData: FormData
): Promise<PackActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can edit packs directly." };
  }

  const { title, body } = readTextFields(formData);
  if (!title) {
    return { error: "Title is required." };
  }

  const keepImages = formData.getAll("keepImages").map(String);

  let newImageUrls: string[];
  try {
    newImageUrls = await uploadPackImages(
      formData.getAll("images").filter((f): f is File => f instanceof File),
      packId
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }

  const adminClient = createAdminClient();
  const { data: existing, error: fetchError } = await adminClient
    .from("packs")
    .select("version")
    .eq("id", packId)
    .single();

  if (fetchError || !existing) {
    return { error: "That pack no longer exists." };
  }

  const { error } = await adminClient
    .from("packs")
    .update({
      title,
      body,
      image_urls: [...keepImages, ...newImageUrls],
      version: existing.version + 1,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", packId);

  if (error) {
    return { error: "Failed to update pack. Try again." };
  }

  revalidatePath("/admin");
  return { error: null, packId };
}

export async function proposePackEdit(
  packId: string | null,
  _prevState: PackActionResult | null,
  formData: FormData
): Promise<PackActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "CO_ADMIN") {
    return { error: "Only co-admins can propose edits." };
  }

  const { title, body } = readTextFields(formData);
  if (!title) {
    return { error: "Title is required." };
  }

  const keepImages = formData.getAll("keepImages").map(String);

  let newImageUrls: string[];
  try {
    newImageUrls = await uploadPackImages(
      formData.getAll("images").filter((f): f is File => f instanceof File),
      packId ?? "new"
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }

  const adminClient = createAdminClient();

  let baseVersion: number | null = null;
  if (packId) {
    const { data: pack, error: packError } = await adminClient
      .from("packs")
      .select("version")
      .eq("id", packId)
      .single();
    if (packError || !pack) {
      return { error: "That pack no longer exists." };
    }
    baseVersion = pack.version;
  }

  const { error } = await adminClient.from("pack_edit_requests").insert({
    pack_id: packId,
    base_version: baseVersion,
    proposed_by: currentUser.id,
    title,
    body,
    image_urls: [...keepImages, ...newImageUrls],
  });

  if (error) {
    return { error: "Failed to submit proposal. Try again." };
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function approvePackEditRequest(
  requestId: string,
  force: boolean
): Promise<PackActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can approve edit requests." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("approve_pack_edit_request", {
    p_request_id: requestId,
    p_reviewer_id: currentUser.id,
    p_force: force,
  });

  if (error) {
    if (error.message.includes("version_conflict")) {
      return {
        error:
          "This pack changed since the proposal was made. Approve anyway or reject it.",
        conflict: true,
      };
    }
    if (error.message.includes("already_reviewed")) {
      return { error: "This request was already reviewed." };
    }
    return { error: "Failed to approve request. Try again." };
  }

  revalidatePath("/admin");
  return { error: null, packId: data?.[0]?.pack_id };
}

export async function rejectPackEditRequest(
  requestId: string,
  note?: string
): Promise<PackActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can reject edit requests." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("pack_edit_requests")
    .update({
      status: "REJECTED",
      reviewed_by: currentUser.id,
      review_note: note ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "PENDING")
    .select("id");

  if (error) {
    return { error: "Failed to reject request. Try again." };
  }
  if (!data || data.length === 0) {
    return { error: "This request was already reviewed." };
  }

  revalidatePath("/admin");
  return { error: null };
}
