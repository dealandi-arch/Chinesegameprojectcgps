# Wok Quest

A Chinese cooking game project, built with [Next.js](https://nextjs.org) and [Supabase](https://supabase.com).

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in the real values:

   ```bash
   cp .env.example .env
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your
     Supabase project's **Settings -> API** page. Safe to expose publicly.
   - `SUPABASE_SERVICE_ROLE_KEY` — from the same page. This one bypasses all
     security rules — keep it server-only, never commit it.
   - `ADMIN_CODE` — the secret code that grants admin status when entered on
     the "Create Profile" form. Ask the project owner for the real value;
     never commit it.

3. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

No local database setup step is needed — user accounts live in Supabase Auth
on your Supabase project.

## Accounts & roles

- **Player** — default role for anyone who creates a profile.
- **Co-Admin** — can be granted or removed by an Admin from the Admin Panel
  (`/admin`). Intended for future content-editing permissions.
- **Admin** — granted automatically at signup if the correct `ADMIN_CODE` is
  entered in the "Enter your admin code" field on the Create Profile form.
  Leaving it blank or entering it incorrectly just creates a normal Player
  account (no error is shown, per design).

Admins manage co-admins from `/admin`, which is only reachable by signed-in
admins.

Login is username/password, not email — under the hood each username maps to
a placeholder address (`username@users.wokquest.local`) that Supabase Auth
never actually emails. Players never see or need a real email address.

## Stack

- Next.js App Router + Tailwind CSS
- Supabase Auth for accounts, sessions, and password hashing
- Role (`USER` / `CO_ADMIN` / `ADMIN`) stored in each user's Supabase
  `app_metadata`, settable only via the service-role Admin API (never
  editable by the user themselves)
- Server Actions for sign up / sign in / sign out / role management (no API
  routes needed)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_CODE` as environment variables in the Vercel dashboard.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
