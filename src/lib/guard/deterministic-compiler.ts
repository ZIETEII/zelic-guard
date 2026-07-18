import {
  compileIntentRequestSchema,
  compileIntentResponseSchema,
  UnsupportedIntentError,
  type CompileIntentRequest,
  type CompileIntentResponse,
} from "./compiler";
import { fingerprintContract } from "./fingerprint";
import { INVOICE_INTENT } from "./fixtures";
import type { IntentContract } from "./types";

const PLACEHOLDER_FINGERPRINT = `sha256:${"0".repeat(64)}`;
const RESOURCE_FINGERPRINT = `sha256:${"a".repeat(64)}`;

export async function compileDeterministicIntent(
  input: CompileIntentRequest,
  fallbackReason: "missing_api_key" | "provider_error" | null = null,
): Promise<CompileIntentResponse> {
  const request = compileIntentRequestSchema.parse(input);

  if (request.mode === "openai" || request.intent !== INVOICE_INTENT) {
    throw new UnsupportedIntentError();
  }

  const unsigned: IntentContract = {
    schemaVersion: "1.0",
    id: "contract:invoice:INV-2048",
    action: "send_invoice",
    channel: "email",
    target: "invoice-delivery",
    constraints: {
      allowedRecipients: ["finance@northstar.test"],
      resourceFingerprint: RESOURCE_FINGERPRINT,
      maxCost: 0.25,
      maxRuns: 1,
      expiresAt: "2026-07-18T23:00:00.000Z",
    },
    status: "proposed",
    fingerprint: PLACEHOLDER_FINGERPRINT,
  };

  return compileIntentResponseSchema.parse({
    contract: {
      ...unsigned,
      fingerprint: fingerprintContract(unsigned),
    },
    compiler: {
      mode: "deterministic",
      provider: "seeded",
      model: null,
      fallbackReason,
    },
  });
}
