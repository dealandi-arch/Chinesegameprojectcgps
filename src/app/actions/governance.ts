"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, type Role } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";
import type { RoleVoteDirection } from "@/lib/governance";

export type GovernanceActionResult = { error: string } | { error: null };

const REQUIRED_ROLE: Record<RoleVoteDirection, Role> = {
  PROMOTE: "CO_ADMIN",
  DEMOTE: "ADMIN",
  PROMOTE_MEMBER: "USER",
};

const REQUIRED_COUNT: Record<RoleVoteDirection, number> = {
  PROMOTE: 3,
  DEMOTE: 2,
  PROMOTE_MEMBER: 2,
};

const TARGET_ERROR: Record<RoleVoteDirection, string> = {
  PROMOTE: "Only co-admins can be nominated for promotion.",
  DEMOTE: "Only admins can be targeted for demotion.",
  PROMOTE_MEMBER: "Only members can be nominated for co-admin promotion.",
};

export async function startRoleVote(
  targetUserId: string,
  direction: RoleVoteDirection
): Promise<GovernanceActionResult> {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "CO_ADMIN")
  ) {
    return { error: "Only admins and co-admins can start a role vote." };
  }

  const adminClient = createAdminClient();
  const { data, error: fetchError } =
    await adminClient.auth.admin.getUserById(targetUserId);
  if (fetchError || !data.user) {
    return { error: "That user no longer exists." };
  }

  const meta = data.user.app_metadata as { role?: Role };
  if (meta.role !== REQUIRED_ROLE[direction]) {
    return { error: TARGET_ERROR[direction] };
  }

  if (direction === "DEMOTE") {
    const { data: usersData, error: listError } =
      await adminClient.auth.admin.listUsers({ perPage: 200 });
    const adminCount = listError
      ? 0
      : usersData.users.filter(
          (u) => (u.app_metadata as { role?: Role }).role === "ADMIN"
        ).length;
    if (adminCount <= 1) {
      return { error: "Cannot demote the only remaining admin." };
    }
  }

  const { data: vote, error: insertError } = await adminClient
    .from("role_votes")
    .insert({
      target_user_id: targetUserId,
      direction,
      required_count: REQUIRED_COUNT[direction],
      initiated_by: currentUser.id,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "There is already an open vote for this user." };
    }
    return { error: "Failed to start vote. Try again." };
  }

  const { error: ballotError } = await adminClient
    .from("role_vote_ballots")
    .insert({ vote_id: vote.id, admin_id: currentUser.id });

  if (ballotError) {
    await adminClient.from("role_votes").delete().eq("id", vote.id);
    return { error: "Failed to start vote. Try again." };
  }

  revalidatePath("/admin");
  return { error: null };
}

async function castBallot(
  voteId: string,
  value: 1 | -1
): Promise<GovernanceActionResult> {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "CO_ADMIN")
  ) {
    return { error: "Only admins and co-admins can vote on a role vote." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("cast_role_vote_ballot", {
    p_vote_id: voteId,
    p_admin_id: currentUser.id,
    p_value: value,
  });

  if (error) {
    if (error.message.includes("already_voted")) {
      return { error: "You already voted on this." };
    }
    if (error.message.includes("last_admin")) {
      return {
        error: "This vote was cancelled: it would leave zero admins.",
      };
    }
    if (error.message.includes("vote_not_found")) {
      return { error: "This vote no longer exists." };
    }
    return { error: "Failed to cast your vote. Try again." };
  }

  const outcome = data?.[0];
  if (outcome?.result === "PASSED") {
    const { data: targetData, error: targetError } =
      await adminClient.auth.admin.getUserById(outcome.target_user_id);
    if (!targetError && targetData.user) {
      const newRole: Role =
        outcome.direction === "PROMOTE" ? "ADMIN" : "CO_ADMIN";
      await adminClient.auth.admin.updateUserById(outcome.target_user_id, {
        app_metadata: {
          ...targetData.user.app_metadata,
          role: newRole,
        },
      });
    }
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function agreeToRoleVote(
  voteId: string
): Promise<GovernanceActionResult> {
  return castBallot(voteId, 1);
}

export async function disagreeWithRoleVote(
  voteId: string
): Promise<GovernanceActionResult> {
  return castBallot(voteId, -1);
}
