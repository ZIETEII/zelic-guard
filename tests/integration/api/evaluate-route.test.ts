// @vitest-environment node

import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/evaluate/route";
import { createInvoiceScenarioFixtures } from "@/lib/guard/fixtures";
import { evaluateExecutionResponseSchema } from "@/lib/guard/route-schemas";

function request(body: unknown): Request {
  return new Request("http://localhost/api/evaluate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/evaluate", () => {
  it("computes ALLOW server-side and returns history only after that ALLOW", async () => {
    const scenario = createInvoiceScenarioFixtures().scenarios.valid;
    const response = await POST(request(scenario));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(evaluateExecutionResponseSchema.parse(body)).toEqual(body);
    expect(body.verdict.verdict).toBe("ALLOW");
    expect(body.nextHistory).toEqual({
      successfulRuns: 1,
      consumedExecutionIds: [scenario.attempt.executionId],
    });
    expect(scenario.history.successfulRuns).toBe(0);
  });

  it("returns no next history for DENY", async () => {
    const scenario = createInvoiceScenarioFixtures().scenarios.recipientDrift;
    const response = await POST(request(scenario));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.verdict.verdict).toBe("DENY");
    expect(body.nextHistory).toBeNull();
  });

  it("rejects client verdicts and fails closed on contract integrity errors", async () => {
    const scenario = createInvoiceScenarioFixtures().scenarios.valid;
    const suppliedVerdict = await POST(
      request({ ...scenario, verdict: { verdict: "ALLOW" } }),
    );
    const staleContract = {
      ...scenario,
      contract: {
        ...scenario.contract,
        constraints: { ...scenario.contract.constraints, maxCost: 100 },
      },
    };
    const stale = await POST(request(staleContract));

    expect(suppliedVerdict.status).toBe(400);
    expect(stale.status).toBe(409);
  });
});
