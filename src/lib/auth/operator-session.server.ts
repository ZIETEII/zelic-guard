import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { loadOperatorAuthConfig } from "./credentials.server";
import {
  SESSION_MAX_AGE_SECONDS,
  type OperatorSession,
  verifySessionToken,
} from "./session.server";

export const SESSION_COOKIE_NAME = "zelic_session";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    priority: "high" as const,
  };
}

export async function getCurrentOperatorSession(): Promise<OperatorSession | null> {
  const config = loadOperatorAuthConfig();
  if (!config) return null;

  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token, config.sessionSecret);
}

export async function requireOperatorSession(): Promise<OperatorSession> {
  const session = await getCurrentOperatorSession();
  if (!session) redirect("/login");
  return session;
}
