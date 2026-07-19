// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  createPasswordVerifier,
  loadOperatorAuthConfig,
  loginInputSchema,
  verifyOperatorCredentials,
} from "@/lib/auth/credentials.server";

const EMAIL = "judge@zelic.guard";
const PASSWORD = "BuildWeek!2026";
const SESSION_SECRET = "zelic-session-secret-that-is-longer-than-thirty-two-bytes";

describe("operator credentials", () => {
  it("validates a strict login body and verifies a scrypt password", async () => {
    const passwordVerifier = await createPasswordVerifier(
      PASSWORD,
      Buffer.alloc(16, 7),
    );
    const config = {
      email: EMAIL,
      passwordVerifier,
      sessionSecret: SESSION_SECRET,
    };

    expect(
      await verifyOperatorCredentials({ email: EMAIL, password: PASSWORD }, config),
    ).toBe(true);
    expect(
      await verifyOperatorCredentials(
        { email: EMAIL, password: "Incorrect!2026" },
        config,
      ),
    ).toBe(false);
    expect(
      await verifyOperatorCredentials(
        { email: "other@zelic.guard", password: PASSWORD },
        config,
      ),
    ).toBe(false);
    expect(
      loginInputSchema.safeParse({
        email: EMAIL,
        password: PASSWORD,
        role: "admin",
      }).success,
    ).toBe(false);
  });

  it("loads only complete, strong server configuration", async () => {
    const passwordVerifier = await createPasswordVerifier(
      PASSWORD,
      Buffer.alloc(16, 9),
    );

    expect(
      loadOperatorAuthConfig({
        ZELIC_AUTH_EMAIL: EMAIL,
        ZELIC_AUTH_PASSWORD_SCRYPT: passwordVerifier,
        ZELIC_SESSION_SECRET: SESSION_SECRET,
      }),
    ).toEqual({
      email: EMAIL,
      passwordVerifier,
      sessionSecret: SESSION_SECRET,
    });
    expect(loadOperatorAuthConfig({})).toBeNull();
    expect(
      loadOperatorAuthConfig({
        ZELIC_AUTH_EMAIL: EMAIL,
        ZELIC_AUTH_PASSWORD_SCRYPT: passwordVerifier,
        ZELIC_SESSION_SECRET: "weak",
      }),
    ).toBeNull();
  });
});
