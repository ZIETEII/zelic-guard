/**
 * Server-only fixture boundary.
 *
 * This module reaches `node:crypto` through `fingerprint.ts`. Future Client
 * Components must receive serialized fixture DTOs from a server boundary and
 * must never import this module directly.
 */

import { approveContract } from "./approve-contract";
import { fingerprintContract } from "./fingerprint";
import type { ExecutionHistorySnapshot } from "./history";
import type { ExecutionAttempt, IntentContract } from "./types";

export const SIMULATION_DISCLOSURE =
  "Simulation only — no email or payment is sent.";

export const FIXTURE_RUNTIME_BOUNDARY =
  "server-only: imports node:crypto through fingerprint.ts; never import from a Client Component";

export const INVOICE_INTENT =
  "Send invoice INV-2048 to finance@northstar.test once, for no more than $0.25, before 18:00.";

const RESOURCE_FINGERPRINT = `sha256:${"a".repeat(64)}`;
const PLACEHOLDER_FINGERPRINT = `sha256:${"b".repeat(64)}`;
const EVALUATION_TIME = "2026-07-18T17:00:00.000Z";
const EXPIRATION_TIME = "2026-07-18T23:00:00.000Z";

export interface EvaluationScenarioFixture {
  readonly contract: IntentContract;
  readonly attempt: ExecutionAttempt;
  readonly now: string;
  readonly history: ExecutionHistorySnapshot;
}

export interface InvoiceScenarioFixtures {
  readonly proposedContract: IntentContract;
  readonly approvedContract: IntentContract;
  readonly scenarios: {
    readonly valid: EvaluationScenarioFixture;
    readonly recipientDrift: EvaluationScenarioFixture;
    readonly costOverrun: EvaluationScenarioFixture;
    readonly replay: EvaluationScenarioFixture;
    readonly expired: EvaluationScenarioFixture;
  };
}

export function createInvoiceScenarioFixtures(): InvoiceScenarioFixtures {
  const proposedContract = createProposedInvoiceContract();
  const approvedContract = approveContract(proposedContract);
  const validAttempt = createInvoiceAttempt(approvedContract, "valid-001");

  return {
    proposedContract,
    approvedContract,
    scenarios: {
      valid: createScenario(approvedContract, validAttempt),
      recipientDrift: createScenario(approvedContract, {
        ...createInvoiceAttempt(approvedContract, "recipient-drift-001"),
        recipient: "attacker@outside.test",
      }),
      costOverrun: createScenario(approvedContract, {
        ...createInvoiceAttempt(approvedContract, "cost-overrun-001"),
        cost: 0.26,
      }),
      replay: createScenario(approvedContract, validAttempt, EVALUATION_TIME, {
        successfulRuns: 1,
        consumedExecutionIds: [validAttempt.executionId],
      }),
      expired: createScenario(
        approvedContract,
        createInvoiceAttempt(approvedContract, "expired-001"),
        EXPIRATION_TIME,
      ),
    },
  };
}

function createProposedInvoiceContract(): IntentContract {
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
      expiresAt: EXPIRATION_TIME,
    },
    status: "proposed",
    fingerprint: PLACEHOLDER_FINGERPRINT,
  };

  return { ...unsigned, fingerprint: fingerprintContract(unsigned) };
}

function createInvoiceAttempt(
  contract: IntentContract,
  executionSuffix: string,
): ExecutionAttempt {
  return {
    schemaVersion: "1.0",
    executionId: `execution:invoice:INV-2048:${executionSuffix}`,
    contractId: contract.id,
    action: contract.action,
    channel: contract.channel,
    target: contract.target,
    recipient: contract.constraints.allowedRecipients[0],
    resourceFingerprint: contract.constraints.resourceFingerprint,
    cost: contract.constraints.maxCost,
    requestedAt: EVALUATION_TIME,
  };
}

function createScenario(
  contract: IntentContract,
  attempt: ExecutionAttempt,
  now = EVALUATION_TIME,
  history: ExecutionHistorySnapshot = {
    successfulRuns: 0,
    consumedExecutionIds: [],
  },
): EvaluationScenarioFixture {
  return {
    contract: structuredClone(contract),
    attempt: structuredClone(attempt),
    now,
    history: cloneHistory(history),
  };
}

function cloneHistory(
  history: ExecutionHistorySnapshot,
): ExecutionHistorySnapshot {
  return {
    successfulRuns: history.successfulRuns,
    consumedExecutionIds: [...history.consumedExecutionIds],
  };
}
