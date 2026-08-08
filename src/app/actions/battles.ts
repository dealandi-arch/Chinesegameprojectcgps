"use server";

import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { getBattleReadyCards, toBattleCard } from "@/lib/cards";
import { createInitialState, battleReducer } from "@/lib/battle/engine";
import { redactStateFor, type RedactedBattleState } from "@/lib/battle/redact";
import type { BattleAction, BattleState, PlayerId } from "@/lib/battle/types";

type BattleStatus = "WAITING" | "ACTIVE" | "FINISHED";

const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateJoinCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code +=
      JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)];
  }
  return code;
}

async function resolveUsername(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string> {
  const { data, error } = await adminClient.auth.admin.getUserById(userId);
  if (error || !data.user) return "unknown";
  const meta = data.user.app_metadata as { username?: string };
  return meta.username ?? data.user.email?.split("@")[0] ?? "unknown";
}

export async function createBattle(): Promise<
  { error: string } | { error: null; battleId: string; joinCode: string }
> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "You must be signed in." };

  const adminClient = createAdminClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const joinCode = generateJoinCode();
    const { data, error } = await adminClient
      .from("battles")
      .insert({
        join_code: joinCode,
        host_id: currentUser.id,
        state: {},
      })
      .select("id")
      .single();

    if (!error && data) {
      return { error: null, battleId: data.id, joinCode };
    }
    if (error && error.code !== "23505") {
      return { error: "Failed to create room. Try again." };
    }
  }

  return { error: "Failed to create room. Try again." };
}

export async function joinBattle(
  joinCode: string
): Promise<{ error: string } | { error: null; battleId: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "You must be signed in." };

  const adminClient = createAdminClient();
  const normalizedCode = joinCode.trim().toUpperCase();

  const { data: battle, error: fetchError } = await adminClient
    .from("battles")
    .select("id, host_id, guest_id, status")
    .eq("join_code", normalizedCode)
    .single();

  if (fetchError || !battle) {
    return { error: "No room found with that code." };
  }
  if (battle.host_id === currentUser.id) {
    return { error: "You can't join your own room." };
  }
  if (battle.status !== "WAITING" || battle.guest_id) {
    return { error: "That room is no longer available." };
  }

  const cards = await getBattleReadyCards();
  const battleCards = cards.map(toBattleCard);
  const initialState = createInitialState(battleCards);

  const { data: updated, error: updateError } = await adminClient
    .from("battles")
    .update({
      guest_id: currentUser.id,
      status: "ACTIVE",
      state: initialState,
      updated_at: new Date().toISOString(),
    })
    .eq("id", battle.id)
    .eq("status", "WAITING")
    .select("id");

  if (updateError || !updated || updated.length === 0) {
    return { error: "That room is no longer available." };
  }

  return { error: null, battleId: battle.id };
}

type OnlineBattleAction = Exclude<BattleAction, { type: "RESET" }>;

export async function submitBattleMove(
  battleId: string,
  action: OnlineBattleAction,
  expectedVersion: number
): Promise<
  | { error: string; conflict?: boolean }
  | { error: null; view: RedactedBattleState; version: number }
> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "You must be signed in." };

  const adminClient = createAdminClient();
  const { data: battle, error: fetchError } = await adminClient
    .from("battles")
    .select("host_id, guest_id, status, state, version")
    .eq("id", battleId)
    .single();

  if (fetchError || !battle) {
    return { error: "This match no longer exists." };
  }
  if (battle.status !== "ACTIVE") {
    return { error: "This match isn't active." };
  }

  const viewerId: PlayerId | null =
    battle.host_id === currentUser.id
      ? "P1"
      : battle.guest_id === currentUser.id
        ? "P2"
        : null;

  if (!viewerId) {
    return { error: "You're not a participant in this match." };
  }
  if (action.player !== viewerId) {
    return { error: "You can't act for your opponent." };
  }

  const nextState = battleReducer(battle.state as BattleState, action);
  const nextStatus: BattleStatus =
    nextState.phase === "GAME_OVER" ? "FINISHED" : "ACTIVE";

  const { data: updated, error: updateError } = await adminClient
    .from("battles")
    .update({
      state: nextState,
      version: battle.version + 1,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", battleId)
    .eq("version", expectedVersion)
    .select("id");

  if (updateError) {
    return { error: "Failed to submit move. Try again." };
  }
  if (!updated || updated.length === 0) {
    return { error: "The match changed. Refreshing.", conflict: true };
  }

  return {
    error: null,
    view: redactStateFor(nextState, viewerId),
    version: battle.version + 1,
  };
}

export async function getBattleView(battleId: string): Promise<
  | { error: string }
  | {
      error: null;
      view: RedactedBattleState | null;
      version: number;
      status: BattleStatus;
      hostUsername: string;
      guestUsername: string | null;
      joinCode: string | null;
    }
> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "You must be signed in." };

  const adminClient = createAdminClient();
  const { data: battle, error: fetchError } = await adminClient
    .from("battles")
    .select("host_id, guest_id, status, state, version, join_code")
    .eq("id", battleId)
    .single();

  if (fetchError || !battle) {
    return { error: "This match no longer exists." };
  }

  const viewerId: PlayerId | null =
    battle.host_id === currentUser.id
      ? "P1"
      : battle.guest_id === currentUser.id
        ? "P2"
        : null;

  if (!viewerId) {
    return { error: "You're not a participant in this match." };
  }

  const hostUsername = await resolveUsername(adminClient, battle.host_id);
  const guestUsername = battle.guest_id
    ? await resolveUsername(adminClient, battle.guest_id)
    : null;

  return {
    error: null,
    view:
      battle.status === "WAITING"
        ? null
        : redactStateFor(battle.state as BattleState, viewerId),
    version: battle.version,
    status: battle.status,
    hostUsername,
    guestUsername,
    joinCode: battle.host_id === currentUser.id ? battle.join_code : null,
  };
}
