import { describe, expect, it } from "vitest";

import { fingerprintContract } from "@/lib/guard/fingerprint";
import { createInvoiceScenarioFixtures } from "@/lib/guard/fixtures";
import { reviseContract } from "@/lib/guard/revise-contract";

describe("reviseContract", () => {
  it("creates a new proposed authority snapshot when parameters change", () => {
    const { approvedContract } = createInvoiceScenarioFixtures();
    const before = structuredClone(approvedContract);

    const revised = reviseContract({
      contract: approvedContract,
      patch: {
        allowedRecipients: ["ops@northstar.test"],
        maxCost: 0.5,
        maxRuns: 3,
        expiresAt: "2026-07-19T23:00:00.000Z",
      },
    });

    expect(revised.status).toBe("proposed");
    expect(revised.constraints).toMatchObject({
      allowedRecipients: ["ops@northstar.test"],
      maxCost: 0.5,
      maxRuns: 3,
      expiresAt: "2026-07-19T23:00:00.000Z",
    });
    expect(revised.fingerprint).not.toBe(approvedContract.fingerprint);
    expect(revised.fingerprint).toBe(fingerprintContract(revised));
    expect(approvedContract).toEqual(before);
  });

  it("fails closed for malformed revision parameters", () => {
    const { proposedContract } = createInvoiceScenarioFixtures();

    expect(() =>
      reviseContract({
        contract: proposedContract,
        patch: {
          allowedRecipients: ["not-an-email"],
          maxCost: -1,
          maxRuns: 0,
          expiresAt: "tomorrow",
        },
      }),
    ).toThrow();
  });
});
