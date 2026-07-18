// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { INVOICE_INTENT } from "@/lib/guard/fixtures";
import { fingerprintContract } from "@/lib/guard/fingerprint";
import {
  compileIntentWithProviders,
  createOpenAIIntentCompiler,
  OpenAICompilerError,
  type OpenAIResponsesClient,
} from "@/lib/guard/openai-compiler.server";

const modelOutput = {
  schemaVersion: "1.0" as const,
  id: "contract:invoice:INV-2048",
  action: "send_invoice",
  channel: "email",
  target: "invoice-delivery",
  constraints: {
    allowedRecipients: ["finance@northstar.test"],
    resourceFingerprint: `sha256:${"a".repeat(64)}`,
    maxCost: 0.25,
    maxRuns: 1,
    expiresAt: "2026-07-18T23:00:00.000Z",
  },
};

function fakeClient(output: unknown): OpenAIResponsesClient {
  return {
    responses: {
      parse: vi.fn().mockResolvedValue({ output_parsed: output }),
    },
  };
}

describe("OpenAI intent compiler", () => {
  it("uses the verified Responses parse shape and validates output", async () => {
    const client = fakeClient(modelOutput);
    const compiler = createOpenAIIntentCompiler({ client, model: "gpt-5.6" });
    const result = await compiler.compile({ intent: INVOICE_INTENT, mode: "openai" });

    expect(client.responses.parse).toHaveBeenCalledOnce();
    expect(client.responses.parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.6",
        input: expect.any(Array),
        text: { format: expect.any(Object) },
      }),
    );
    expect(result.compiler).toEqual({
      mode: "openai",
      provider: "openai",
      model: "gpt-5.6",
      fallbackReason: null,
    });
    expect(result.contract.status).toBe("proposed");
    expect(result.contract.fingerprint).toBe(fingerprintContract(result.contract));
  });

  it.each([null, { ...modelOutput, action: "INVALID ACTION" }])(
    "fails closed for invalid parsed model output %#",
    async (output) => {
      const compiler = createOpenAIIntentCompiler({
        client: fakeClient(output),
        model: "gpt-5.6",
      });

      await expect(
        compiler.compile({ intent: INVOICE_INTENT, mode: "openai" }),
      ).rejects.toBeInstanceOf(OpenAICompilerError);
    },
  );

  it("labels deterministic fallback for absent credentials in auto mode", async () => {
    const result = await compileIntentWithProviders(
      { intent: INVOICE_INTENT, mode: "auto" },
      { apiKey: undefined, model: "gpt-5.6" },
    );

    expect(result.compiler).toEqual({
      mode: "deterministic",
      provider: "seeded",
      model: null,
      fallbackReason: "missing_api_key",
    });
  });

  it("falls back only in auto mode when the provider fails", async () => {
    const failingClient: OpenAIResponsesClient = {
      responses: { parse: vi.fn().mockRejectedValue(new Error("provider failed")) },
    };
    const auto = await compileIntentWithProviders(
      { intent: INVOICE_INTENT, mode: "auto" },
      { apiKey: "test-key", model: "gpt-5.6", client: failingClient },
    );

    expect(auto.compiler.fallbackReason).toBe("provider_error");
    await expect(
      compileIntentWithProviders(
        { intent: INVOICE_INTENT, mode: "openai" },
        { apiKey: "test-key", model: "gpt-5.6", client: failingClient },
      ),
    ).rejects.toBeInstanceOf(OpenAICompilerError);
  });

  it("rejects explicit OpenAI mode when credentials are absent", async () => {
    await expect(
      compileIntentWithProviders(
        { intent: INVOICE_INTENT, mode: "openai" },
        { apiKey: undefined, model: "gpt-5.6" },
      ),
    ).rejects.toBeInstanceOf(OpenAICompilerError);
  });
});
