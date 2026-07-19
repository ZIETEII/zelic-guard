import { NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth/operator-session.server";
import { logoutSuccessSchema } from "@/lib/auth/schemas";

export async function POST() {
  const response = NextResponse.json(
    logoutSuccessSchema.parse({ ok: true }),
    { headers: { "cache-control": "no-store" } },
  );
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
