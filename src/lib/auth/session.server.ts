import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

export const SESSION_MAX_AGE_SECONDS = 4 * 60 * 60;

const sessionIdentitySchema = z.strictObject({
  subject: z.string().min(1).max(64),
  role: z.literal("operator"),
});

const sessionPayloadSchema = sessionIdentitySchema.extend({
  version: z.literal(1),
  issuedAt: z.number().int().nonnegative(),
  expiresAt: z.number().int().positive(),
}).refine(({ issuedAt, expiresAt }) => expiresAt > issuedAt);

type SessionIdentity = z.infer<typeof sessionIdentitySchema>;
export type OperatorSession = z.infer<typeof sessionPayloadSchema>;

export function createSessionToken(
  identity: SessionIdentity,
  secret: string,
  nowMs = Date.now(),
): string {
  assertStrongSecret(secret);
  const issuedAt = Math.floor(nowMs / 1_000);
  const payload = sessionPayloadSchema.parse({
    ...identity,
    version: 1,
    issuedAt,
    expiresAt: issuedAt + SESSION_MAX_AGE_SECONDS,
  });
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifySessionToken(
  token: string | null | undefined,
  secret: string,
  nowMs = Date.now(),
): OperatorSession | null {
  if (!token || !hasStrongSecret(secret)) return null;

  const segments = token.split(".");
  if (segments.length !== 2) return null;
  const [encodedPayload, suppliedSignature] = segments;
  const expectedSignature = sign(encodedPayload, secret);
  const suppliedBytes = Buffer.from(suppliedSignature, "base64url");
  const expectedBytes = Buffer.from(expectedSignature, "base64url");

  if (
    suppliedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(suppliedBytes, expectedBytes)
  ) {
    return null;
  }

  try {
    const rawPayload: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
    const result = sessionPayloadSchema.safeParse(rawPayload);
    if (!result.success) return null;

    const nowSeconds = Math.floor(nowMs / 1_000);
    if (result.data.expiresAt <= nowSeconds) return null;
    if (result.data.issuedAt > nowSeconds + 60) return null;
    if (
      result.data.expiresAt - result.data.issuedAt >
      SESSION_MAX_AGE_SECONDS
    ) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function assertStrongSecret(secret: string): void {
  if (!hasStrongSecret(secret)) {
    throw new Error("Session secret must contain at least 32 bytes.");
  }
}

function hasStrongSecret(secret: string): boolean {
  return Buffer.byteLength(secret, "utf8") >= 32;
}
