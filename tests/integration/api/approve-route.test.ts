// @vitest-environment node

import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/approve/route";
import { createInvoiceScenarioFixtures } from "@/lib/guard/fixtures";
import { approveContractResponseSchema } from "@/lib/guard/route-schemas";

function request(body: unknown): Request {
  return new Request("http://localhost/api/approve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/approve", () => {
  it("approves only the submitted valid proposed snapshot", async () => {
    const { proposedContract } = createInvoiceScenarioFixtures();
    const response = await POST(request({ contract: proposedContract }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(approveContractResponseSchema.parse(body)).toEqual(body);
    expect(body.contract.status).toBe("approved");
    expect(proposedContract.status).toBe("proposed");
  });

  it("fails closed for stale authority and unknown request fields", async () => {
    const { proposedContract } = createInvoiceScenarioFixtures();
    const stale = {
      ...proposedContract,
      constraints: { ...proposedContract.constraints, maxCost: 100 },
    };

    expect((await POST(request({ contract: stale }))).status).toBe(409);
    expect(
      (await POST(request({ contract: proposedContract, approved: true }))).status,
    ).toBe(400);
  });
});
