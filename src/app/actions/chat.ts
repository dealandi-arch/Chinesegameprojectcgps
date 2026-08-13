"use server";

import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { fetchChannelMessages, type ChatMessage } from "@/lib/chat";

export type ChatActionResult = { error: string } | { error: null };

const MAX_MESSAGE_LENGTH = 4000;

function validateBody(raw: string): { body: string } | { error: string } {
  const body = raw.trim();
  if (!body) return { error: "Message can't be empty." };
  if (body.length > MAX_MESSAGE_LENGTH) {
    return { error: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` };
  }
  return { body };
}

async function insertMessage(
  channelType: "GLOBAL" | "STAFF" | "BATTLE",
  channelId: string | null,
  senderId: string,
  body: string
): Promise<ChatActionResult> {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("chat_messages").insert({
    channel_type: channelType,
    channel_id: channelId,
    sender_id: senderId,
    body,
  });

  if (error) {
    console.error("chat insertMessage failed:", error);
    const hint =
      error.code === "42P01"
        ? " (chat_messages table not found — has migration_007_chat.sql been run?)"
        : ` (${error.code ?? "unknown"}: ${error.message})`;
    return { error: `Failed to send message.${hint}` };
  }
  return { error: null };
}

export async function getGlobalMessages(): Promise<ChatMessage[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];
  return fetchChannelMessages("GLOBAL", null);
}

export async function sendGlobalMessage(body: string): Promise<ChatActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "You must be signed in." };

  const validated = validateBody(body);
  if ("error" in validated) return validated;

  return insertMessage("GLOBAL", null, currentUser.id, validated.body);
}

export async function getStaffMessages(): Promise<ChatMessage[]> {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "CO_ADMIN")
  ) {
    return [];
  }
  return fetchChannelMessages("STAFF", null);
}

export async function sendStaffMessage(body: string): Promise<ChatActionResult> {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "CO_ADMIN")
  ) {
    return { error: "Only admins and co-admins can post in staff chat." };
  }

  const validated = validateBody(body);
  if ("error" in validated) return validated;

  return insertMessage("STAFF", null, currentUser.id, validated.body);
}

async function isBattleParticipant(
  battleId: string,
  userId: string
): Promise<boolean> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("battles")
    .select("host_id, guest_id")
    .eq("id", battleId)
    .single();

  if (error || !data) return false;
  return data.host_id === userId || data.guest_id === userId;
}

export async function getBattleMessages(
  battleId: string
): Promise<ChatMessage[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];
  if (!(await isBattleParticipant(battleId, currentUser.id))) return [];
  return fetchChannelMessages("BATTLE", battleId);
}

export async function sendBattleMessage(
  battleId: string,
  body: string
): Promise<ChatActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "You must be signed in." };
  if (!(await isBattleParticipant(battleId, currentUser.id))) {
    return { error: "You're not a participant in this match." };
  }

  const validated = validateBody(body);
  if ("error" in validated) return validated;

  return insertMessage("BATTLE", battleId, currentUser.id, validated.body);
}
