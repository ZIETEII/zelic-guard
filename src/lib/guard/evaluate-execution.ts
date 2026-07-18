import { z } from "zod";

import { fingerprintContract } from "./fingerprint";
import {
  executionAttemptSchema,
  executionHistorySnapshotSchema,
  executionVerdictSchema,
  intentContractSchema,
} from "./schemas";
import type {
  ExecutionVerdict,
  ReasonCode,
  RuleCheck,
  RuleId,
} from "./types";

const evaluationInputSchema = z.strictObject({
  contract: intentContractSchema,
  attempt: executionAttemptSchema,
  now: z.iso.datetime({ offset: true }),
  history: executionHistorySnapshotSchema,
});

export class ContractIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractIntegrityError";
  }
}

export function evaluateExecution(input: unknown): ExecutionVerdict {
  const { contract, attempt, now, history } = evaluationInputSchema.parse(input);

  if (fingerprintContract(contract) !== contract.fingerprint) {
    throw new ContractIntegrityError(
      "Contract fingerprint does not match its authority payload",
    );
  }

  if (attempt.contractId !== contract.id) {
    throw new ContractIntegrityError(
      "Execution attempt references a different contract",
    );
  }

  const contractIsCurrent =
    contract.status !== "expired" &&
    Date.parse(now) < Date.parse(contract.constraints.expiresAt);
  const contractIsApproved = contract.status === "approved";
  const actionMatches = attempt.action === contract.action;
  const channelMatches = attempt.channel === contract.channel;
  const targetMatches = attempt.target === contract.target;
  const recipientAllowed = contract.constraints.allowedRecipients.includes(
    attempt.recipient,
  );
  const resourceMatches =
    attempt.resourceFingerprint === contract.constraints.resourceFingerprint;
  const costWithinLimit = attempt.cost <= contract.constraints.maxCost;
  const runsAvailable =
    history.successfulRuns < contract.constraints.maxRuns;
  const executionNotReplayed = !history.consumedExecutionIds.includes(
    attempt.executionId,
  );

  const checks: RuleCheck[] = [
    createRuleCheck(
      "contract_approved",
      "CONTRACT_NOT_APPROVED",
      contractIsApproved,
      "Contract is approved.",
      `Contract status is ${contract.status}; approval is required.`,
    ),
    createRuleCheck(
      "contract_not_expired",
      "CONTRACT_EXPIRED",
      contractIsCurrent,
      "Contract is within its execution window.",
      "Contract is expired for this evaluation time.",
    ),
    createRuleCheck(
      "action_matches",
      "ACTION_MISMATCH",
      actionMatches,
      "Attempt action matches the contract.",
      "Attempt action differs from the contracted action.",
    ),
    createRuleCheck(
      "channel_matches",
      "CHANNEL_MISMATCH",
      channelMatches,
      "Attempt channel matches the contract.",
      "Attempt channel differs from the contracted channel.",
    ),
    createRuleCheck(
      "target_matches",
      "TARGET_MISMATCH",
      targetMatches,
      "Attempt target matches the contract.",
      "Attempt target differs from the contracted target.",
    ),
    createRuleCheck(
      "recipient_allowed",
      "RECIPIENT_NOT_ALLOWED",
      recipientAllowed,
      "Attempt recipient is allowed.",
      "Attempt recipient is outside the contract allowlist.",
    ),
    createRuleCheck(
      "resource_matches",
      "RESOURCE_FINGERPRINT_MISMATCH",
      resourceMatches,
      "Attempt resource fingerprint matches the contract.",
      "Attempt resource fingerprint differs from the contract.",
    ),
    createRuleCheck(
      "cost_within_limit",
      "COST_LIMIT_EXCEEDED",
      costWithinLimit,
      "Attempt cost is within the contract limit.",
      "Attempt cost exceeds the contract limit.",
    ),
    createRuleCheck(
      "runs_available",
      "MAX_RUNS_EXCEEDED",
      runsAvailable,
      "Contract has execution capacity remaining.",
      "Contract has reached its maximum successful runs.",
    ),
    createRuleCheck(
      "execution_not_replayed",
      "REPLAY_DETECTED",
      executionNotReplayed,
      "Execution ID has not been consumed.",
      "Execution ID was already consumed.",
    ),
  ];

  const failedReasonCodes = checks
    .filter((check) => !check.passed)
    .map((check) => check.reasonCode);

  return executionVerdictSchema.parse({
    verdict: failedReasonCodes.length === 0 ? "ALLOW" : "DENY",
    reasonCodes:
      failedReasonCodes.length === 0
        ? ["ALL_RULES_PASSED"]
        : failedReasonCodes,
    checks,
  });
}

function createRuleCheck(
  rule: RuleId,
  reasonCode: ReasonCode,
  passed: boolean,
  passMessage: string,
  failureMessage: string,
): RuleCheck {
  return {
    rule,
    passed,
    reasonCode,
    message: passed ? passMessage : failureMessage,
  };
}
