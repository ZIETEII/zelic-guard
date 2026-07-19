// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "@/lib/auth/session.server";

const SECRET = "zelic-session-secret-that-is-longer-than-thirty-two-bytes";
const NOW = Date.UTC(2026, 6, 19, 5, 0, 0);

describe("operator session tokens", () => {
  it("round-trips the minimum operator identity with a bounded expiry", () => {
    const token = createSessionToken(
      { subject: "operator-demo", role: "operator" },
      SECRET,
      NOW,
    );

    expect(verifySessionToken(token, SECRET, NOW + 1_000)).toEqual({
      version: 1,
      subject: "operator-demo",
      role: "operator",
      issuedAt: Math.floor(NOW / 1_000),
      expiresAt: Math.floor(NOW / 1_000) + SESSION_MAX_AGE_SECONDS,
    });
  });

  it("rejects tampering, expiry, malformed values, and weak secrets", () => {
    const token = createSessionToken(
      { subject: "operator-demo", role: "operator" },
      SECRET,
      NOW,
    );
    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

    expect(verifySessionToken(tampered, SECRET, NOW)).toBeNull();
    expect(
      verifySessionToken(
        token,
        SECRET,
        NOW + (SESSION_MAX_AGE_SECONDS + 1) * 1_000,
      ),
    ).toBeNull();
    expect(verifySessionToken("not-a-session", SECRET, NOW)).toBeNull();
    expect(() =>
      createSessionToken(
        { subject: "operator-demo", role: "operator" },
        "too-short",
        NOW,
      ),
    ).toThrow(/32 bytes/i);
  });
});
