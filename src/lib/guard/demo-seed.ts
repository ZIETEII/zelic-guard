import type { ExecutionAttempt, IntentContract } from "./types";

export const INVOICE_INTENT =
  "Envía la factura INV-2048 a finance@northstar.test una sola vez, por máximo $0.25, antes de las 18:00.";

export const SIMULATION_DISCLOSURE =
  "Simulación. No se envía ningún correo ni pago.";

export const SCENARIOS = [
  { id: "safe", label: "Ejecución válida", detail: "Dentro de la autoridad aprobada" },
  { id: "recipient", label: "Destinatario no autorizado", detail: "Cambia el destinatario aprobado" },
  { id: "cost", label: "Costo sobre el límite", detail: "Solicita $0.26" },
  { id: "replay", label: "Reintento de ejecución", detail: "Reutiliza un ID ya consumido" },
  { id: "expired", label: "Contrato vencido", detail: "Ejecuta fuera de la ventana" },
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
