"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

export type AdminActionResult = { error: string } | { error: null };

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
