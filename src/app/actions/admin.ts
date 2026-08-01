"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type AdminActionResult = { error: string } | { error: null };

export async function setCoAdminStatus(
  userId: string,
  makeCoAdmin: boolean
): Promise<AdminActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.ADMIN) {
    return { error: "Only admins can manage co-admin status." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { error: "That user no longer exists." };
  }
  if (target.role === Role.ADMIN) {
    return { error: "Admins cannot be changed here." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: makeCoAdmin ? Role.CO_ADMIN : Role.USER },
  });

  revalidatePath("/admin");
  return { error: null };
}
