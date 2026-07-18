import {
  executionHistorySnapshotSchema,
  executionVerdictSchema,
  identifierSchema,
} from "./schemas";
import type { ExecutionVerdict } from "./types";

export interface ExecutionHistorySnapshot {
  readonly successfulRuns: number;
  readonly consumedExecutionIds: readonly string[];
}

export interface ExecutionHistory {
  snapshot(): ExecutionHistorySnapshot;
  recordVerdict(
    verdict: ExecutionVerdict,
    executionId: string,
  ): ExecutionHistorySnapshot;
}

export class HistoryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HistoryConflictError";
  }
}

export class HistoryVerdictIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HistoryVerdictIntegrityError";
  }
}

export class InMemoryExecutionHistory implements ExecutionHistory {
  readonly #consumedExecutionIds: Set<string>;
  #successfulRuns: number;

  constructor(
    initial: ExecutionHistorySnapshot = {
      successfulRuns: 0,
      consumedExecutionIds: [],
    },
  ) {
    const parsed = executionHistorySnapshotSchema.parse(initial);
    this.#successfulRuns = parsed.successfulRuns;
    this.#consumedExecutionIds = new Set(parsed.consumedExecutionIds);
  }

  snapshot(): ExecutionHistorySnapshot {
    return {
      successfulRuns: this.#successfulRuns,
      consumedExecutionIds: [...this.#consumedExecutionIds],
    };
  }

  recordVerdict(
    verdict: ExecutionVerdict,
    executionId: string,
  ): ExecutionHistorySnapshot {
    const parsedVerdict = executionVerdictSchema.parse(verdict);
    assertVerdictIntegrity(parsedVerdict);
    const parsedExecutionId = identifierSchema.parse(executionId);

    if (parsedVerdict.verdict === "DENY") {
      return this.snapshot();
    }

    if (this.#consumedExecutionIds.has(parsedExecutionId)) {
      throw new HistoryConflictError(
        `Execution ID ${parsedExecutionId} was already recorded`,
      );
    }

    this.#consumedExecutionIds.add(parsedExecutionId);
    this.#successfulRuns += 1;

    return this.snapshot();
  }
}

function assertVerdictIntegrity(verdict: ExecutionVerdict): void {
  const failedReasonCodes = verdict.checks
    .filter((check) => !check.passed)
    .map((check) => check.reasonCode);
  const expectedReasonCodes =
    failedReasonCodes.length === 0
      ? ["ALL_RULES_PASSED"]
      : failedReasonCodes;
  const hasConsistentDecision =
    verdict.verdict ===
    (failedReasonCodes.length === 0 ? "ALLOW" : "DENY");
  const hasConsistentReasons =
    verdict.reasonCodes.length === expectedReasonCodes.length &&
    verdict.reasonCodes.every(
      (reasonCode, index) => reasonCode === expectedReasonCodes[index],
    );

  if (!hasConsistentDecision || !hasConsistentReasons) {
    throw new HistoryVerdictIntegrityError(
      "Verdict aggregate does not match its ordered rule checks",
    );
  }
}
