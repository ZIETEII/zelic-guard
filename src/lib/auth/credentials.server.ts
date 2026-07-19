import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { loginInputSchema } from "./schemas";

export { loginInputSchema } from "./schemas";

const passwordSchema = loginInputSchema.shape.password;

const passwordVerifierSchema = z
  .string()
  .regex(/^scrypt\$[A-Za-z0-9_-]{22,}\$[A-Za-z0-9_-]{86}$/);

const operatorAuthConfigSchema = z.strictObject({
  email: z.email().trim().toLowerCase(),
  passwordVerifier: passwordVerifierSchema,
  sessionSecret: z.string().refine(
    (value) => Buffer.byteLength(value, "utf8") >= 32,
    "Session secret must contain at least 32 bytes.",
  ),
});

export type OperatorAuthConfig = z.infer<typeof operatorAuthConfigSchema>;

export async function createPasswordVerifier(
  password: string,
  salt = randomBytes(16),
): Promise<string> {
  const validPassword = passwordSchema.parse(password);
  if (salt.byteLength < 16) {
    throw new Error("Password salt must contain at least 16 bytes.");
  }

  const hash = await derivePassword(validPassword, salt);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyOperatorCredentials(
  input: unknown,
  config: OperatorAuthConfig,
): Promise<boolean> {
  const parsedInput = loginInputSchema.safeParse(input);
  const parsedConfig = operatorAuthConfigSchema.safeParse(config);
  if (!parsedInput.success || !parsedConfig.success) return false;

  const [, encodedSalt, encodedHash] =
    parsedConfig.data.passwordVerifier.split("$");
  const expectedHash = Buffer.from(encodedHash, "base64url");
  const suppliedHash = await derivePassword(
    parsedInput.data.password,
    Buffer.from(encodedSalt, "base64url"),
  );
  const passwordMatches =
    suppliedHash.length === expectedHash.length &&
    timingSafeEqual(suppliedHash, expectedHash);

  return (
    parsedInput.data.email === parsedConfig.data.email && passwordMatches
  );
}

export function loadOperatorAuthConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): OperatorAuthConfig | null {
  const result = operatorAuthConfigSchema.safeParse({
    email: env.ZELIC_AUTH_EMAIL,
    passwordVerifier: env.ZELIC_AUTH_PASSWORD_SCRYPT,
    sessionSecret: env.ZELIC_SESSION_SECRET,
  });

  return result.success ? result.data : null;
}

function derivePassword(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}
