import type { Role } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { getAllUsers } from "@/lib/users";

export type ChatChannelType = "GLOBAL" | "STAFF" | "BATTLE";

export type ChatMessage = {
  id: string;
  senderId: string;
  senderUsername: string;
  senderRole: Role;
  body: string;
  createdAt: string;
};

type ChatMessageRow = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export async function fetchChannelMessages(
  channelType: ChatChannelType,
  channelId: string | null,
  limit = 100
): Promise<ChatMessage[]> {
  const adminClient = createAdminClient();

  let query = adminClient
    .from("chat_messages")
    .select("id, sender_id, body, created_at")
    .eq("channel_type", channelType)
    .order("created_at", { ascending: false })
    .limit(limit);

  query = channelId === null ? query.is("channel_id", null) : query.eq("channel_id", channelId);

  const { data, error } = await query;
  if (error || !data) return [];

  const users = await getAllUsers();
  const userById = new Map(users.map((u) => [u.id, u]));

  return (data as ChatMessageRow[])
    .map((row) => {
      const sender = userById.get(row.sender_id);
      return {
        id: row.id,
        senderId: row.sender_id,
        senderUsername: sender?.username ?? "unknown",
        senderRole: sender?.role ?? "USER",
        body: row.body,
        createdAt: row.created_at,
      };
    })
    .reverse();
}
