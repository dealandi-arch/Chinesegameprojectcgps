import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Role } from "@/generated/prisma/client";

const SALT_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export type CurrentUser = {
  id: string;
  username: string;
  role: Role;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, role: true },
  });

  return user ?? null;
}
