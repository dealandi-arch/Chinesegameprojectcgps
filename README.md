# Wok Quest

A Chinese cooking game project, built with [Next.js](https://nextjs.org).

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in the real values:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — can be left as-is (local SQLite file).
   - `SESSION_SECRET` — a random 32+ character string. Generate one with:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `ADMIN_CODE` — the secret code that grants admin status when entered on
     the "Create Profile" form. Ask the project owner for the real value;
     never commit it.

3. Create the local database:

   ```bash
   npm run db:migrate
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

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

## Stack

- Next.js App Router + Tailwind CSS
- Prisma + SQLite for the user database
- `iron-session` for cookie-based sessions, `bcryptjs` for password hashing
- Server Actions for sign up / sign in / sign out / role management (no API
  routes needed)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js. Remember to set `DATABASE_URL`, `SESSION_SECRET`, and `ADMIN_CODE` as environment variables in the Vercel dashboard — SQLite's local file won't persist on serverless deploys, so a hosted database (e.g. Postgres) will be needed before deploying for real.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
