// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { createPasswordVerifier } from "@/lib/auth/credentials.server";

const EMAIL = "judge@zelic.guard";
const PASSWORD = "BuildWeek!2026";
const SESSION_SECRET = "zelic-session-secret-that-is-longer-than-thirty-two-bytes";

describe("operator auth routes", () => {
  beforeEach(async () => {
    vi.stubEnv("ZELIC_AUTH_EMAIL", EMAIL);
    vi.stubEnv(
      "ZELIC_AUTH_PASSWORD_SCRYPT",
      await createPasswordVerifier(PASSWORD, Buffer.alloc(16, 11)),
    );
    vi.stubEnv("ZELIC_SESSION_SECRET", SESSION_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates a bounded HttpOnly session for valid credentials", async () => {
    const response = await login(loginRequest({ email: EMAIL, password: PASSWORD }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      redirectTo: "/workspace",
    });
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain("zelic_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=strict");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=14400");
  });

  it("fails closed for bad credentials, unknown fields, and missing config", async () => {
    const badCredentials = await login(
      loginRequest({ email: EMAIL, password: "Incorrect!2026" }),
    );
    expect(badCredentials.status).toBe(401);
    await expect(badCredentials.json()).resolves.toEqual({
      error: "Invalid credentials.",
    });
    expect(badCredentials.headers.get("set-cookie")).toBeNull();

    const unknownField = await login(
      loginRequest({ email: EMAIL, password: PASSWORD, role: "admin" }),
    );
    expect(unknownField.status).toBe(400);
    await expect(unknownField.json()).resolves.toEqual({
      error: "Invalid login request.",
    });

    vi.stubEnv("ZELIC_SESSION_SECRET", "");
    const missingConfig = await login(
      loginRequest({ email: EMAIL, password: PASSWORD }),
    );
    expect(missingConfig.status).toBe(503);
    await expect(missingConfig.json()).resolves.toEqual({
      error: "Operator login is not configured.",
    });
  });

  it("clears the session only through the logout mutation route", async () => {
    const response = await logout();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain("zelic_session=");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
  });
});

function loginRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
