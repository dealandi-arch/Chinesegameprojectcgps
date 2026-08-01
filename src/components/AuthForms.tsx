"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = null;

export function AuthForms() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8">
      <div className="mb-6 flex rounded-full bg-black/30 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setTab("signin")}
          className={`flex-1 rounded-full py-2 transition-colors ${
            tab === "signin" ? "bg-red-600 text-white" : "text-stone-400"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setTab("signup")}
          className={`flex-1 rounded-full py-2 transition-colors ${
            tab === "signup" ? "bg-red-600 text-white" : "text-stone-400"
          }`}
        >
          Create Profile
        </button>
      </div>

      {tab === "signin" ? <SignInForm /> : <SignUpForm />}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-left">
      <span className="mb-1 block text-xs font-medium text-stone-400">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
      />
    </label>
  );
}

function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Username" name="username" autoComplete="username" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
      />
      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Username" name="username" autoComplete="username" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
      />
      <Field
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
      />
      <Field
        label="Enter your admin code (optional)"
        name="adminCode"
        type="text"
        placeholder="Leave blank unless you have one"
        required={false}
      />
      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
      >
        {pending ? "Creating profile…" : "Create Profile"}
      </button>
    </form>
  );
}
