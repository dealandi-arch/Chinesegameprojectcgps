"use server";

import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";

export type AuthFormState = { error: string } | null;

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const adminCode = String(formData.get("adminCode") ?? "").trim();

  if (!USERNAME_PATTERN.test(username)) {
    return {
      error:
        "Username must be 3-20 characters and can only contain letters, numbers, and underscores.",
    };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { error: "That username is already taken." };
  }

  const isAdmin = adminCode.length > 0 && adminCode === process.env.ADMIN_CODE;

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
      role: isAdmin ? Role.ADMIN : Role.USER,
    },
  });

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  redirect("/");
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { username } });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    return { error: "Incorrect username or password." };
  }

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  redirect("/");
}

export async function signOut() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
