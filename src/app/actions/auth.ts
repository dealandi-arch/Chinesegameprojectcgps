"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { usernameToEmail } from "@/lib/username";

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

  const isAdmin = adminCode.length > 0 && adminCode === process.env.ADMIN_CODE;
  const email = usernameToEmail(username);

  const adminClient = createAdminClient();
  const { error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      username,
      role: isAdmin ? "ADMIN" : "USER",
    },
  });

  if (createError) {
    if (
      createError.status === 422 ||
      createError.message.toLowerCase().includes("already")
    ) {
      return { error: "That username is already taken." };
    }
    return { error: "Something went wrong creating your profile. Try again." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      error: "Profile created, but sign-in failed. Try signing in manually.",
    };
  }

  redirect("/");
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) {
    return { error: "Incorrect username or password." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
