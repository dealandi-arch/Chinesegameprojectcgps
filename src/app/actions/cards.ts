"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Ability, CardRole, EffectType } from "@/lib/cards";

export type CardActionResult =
  | { error: string; conflict?: boolean }
  | { error: null; cardId?: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BUCKET = "pack-images";

const MAX_ABILITY_NAME = 60;
const MAX_ABILITY_DESC = 300;
const ROLES: CardRole[] = ["ATTACKER", "SUPPORT", "ENERGY"];
const EFFECT_TYPES: EffectType[] = ["DRAW", "HEAL", "ADD_ENERGY", "BOOST_DAMAGE"];

async function uploadCardImages(
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

function parseRole(raw: FormDataEntryValue | null): CardRole {
  const value = String(raw ?? "");
  return (ROLES as string[]).includes(value) ? (value as CardRole) : "ATTACKER";
}

function parseAbilities(raw: FormDataEntryValue | null, role: CardRole): Ability[] {
  const maxAbilities = role === "ATTACKER" ? 2 : role === "SUPPORT" ? 1 : 0;
  if (maxAbilities === 0) return [];

  try {
    const parsed = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (a): a is Record<string, unknown> => Boolean(a) && typeof a === "object"
      )
      .map((a): Ability => {
        const ability: Ability = {
          name: String(a.name ?? "")
            .trim()
            .slice(0, MAX_ABILITY_NAME),
          description: String(a.description ?? "")
            .trim()
            .slice(0, MAX_ABILITY_DESC),
        };
        if (role === "ATTACKER") {
          ability.damage = clampInt(String(a.damage ?? 0), 0, 0, 99);
          ability.energyCost = clampInt(String(a.energyCost ?? 0), 0, 0, 10);
        } else if (role === "SUPPORT") {
          const effectType = String(a.effectType ?? "");
          ability.effectType = (EFFECT_TYPES as string[]).includes(effectType)
            ? (effectType as EffectType)
            : "DRAW";
          ability.magnitude = clampInt(String(a.magnitude ?? 0), 1, 0, 50);
        }
        return ability;
      })
      .filter((a) => a.name.length > 0)
      .slice(0, maxAbilities);
  } catch {
    return [];
  }
}

function readCardFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const cardType = String(formData.get("cardType") ?? "").trim();
  const role = parseRole(formData.get("role"));
  const hp = clampInt(formData.get("hp"), 1, 1, 99);
  const energyAmount = clampInt(formData.get("energyAmount"), 1, 1, 10);
  const abilities = parseAbilities(formData.get("abilities"), role);
  return { title, body, cardType, role, hp, energyAmount, abilities };
}

export async function createCard(
  _prevState: CardActionResult | null,
  formData: FormData
): Promise<CardActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can create cards." };
  }

  const { title, body, cardType, role, hp, energyAmount, abilities } =
    readCardFields(formData);
  if (!title) {
    return { error: "Title is required." };
  }

  let imageUrls: string[];
  try {
    imageUrls = await uploadCardImages(
      formData.getAll("images").filter((f): f is File => f instanceof File),
      "new"
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("cards")
    .insert({
      title,
      body,
      image_urls: imageUrls,
      role,
      hp,
      energy_amount: energyAmount,
      card_type: cardType,
      abilities,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Failed to create card. Try again." };
  }

  revalidatePath("/admin");
  return { error: null, cardId: data.id };
}

export async function updateCard(
  cardId: string,
  _prevState: CardActionResult | null,
  formData: FormData
): Promise<CardActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can edit cards directly." };
  }

  const { title, body, cardType, role, hp, energyAmount, abilities } =
    readCardFields(formData);
  if (!title) {
    return { error: "Title is required." };
  }

  const keepImages = formData.getAll("keepImages").map(String);

  let newImageUrls: string[];
  try {
    newImageUrls = await uploadCardImages(
      formData.getAll("images").filter((f): f is File => f instanceof File),
      cardId
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }

  const adminClient = createAdminClient();
  const { data: existing, error: fetchError } = await adminClient
    .from("cards")
    .select("version")
    .eq("id", cardId)
    .single();

  if (fetchError || !existing) {
    return { error: "That card no longer exists." };
  }

  const { error } = await adminClient
    .from("cards")
    .update({
      title,
      body,
      image_urls: [...keepImages, ...newImageUrls],
      role,
      hp,
      energy_amount: energyAmount,
      card_type: cardType,
      abilities,
      version: existing.version + 1,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cardId);

  if (error) {
    return { error: "Failed to update card. Try again." };
  }

  revalidatePath("/admin");
  return { error: null, cardId };
}

export async function proposeCardEdit(
  cardId: string | null,
  _prevState: CardActionResult | null,
  formData: FormData
): Promise<CardActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "CO_ADMIN") {
    return { error: "Only co-admins can propose edits." };
  }

  const { title, body, cardType, role, hp, energyAmount, abilities } =
    readCardFields(formData);
  if (!title) {
    return { error: "Title is required." };
  }

  const keepImages = formData.getAll("keepImages").map(String);

  let newImageUrls: string[];
  try {
    newImageUrls = await uploadCardImages(
      formData.getAll("images").filter((f): f is File => f instanceof File),
      cardId ?? "new"
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }

  const adminClient = createAdminClient();

  let baseVersion: number | null = null;
  if (cardId) {
    const { data: card, error: cardError } = await adminClient
      .from("cards")
      .select("version")
      .eq("id", cardId)
      .single();
    if (cardError || !card) {
      return { error: "That card no longer exists." };
    }
    baseVersion = card.version;
  }

  const { error } = await adminClient.from("card_edit_requests").insert({
    card_id: cardId,
    base_version: baseVersion,
    proposed_by: currentUser.id,
    title,
    body,
    image_urls: [...keepImages, ...newImageUrls],
    role,
    hp,
    energy_amount: energyAmount,
    card_type: cardType,
    abilities,
  });

  if (error) {
    return { error: "Failed to submit proposal. Try again." };
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function approveCardEditRequest(
  requestId: string,
  force: boolean
): Promise<CardActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can approve edit requests." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("approve_card_edit_request", {
    p_request_id: requestId,
    p_reviewer_id: currentUser.id,
    p_force: force,
  });

  if (error) {
    if (error.message.includes("version_conflict")) {
      return {
        error:
          "This card changed since the proposal was made. Approve anyway or reject it.",
        conflict: true,
      };
    }
    if (error.message.includes("already_reviewed")) {
      return { error: "This request was already reviewed." };
    }
    return { error: "Failed to approve request. Try again." };
  }

  revalidatePath("/admin");
  return { error: null, cardId: data?.[0]?.card_id };
}

export async function rejectCardEditRequest(
  requestId: string,
  note?: string
): Promise<CardActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can reject edit requests." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("card_edit_requests")
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
