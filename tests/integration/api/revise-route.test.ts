// @vitest-environment node

import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/revise/route";
import { createInvoiceScenarioFixtures } from "@/lib/guard/fixtures";
import { reviseContractResponseSchema } from "@/lib/guard/route-schemas";

function request(body: unknown): Request {
  return new Request("http://localhost/api/revise", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/revise", () => {
  it("reissues changed authority as a proposed contract", async () => {
    const { approvedContract } = createInvoiceScenarioFixtures();
    const response = await POST(
      request({
        contract: approvedContract,
        patch: {
          allowedRecipients: ["ops@northstar.test"],
          maxCost: 0.5,
          maxRuns: 2,
          expiresAt: "2026-07-19T23:00:00.000Z",
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(reviseContractResponseSchema.parse(body)).toEqual(body);
    expect(body.contract.status).toBe("proposed");
    expect(body.contract.fingerprint).not.toBe(approvedContract.fingerprint);
  });

  it("rejects unknown fields instead of changing authority loosely", async () => {
    const { proposedContract } = createInvoiceScenarioFixtures();

    expect(
      (
        await POST(
          request({
            contract: proposedContract,
            patch: {
              allowedRecipients: ["ops@northstar.test"],
              maxCost: 0.5,
              maxRuns: 2,
              expiresAt: "2026-07-19T23:00:00.000Z",
              unbounded: true,
            },
          }),
        )
      ).status,
    ).toBe(400);
  });
});
