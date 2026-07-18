import { describe, expect, it } from "vitest";

import { evaluateExecution } from "@/lib/guard/evaluate-execution";
import { fingerprintContract } from "@/lib/guard/fingerprint";
import {
  HistoryConflictError,
  HistoryVerdictIntegrityError,
  InMemoryExecutionHistory,
} from "@/lib/guard/history";
import type {
  ExecutionAttempt,
  ExecutionVerdict,
  IntentContract,
} from "@/lib/guard/types";

const RESOURCE_FINGERPRINT = `sha256:${"a".repeat(64)}`;
const PLACEHOLDER_FINGERPRINT = `sha256:${"b".repeat(64)}`;
const NOW = "2026-07-18T17:00:00.000Z";

function createContract(): IntentContract {
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
      maxRuns: 2,
      expiresAt: "2026-07-18T23:00:00.000Z",
    },
    status: "approved",
    fingerprint: PLACEHOLDER_FINGERPRINT,
  };

  return { ...unsigned, fingerprint: fingerprintContract(unsigned) };
}

function createAttempt(): ExecutionAttempt {
  const contract = createContract();

  return {
    schemaVersion: "1.0",
    executionId: "execution:invoice:INV-2048:001",
    contractId: contract.id,
    action: contract.action,
    channel: contract.channel,
    target: contract.target,
    recipient: contract.constraints.allowedRecipients[0],
    resourceFingerprint: contract.constraints.resourceFingerprint,
    cost: contract.constraints.maxCost,
    requestedAt: NOW,
  };
}

function evaluate(
  history: InMemoryExecutionHistory,
  attempt = createAttempt(),
) {
  return evaluateExecution({
    contract: createContract(),
    attempt,
    now: NOW,
    history: history.snapshot(),
  });
}

describe("InMemoryExecutionHistory", () => {
  it("records an execution and increments runs only after ALLOW", () => {
    const history = new InMemoryExecutionHistory();
    const attempt = createAttempt();
    const verdict = evaluate(history, attempt);

    const snapshot = history.recordVerdict(verdict, attempt.executionId);

    expect(snapshot).toEqual({
      successfulRuns: 1,
      consumedExecutionIds: [attempt.executionId],
    });
  });

  it("does not consume state for DENY", () => {
    const history = new InMemoryExecutionHistory();
    const attempt = createAttempt();
    attempt.recipient = "attacker@outside.test";
    const verdict = evaluate(history, attempt);

    expect(verdict.verdict).toBe("DENY");
    expect(history.recordVerdict(verdict, attempt.executionId)).toEqual({
      successfulRuns: 0,
      consumedExecutionIds: [],
    });
  });

  it("keeps adapter instances and returned snapshots isolated", () => {
    const first = new InMemoryExecutionHistory();
    const second = new InMemoryExecutionHistory();
    const attempt = createAttempt();
    first.recordVerdict(evaluate(first, attempt), attempt.executionId);

    const leaked = first.snapshot();
    (leaked.consumedExecutionIds as string[]).push("execution:leaked:001");

    expect(first.snapshot().consumedExecutionIds).toEqual([
      attempt.executionId,
    ]);
    expect(second.snapshot()).toEqual({
      successfulRuns: 0,
      consumedExecutionIds: [],
    });
  });

  it("rejects duplicate ALLOW recording without incrementing again", () => {
    const history = new InMemoryExecutionHistory();
    const attempt = createAttempt();
    const verdict = evaluate(history, attempt);
    history.recordVerdict(verdict, attempt.executionId);

    expect(() =>
      history.recordVerdict(verdict, attempt.executionId),
    ).toThrow(HistoryConflictError);
    expect(history.snapshot().successfulRuns).toBe(1);
  });

  it("does not mutate state for malformed verdict input", () => {
    const history = new InMemoryExecutionHistory();
    const malformed = {
      verdict: "ALLOW",
      reasonCodes: ["ALL_RULES_PASSED"],
      checks: [],
    } as unknown as ExecutionVerdict;

    expect(() =>
      history.recordVerdict(malformed, createAttempt().executionId),
    ).toThrow();
    expect(history.snapshot()).toEqual({
      successfulRuns: 0,
      consumedExecutionIds: [],
    });
  });

  it("does not consume a forged ALLOW with failed checks", () => {
    const history = new InMemoryExecutionHistory();
    const attempt = createAttempt();
    attempt.recipient = "attacker@outside.test";
    const denied = evaluate(history, attempt);
    const forged = {
      ...denied,
      verdict: "ALLOW",
      reasonCodes: ["ALL_RULES_PASSED"],
    } as ExecutionVerdict;

    expect(() =>
      history.recordVerdict(forged, attempt.executionId),
    ).toThrow(HistoryVerdictIntegrityError);
    expect(history.snapshot()).toEqual({
      successfulRuns: 0,
      consumedExecutionIds: [],
    });
  });

  it("does not mutate state when evaluation fails schema or integrity checks", () => {
    const history = new InMemoryExecutionHistory();
    const contract = createContract();
    contract.constraints.maxCost = 99;

    expect(() =>
      evaluateExecution({
        contract,
        attempt: createAttempt(),
        now: NOW,
        history: history.snapshot(),
      }),
    ).toThrow();
    expect(() =>
      evaluateExecution({
        contract: createContract(),
        attempt: { ...createAttempt(), unexpected: true },
        now: NOW,
        history: history.snapshot(),
      }),
    ).toThrow();
    expect(history.snapshot()).toEqual({
      successfulRuns: 0,
      consumedExecutionIds: [],
    });
  });
});
