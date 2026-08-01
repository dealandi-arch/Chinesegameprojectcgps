import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
}

const password = process.env.SESSION_SECRET;

if (!password || password.length < 32) {
  throw new Error(
    "SESSION_SECRET is missing or too short. Set it in .env.local to a random string of at least 32 characters."
  );
}

export const sessionOptions: SessionOptions = {
  cookieName: "wok_quest_session",
  password,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
