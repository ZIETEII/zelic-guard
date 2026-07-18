import { describe, expect, it, vi } from "vitest";

import { evaluateExecution } from "@/lib/guard/evaluate-execution";
import {
  FIXTURE_RUNTIME_BOUNDARY,
  SIMULATION_DISCLOSURE,
  createInvoiceScenarioFixtures,
} from "@/lib/guard/fixtures";

describe("createInvoiceScenarioFixtures", () => {
  it("returns fresh deterministic invoice fixtures without hidden state", () => {
    const dateNow = vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("Date.now must not be called");
    });
    const random = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Math.random must not be called");
    });

    try {
      const first = createInvoiceScenarioFixtures();
      const second = createInvoiceScenarioFixtures();

      expect(first).toEqual(second);
      expect(first).not.toBe(second);
      expect(first.scenarios.valid).not.toBe(second.scenarios.valid);
    } finally {
      dateNow.mockRestore();
      random.mockRestore();
    }
  });

  it("provides a valid proposed snapshot and approved copy", () => {
    const fixtures = createInvoiceScenarioFixtures();

    expect(fixtures.proposedContract.status).toBe("proposed");
    expect(fixtures.approvedContract.status).toBe("approved");
    expect(fixtures.approvedContract.fingerprint).toBe(
      fixtures.proposedContract.fingerprint,
    );
  });

  it.each([
    ["valid", "ALLOW", ["ALL_RULES_PASSED"]],
    ["recipientDrift", "DENY", ["RECIPIENT_NOT_ALLOWED"]],
    ["costOverrun", "DENY", ["COST_LIMIT_EXCEEDED"]],
    [
      "replay",
      "DENY",
      ["MAX_RUNS_EXCEEDED", "REPLAY_DETECTED"],
    ],
    ["expired", "DENY", ["CONTRACT_EXPIRED"]],
  ] as const)(
    "evaluates the %s scenario deterministically",
    (scenarioName, expectedVerdict, expectedReasonCodes) => {
      const scenario = createInvoiceScenarioFixtures().scenarios[scenarioName];
      const result = evaluateExecution(scenario);

      expect(result.verdict).toBe(expectedVerdict);
      expect(result.reasonCodes).toEqual(expectedReasonCodes);
    },
  );

  it("declares simulation and server-only boundaries", () => {
    expect(SIMULATION_DISCLOSURE).toBe(
      "Simulation only — no email or payment is sent.",
    );
    expect(FIXTURE_RUNTIME_BOUNDARY).toContain("server-only");
    expect(FIXTURE_RUNTIME_BOUNDARY).toContain("node:crypto");
  });
});
