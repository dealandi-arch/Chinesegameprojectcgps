"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, resolveSuperAdminCode } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

export type AdminActionResult = { error: string } | { error: null };

// Lets an admin who already holds the super admin code claim the flag
// from the panel, instead of the code only working at signup. Restricted
// to ADMIN: a co-admin can't use this to skip the promotion vote, they
// still have to be voted up to admin first.
export async function claimSuperAdmin(
  code: string
): Promise<AdminActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can claim super admin." };
  }
  if (currentUser.isSuperAdmin) {
    return { error: "You are already a super admin." };
  }
  if (code.trim() !== resolveSuperAdminCode()) {
    return { error: "Incorrect code." };
  }

  const adminClient = createAdminClient();
  const { data, error: fetchError } = await adminClient.auth.admin.getUserById(
    currentUser.id
  );
  if (fetchError || !data.user) {
    return { error: "Could not load your account. Try again." };
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    currentUser.id,
    {
      app_metadata: {
        // Spread so username/role survive -- only the flag is added.
        ...data.user.app_metadata,
        super_admin: true,
      },
    }
  );

  if (updateError) {
    return { error: "Failed to grant super admin. Try again." };
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function demoteCoAdminToUser(
  userId: string
): Promise<AdminActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Only admins can manage co-admin status." };
  }

  const adminClient = createAdminClient();
  const { data, error: fetchError } =
    await adminClient.auth.admin.getUserById(userId);

  if (fetchError || !data.user) {
    return { error: "That user no longer exists." };
  }

  const meta = data.user.app_metadata as { username?: string; role?: string };
  if (meta.role !== "CO_ADMIN") {
    return { error: "Only co-admins can be demoted here." };
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      app_metadata: {
        ...data.user.app_metadata,
        role: "USER",
      },
    }
  );

  if (updateError) {
    return { error: "Failed to update role. Try again." };
  }

  revalidatePath("/admin");
  return { error: null };
}
