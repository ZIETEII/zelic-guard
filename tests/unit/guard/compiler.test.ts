import { describe, expect, it } from "vitest";

import {
  compileIntentRequestSchema,
  compileIntentResponseSchema,
} from "@/lib/guard/compiler";
import { compileDeterministicIntent } from "@/lib/guard/deterministic-compiler";
import { fingerprintContract } from "@/lib/guard/fingerprint";
import { INVOICE_INTENT } from "@/lib/guard/fixtures";

describe("deterministic intent compiler", () => {
  it("compiles the seeded invoice intent into a valid proposed contract", async () => {
    const result = await compileDeterministicIntent({
      intent: INVOICE_INTENT,
      mode: "deterministic",
    });

    expect(compileIntentResponseSchema.parse(result)).toEqual(result);
    expect(result.compiler).toEqual({
      mode: "deterministic",
      provider: "seeded",
      model: null,
      fallbackReason: null,
    });
    expect(result.contract.status).toBe("proposed");
    expect(result.contract.constraints.allowedRecipients).toEqual([
      "finance@northstar.test",
    ]);
    expect(result.contract.fingerprint).toBe(
      fingerprintContract(result.contract),
    );
  });

  it("rejects malformed requests and unsupported deterministic intents", async () => {
    expect(() =>
      compileIntentRequestSchema.parse({
        intent: INVOICE_INTENT,
        mode: "deterministic",
        verdict: "ALLOW",
      }),
    ).toThrow();

    await expect(
      compileDeterministicIntent({
        intent: "Send something elsewhere",
        mode: "deterministic",
      }),
    ).rejects.toThrow("Unsupported deterministic intent");
  });

  it("returns a fresh contract for every compilation", async () => {
    const first = await compileDeterministicIntent({
      intent: INVOICE_INTENT,
      mode: "deterministic",
    });
    const second = await compileDeterministicIntent({
      intent: INVOICE_INTENT,
      mode: "deterministic",
    });

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.contract).not.toBe(first.contract);
  });
});
