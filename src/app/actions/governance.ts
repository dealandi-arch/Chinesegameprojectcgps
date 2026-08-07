"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, type Role } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

export type GovernanceActionResult = { error: string } | { error: null };

type RoleVoteDirection = "PROMOTE" | "DEMOTE";

export async function startRoleVote(
  targetUserId: string,
  direction: RoleVoteDirection
): Promise<GovernanceActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can start a role vote." };
  }

  const adminClient = createAdminClient();
  const { data, error: fetchError } =
    await adminClient.auth.admin.getUserById(targetUserId);
  if (fetchError || !data.user) {
    return { error: "That user no longer exists." };
  }

  const meta = data.user.app_metadata as { role?: Role };
  const requiredRole = direction === "PROMOTE" ? "CO_ADMIN" : "ADMIN";
  if (meta.role !== requiredRole) {
    return {
      error:
        direction === "PROMOTE"
          ? "Only co-admins can be nominated for promotion."
          : "Only admins can be targeted for demotion.",
    };
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
      required_count: direction === "PROMOTE" ? 3 : 2,
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

export async function agreeToRoleVote(
  voteId: string
): Promise<GovernanceActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can agree to a role vote." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("cast_role_vote_ballot", {
    p_vote_id: voteId,
    p_admin_id: currentUser.id,
  });

  if (error) {
    if (error.message.includes("already_voted")) {
      return { error: "You already agreed to this vote." };
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
      await adminClient.auth.admin.updateUserById(outcome.target_user_id, {
        app_metadata: {
          ...targetData.user.app_metadata,
          role: outcome.direction === "PROMOTE" ? "ADMIN" : "CO_ADMIN",
        },
      });
    }
  }

  revalidatePath("/admin");
  return { error: null };
}
