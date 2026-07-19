import { NextResponse } from "next/server";

import {
  loadOperatorAuthConfig,
  verifyOperatorCredentials,
} from "@/lib/auth/credentials.server";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth/operator-session.server";
import {
  authErrorSchema,
  loginInputSchema,
  loginSuccessSchema,
} from "@/lib/auth/schemas";
import { createSessionToken } from "@/lib/auth/session.server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid login request.", 400);
  }

  const input = loginInputSchema.safeParse(body);
  if (!input.success) {
    return errorResponse("Invalid login request.", 400);
  }

  const config = loadOperatorAuthConfig();
  if (!config) {
    return errorResponse("Operator login is not configured.", 503);
  }

  if (!(await verifyOperatorCredentials(input.data, config))) {
    return errorResponse("Invalid credentials.", 401);
  }

  const token = createSessionToken(
    { subject: "operator-demo", role: "operator" },
    config.sessionSecret,
  );
  const response = NextResponse.json(
    loginSuccessSchema.parse({ ok: true, redirectTo: "/workspace" }),
    { headers: { "cache-control": "no-store" } },
  );
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return response;
}

function errorResponse(error: string, status: number) {
  return NextResponse.json(authErrorSchema.parse({ error }), {
    status,
    headers: { "cache-control": "no-store" },
  });
}
