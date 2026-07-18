// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/compile/route";
import { compileIntentResponseSchema } from "@/lib/guard/compiler";
import { INVOICE_INTENT } from "@/lib/guard/fixtures";

function request(body: unknown): Request {
  return new Request("http://localhost/api/compile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/compile", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns a strict deterministic compilation without CORS opt-in", async () => {
    const response = await POST(
      request({ intent: INVOICE_INTENT, mode: "deterministic" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(compileIntentResponseSchema.parse(body)).toEqual(body);
    expect(body.compiler.provider).toBe("seeded");
  });

  it("labels absent-key fallback in auto mode and rejects explicit OpenAI mode", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const automatic = await POST(request({ intent: INVOICE_INTENT, mode: "auto" }));
    const automaticBody = await automatic.json();
    const explicit = await POST(
      request({ intent: INVOICE_INTENT, mode: "openai" }),
    );

    expect(automatic.status).toBe(200);
    expect(automaticBody.compiler.fallbackReason).toBe("missing_api_key");
    expect(explicit.status).toBe(503);
  });

  it("rejects unknown request fields and unsupported seeded intents", async () => {
    const malformed = await POST(
      request({ intent: INVOICE_INTENT, mode: "deterministic", verdict: "ALLOW" }),
    );
    const unsupported = await POST(
      request({ intent: "Do something else", mode: "deterministic" }),
    );

    expect(malformed.status).toBe(400);
    expect(unsupported.status).toBe(422);
  });
});
