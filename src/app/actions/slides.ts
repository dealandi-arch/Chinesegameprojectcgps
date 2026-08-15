"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

export type SlideActionResult =
  | { error: string; conflict?: boolean }
  | { error: null; slideId?: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BUCKET = "pack-images";

async function uploadSlideImages(
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
    const path = `slides/${scope}/${randomUUID()}.${ext}`;
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

function clampInt(
  raw: FormDataEntryValue | null,
  fallback: number,
  min: number,
  max: number
): number {
  const n = Math.trunc(Number(raw));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function readSlideFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const orderIndex = clampInt(formData.get("orderIndex"), 0, 0, 9999);
  return { title, body, orderIndex };
}

export async function createSlide(
  _prevState: SlideActionResult | null,
  formData: FormData
): Promise<SlideActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can create slides." };
  }

  const { title, body, orderIndex } = readSlideFields(formData);
  if (!title) {
    return { error: "Title is required." };
  }

  let imageUrls: string[];
  try {
    imageUrls = await uploadSlideImages(
      formData.getAll("images").filter((f): f is File => f instanceof File),
      "new"
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("slides")
    .insert({
      title,
      body,
      image_urls: imageUrls,
      order_index: orderIndex,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Failed to create slide. Try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/info");
  return { error: null, slideId: data.id };
}

export async function updateSlide(
  slideId: string,
  _prevState: SlideActionResult | null,
  formData: FormData
): Promise<SlideActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can edit slides directly." };
  }

  const { title, body, orderIndex } = readSlideFields(formData);
  if (!title) {
    return { error: "Title is required." };
  }

  const keepImages = formData.getAll("keepImages").map(String);

  let newImageUrls: string[];
  try {
    newImageUrls = await uploadSlideImages(
      formData.getAll("images").filter((f): f is File => f instanceof File),
      slideId
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }

  const adminClient = createAdminClient();
  const { data: existing, error: fetchError } = await adminClient
    .from("slides")
    .select("version")
    .eq("id", slideId)
    .single();

  if (fetchError || !existing) {
    return { error: "That slide no longer exists." };
  }

  const { error } = await adminClient
    .from("slides")
    .update({
      title,
      body,
      image_urls: [...keepImages, ...newImageUrls],
      order_index: orderIndex,
      version: existing.version + 1,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", slideId);

  if (error) {
    return { error: "Failed to update slide. Try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/info");
  return { error: null, slideId };
}

export async function proposeSlideEdit(
  slideId: string | null,
  _prevState: SlideActionResult | null,
  formData: FormData
): Promise<SlideActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "CO_ADMIN") {
    return { error: "Only co-admins can propose slide edits." };
  }

  const { title, body, orderIndex } = readSlideFields(formData);
  if (!title) {
    return { error: "Title is required." };
  }

  const keepImages = formData.getAll("keepImages").map(String);

  let newImageUrls: string[];
  try {
    newImageUrls = await uploadSlideImages(
      formData.getAll("images").filter((f): f is File => f instanceof File),
      slideId ?? "new"
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }

  const adminClient = createAdminClient();

  let baseVersion: number | null = null;
  if (slideId) {
    const { data: slide, error: slideError } = await adminClient
      .from("slides")
      .select("version")
      .eq("id", slideId)
      .single();
    if (slideError || !slide) {
      return { error: "That slide no longer exists." };
    }
    baseVersion = slide.version;
  }

  const { error } = await adminClient.from("slide_edit_requests").insert({
    slide_id: slideId,
    base_version: baseVersion,
    proposed_by: currentUser.id,
    title,
    body,
    image_urls: [...keepImages, ...newImageUrls],
    order_index: orderIndex,
  });

  if (error) {
    return { error: "Failed to submit proposal. Try again." };
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function approveSlideEditRequest(
  requestId: string,
  force: boolean
): Promise<SlideActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can approve edit requests." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc(
    "approve_slide_edit_request",
    {
      p_request_id: requestId,
      p_reviewer_id: currentUser.id,
      p_force: force,
    }
  );

  if (error) {
    if (error.message.includes("version_conflict")) {
      return {
        error:
          "This slide changed since the proposal was made. Approve anyway or reject it.",
        conflict: true,
      };
    }
    if (error.message.includes("already_reviewed")) {
      return { error: "This request was already reviewed." };
    }
    return { error: "Failed to approve request. Try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/info");
  return { error: null, slideId: data?.[0]?.slide_id };
}

export async function rejectSlideEditRequest(
  requestId: string,
  note?: string
): Promise<SlideActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can reject edit requests." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("slide_edit_requests")
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
