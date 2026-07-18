import { describe, expect, it } from "vitest";

import {
  ContractIntegrityError,
  evaluateExecution,
} from "@/lib/guard/evaluate-execution";
import { fingerprintContract } from "@/lib/guard/fingerprint";
import type {
  ContractStatus,
  ExecutionAttempt,
  IntentContract,
} from "@/lib/guard/types";

const RESOURCE_FINGERPRINT = `sha256:${"a".repeat(64)}`;
const PLACEHOLDER_FINGERPRINT = `sha256:${"b".repeat(64)}`;
const NOW = "2026-07-18T17:00:00.000Z";

function createContract(status: ContractStatus = "approved"): IntentContract {
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
    status,
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

function withAttemptMutation(
  mutate: (draft: ExecutionAttempt) => void,
): ExecutionAttempt {
  const draft = structuredClone(createAttempt());
  mutate(draft);
  return draft;
}

function evaluate(
  contract = createContract(),
  attempt = createAttempt(),
  overrides: {
    now?: string;
    history?: {
      successfulRuns: number;
      consumedExecutionIds: string[];
    };
  } = {},
) {
  return evaluateExecution({
    contract,
    attempt,
    now: overrides.now ?? NOW,
    history: overrides.history ?? {
      successfulRuns: 0,
      consumedExecutionIds: [],
    },
  });
}

describe("evaluateExecution", () => {
  it("allows a valid approved execution with every check passing", () => {
    const result = evaluate();

    expect(result.verdict).toBe("ALLOW");
    expect(result.reasonCodes).toEqual(["ALL_RULES_PASSED"]);
    expect(result.checks.map((check) => check.rule)).toEqual([
      "contract_approved",
      "contract_not_expired",
      "action_matches",
      "channel_matches",
      "target_matches",
      "recipient_allowed",
      "resource_matches",
      "cost_within_limit",
      "runs_available",
      "execution_not_replayed",
    ]);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });

  it.each(["proposed", "rejected"] as const)(
    "denies a %s contract",
    (status) => {
      const contract = createContract(status);
      const result = evaluate(contract);

      expect(result.verdict).toBe("DENY");
      expect(result.reasonCodes).toEqual(["CONTRACT_NOT_APPROVED"]);
      expect(result.checks[0]).toMatchObject({
        rule: "contract_approved",
        passed: false,
        reasonCode: "CONTRACT_NOT_APPROVED",
      });
    },
  );

  it("denies an explicitly expired contract and still reports approval state", () => {
    const result = evaluate(createContract("expired"));

    expect(result.verdict).toBe("DENY");
    expect(result.reasonCodes).toEqual([
      "CONTRACT_NOT_APPROVED",
      "CONTRACT_EXPIRED",
    ]);
    expect(result.checks[1]).toMatchObject({
      rule: "contract_not_expired",
      passed: false,
      reasonCode: "CONTRACT_EXPIRED",
    });
  });

  it("treats the exact expiration timestamp as expired", () => {
    const contract = createContract();
    const result = evaluate(contract, createAttempt(), {
      now: contract.constraints.expiresAt,
    });

    expect(result.verdict).toBe("DENY");
    expect(result.reasonCodes).toEqual(["CONTRACT_EXPIRED"]);
    expect(result.checks[1].passed).toBe(false);
  });

  it("denies action drift", () => {
    const attempt = withAttemptMutation((draft) => {
      draft.action = "delete_invoice";
    });
    const result = evaluate(createContract(), attempt);

    expect(result.verdict).toBe("DENY");
    expect(result.reasonCodes).toEqual(["ACTION_MISMATCH"]);
    expect(result.checks[2]).toMatchObject({
      rule: "action_matches",
      passed: false,
      reasonCode: "ACTION_MISMATCH",
    });
  });

  it("denies channel drift", () => {
    const attempt = withAttemptMutation((draft) => {
      draft.channel = "payment";
    });
    const result = evaluate(createContract(), attempt);

    expect(result.verdict).toBe("DENY");
    expect(result.reasonCodes).toEqual(["CHANNEL_MISMATCH"]);
    expect(result.checks[3]).toMatchObject({
      rule: "channel_matches",
      passed: false,
      reasonCode: "CHANNEL_MISMATCH",
    });
  });

  it("denies target drift", () => {
    const attempt = withAttemptMutation((draft) => {
      draft.target = "payment-settlement";
    });
    const result = evaluate(createContract(), attempt);

    expect(result.verdict).toBe("DENY");
    expect(result.reasonCodes).toEqual(["TARGET_MISMATCH"]);
    expect(result.checks[4]).toMatchObject({
      rule: "target_matches",
      passed: false,
      reasonCode: "TARGET_MISMATCH",
    });
  });

  it("denies recipient drift", () => {
    const attempt = withAttemptMutation((draft) => {
      draft.recipient = "attacker@outside.test";
    });
    const result = evaluate(createContract(), attempt);

    expect(result.verdict).toBe("DENY");
    expect(result.reasonCodes).toEqual(["RECIPIENT_NOT_ALLOWED"]);
    expect(result.checks[5]).toMatchObject({
      rule: "recipient_allowed",
      passed: false,
      reasonCode: "RECIPIENT_NOT_ALLOWED",
    });
  });

  it("denies resource fingerprint drift", () => {
    const attempt = withAttemptMutation((draft) => {
      draft.resourceFingerprint = `sha256:${"c".repeat(64)}`;
    });
    const result = evaluate(createContract(), attempt);

    expect(result.verdict).toBe("DENY");
    expect(result.reasonCodes).toEqual([
      "RESOURCE_FINGERPRINT_MISMATCH",
    ]);
    expect(result.checks[6]).toMatchObject({
      rule: "resource_matches",
      passed: false,
      reasonCode: "RESOURCE_FINGERPRINT_MISMATCH",
    });
  });

  it("denies a cost overrun while allowing equality at the limit", () => {
    const attempt = withAttemptMutation((draft) => {
      draft.cost = 0.26;
    });
    const result = evaluate(createContract(), attempt);

    expect(result.verdict).toBe("DENY");
    expect(result.reasonCodes).toEqual(["COST_LIMIT_EXCEEDED"]);
    expect(result.checks[7]).toMatchObject({
      rule: "cost_within_limit",
      passed: false,
      reasonCode: "COST_LIMIT_EXCEEDED",
    });
  });

  it("denies when successful runs have reached the contract maximum", () => {
    const result = evaluate(createContract(), createAttempt(), {
      history: {
        successfulRuns: 1,
        consumedExecutionIds: [],
      },
    });

    expect(result.verdict).toBe("DENY");
    expect(result.reasonCodes).toEqual(["MAX_RUNS_EXCEEDED"]);
    expect(result.checks[8]).toMatchObject({
      rule: "runs_available",
      passed: false,
      reasonCode: "MAX_RUNS_EXCEEDED",
    });
  });

  it("denies a consumed execution ID as replay", () => {
    const attempt = createAttempt();
    const result = evaluate(createContract(), attempt, {
      history: {
        successfulRuns: 0,
        consumedExecutionIds: [attempt.executionId],
      },
    });

    expect(result.verdict).toBe("DENY");
    expect(result.reasonCodes).toEqual(["REPLAY_DETECTED"]);
    expect(result.checks[9]).toMatchObject({
      rule: "execution_not_replayed",
      passed: false,
      reasonCode: "REPLAY_DETECTED",
    });
  });

  it("reports every simultaneous policy failure in fixed rule order", () => {
    const contract = createContract("expired");
    const attempt = withAttemptMutation((draft) => {
      draft.action = "delete_invoice";
      draft.channel = "payment";
      draft.target = "payment-settlement";
      draft.recipient = "attacker@outside.test";
      draft.resourceFingerprint = `sha256:${"c".repeat(64)}`;
      draft.cost = 0.26;
    });
    const result = evaluate(contract, attempt, {
      now: contract.constraints.expiresAt,
      history: {
        successfulRuns: 1,
        consumedExecutionIds: [attempt.executionId],
      },
    });

    expect(result.verdict).toBe("DENY");
    expect(result.reasonCodes).toEqual([
      "CONTRACT_NOT_APPROVED",
      "CONTRACT_EXPIRED",
      "ACTION_MISMATCH",
      "CHANNEL_MISMATCH",
      "TARGET_MISMATCH",
      "RECIPIENT_NOT_ALLOWED",
      "RESOURCE_FINGERPRINT_MISMATCH",
      "COST_LIMIT_EXCEEDED",
      "MAX_RUNS_EXCEEDED",
      "REPLAY_DETECTED",
    ]);
    expect(result.checks).toHaveLength(10);
    expect(result.checks.every((check) => !check.passed)).toBe(true);
  });

  it("fails closed when the attempt references another contract", () => {
    const attempt = withAttemptMutation((draft) => {
      draft.contractId = "contract:invoice:INV-9999";
    });

    expect(() => evaluate(createContract(), attempt)).toThrow(
      ContractIntegrityError,
    );
  });

  it("fails closed for malformed input instead of returning a verdict", () => {
    expect(() =>
      evaluateExecution({
        contract: { ...createContract(), unexpected: true },
        attempt: createAttempt(),
        now: NOW,
        history: { successfulRuns: 0, consumedExecutionIds: [] },
      }),
    ).toThrow();
  });

  it("fails closed when the contract fingerprint was tampered", () => {
    const contract = createContract();
    contract.constraints.maxCost = 99;

    expect(() => evaluate(contract)).toThrow(ContractIntegrityError);
  });

  it("does not mutate contract, attempt, or history inputs", () => {
    const contract = createContract();
    const attempt = createAttempt();
    const history = {
      successfulRuns: 0,
      consumedExecutionIds: [] as string[],
    };
    const before = structuredClone({ contract, attempt, history });

    evaluateExecution({ contract, attempt, now: NOW, history });

    expect({ contract, attempt, history }).toEqual(before);
  });
});
