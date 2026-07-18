import type { ExecutionAttempt, IntentContract } from "./types";

export const INVOICE_INTENT =
  "Send invoice INV-2048 to finance@northstar.test once, for no more than $0.25, before 18:00.";

export const SIMULATION_DISCLOSURE =
  "Simulation only — no email or payment is sent.";

export const SCENARIOS = [
  { id: "safe", label: "Safe run", detail: "Exact approved authority" },
  { id: "recipient", label: "Recipient drift", detail: "Unapproved recipient" },
  { id: "cost", label: "Cost overrun", detail: "Requests $0.26" },
  { id: "replay", label: "Replay", detail: "Reuses an execution ID" },
  { id: "expired", label: "Expired contract", detail: "Runs after expiry" },
] as const;

export type ScenarioId = (typeof SCENARIOS)[number]["id"];

export interface DemoHistorySnapshot {
  readonly successfulRuns: number;
  readonly consumedExecutionIds: readonly string[];
}

export interface DemoEvaluationInput {
  readonly contract: IntentContract;
  readonly attempt: ExecutionAttempt;
  readonly now: string;
  readonly history: DemoHistorySnapshot;
}

const EVALUATION_TIME = "2026-07-18T17:00:00.000Z";
const EXPIRATION_TIME = "2026-07-18T23:00:00.000Z";
const SAFE_EXECUTION_ID = "execution:invoice:INV-2048:valid-001";
const EMPTY_HISTORY: DemoHistorySnapshot = {
  successfulRuns: 0,
  consumedExecutionIds: [],
};

export function createDemoEvaluationInput(
  contract: IntentContract,
  scenario: ScenarioId,
  runtimeHistory: DemoHistorySnapshot,
): DemoEvaluationInput {
  const attempt = createAttempt(contract, scenario);
  const history =
    scenario === "replay"
      ? createReplayHistory(runtimeHistory)
      : scenario === "safe"
        ? cloneHistory(runtimeHistory)
        : cloneHistory(EMPTY_HISTORY);

  return {
    contract: structuredClone(contract),
    attempt,
    now: scenario === "expired" ? EXPIRATION_TIME : EVALUATION_TIME,
    history,
  };
}

function createAttempt(
  contract: IntentContract,
  scenario: ScenarioId,
): ExecutionAttempt {
  const executionId =
    scenario === "safe" || scenario === "replay"
      ? SAFE_EXECUTION_ID
      : `execution:invoice:INV-2048:${scenario}-001`;

  return {
    schemaVersion: "1.0",
    executionId,
    contractId: contract.id,
    action: contract.action,
    channel: contract.channel,
    target: contract.target,
    recipient:
      scenario === "recipient"
        ? "attacker@outside.test"
        : contract.constraints.allowedRecipients[0],
    resourceFingerprint: contract.constraints.resourceFingerprint,
    cost: scenario === "cost" ? 0.26 : contract.constraints.maxCost,
    requestedAt: EVALUATION_TIME,
  };
}

function createReplayHistory(
  runtimeHistory: DemoHistorySnapshot,
): DemoHistorySnapshot {
  if (runtimeHistory.consumedExecutionIds.includes(SAFE_EXECUTION_ID)) {
    return cloneHistory(runtimeHistory);
  }

  return {
    successfulRuns: 1,
    consumedExecutionIds: [SAFE_EXECUTION_ID],
  };
}

function cloneHistory(history: DemoHistorySnapshot): DemoHistorySnapshot {
  return {
    successfulRuns: history.successfulRuns,
    consumedExecutionIds: [...history.consumedExecutionIds],
  };
}
