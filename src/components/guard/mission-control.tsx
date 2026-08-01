"use client";

import Link from "next/link";
import { useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { AuditTimeline, type AuditItem } from "./audit-timeline";
import { BrandMark } from "./brand-mark";
import { ContractInspector } from "./contract-inspector";
import { ContractParameterEditor } from "./contract-parameter-editor";
import { DeveloperQuickstart } from "./developer-quickstart";
import {
  ExecutionGate,
  type ThreatSuiteResult,
} from "./execution-gate";
import {
  compileIntentResponseSchema,
  type CompileIntentResponse,
} from "@/lib/guard/compiler";
import {
  createDemoEvaluationInput,
  INVOICE_INTENT,
  SCENARIOS,
  SIMULATION_DISCLOSURE,
  type DemoHistorySnapshot,
  type ScenarioId,
} from "@/lib/guard/demo-seed";
import {
  approveContractResponseSchema,
  evaluateExecutionResponseSchema,
  reviseContractResponseSchema,
} from "@/lib/guard/route-schemas";
import type {
  ContractRevisionPatch,
  ExecutionVerdict,
  IntentContract,
} from "@/lib/guard/types";
import { ThemeToggle } from "./theme-toggle";

const EMPTY_HISTORY: DemoHistorySnapshot = {
  successfulRuns: 0,
  consumedExecutionIds: [],
};

const AUDIT_TIMESTAMPS = [
  "2026-07-18T17:00:00.000Z",
  "2026-07-18T17:00:01.000Z",
  "2026-07-18T17:00:02.000Z",
  "2026-07-18T17:00:03.000Z",
  "2026-07-18T17:00:04.000Z",
  "2026-07-18T17:00:05.000Z",
  "2026-07-18T17:00:06.000Z",
  "2026-07-18T17:00:07.000Z",
  "2026-07-18T17:00:08.000Z",
  "2026-07-18T17:00:09.000Z",
] as const;

type MissionAccess =
  | { readonly kind: "public" }
  | { readonly kind: "operator"; readonly label: string };

export function MissionControl({
  access = { kind: "public" },
}: {
  readonly access?: MissionAccess;
}) {
  const [intent, setIntent] = useState(INVOICE_INTENT);
  const [contract, setContract] = useState<IntentContract | null>(null);
  const [compiler, setCompiler] =
    useState<CompileIntentResponse["compiler"] | null>(null);
  const [verdict, setVerdict] = useState<ExecutionVerdict | null>(null);
  const [history, setHistory] =
    useState<DemoHistorySnapshot>(EMPTY_HISTORY);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [allowedCount, setAllowedCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [suiteResults, setSuiteResults] = useState<ThreatSuiteResult[]>([]);
  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioId | null>(null);
  const [busy, setBusy] =
    useState<"compile" | "approve" | "revise" | "evaluate" | "suite" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const approved = contract?.status === "approved";
  const compilerLabel = getCompilerLabel(compiler);
  const compilerDetail = getCompilerDetail(compiler);
  const canCompile = busy === null && intent.trim().length > 0;

  const compileButtonHint = canCompile
    ? null
    : busy !== null
      ? "Espera a que termine la acción actual."
      : "Escribe una intención antes de compilar.";

  // Una sola acción primaria por pantalla — Manual de marca §7.2.
  // La única señal naranja de la pieza se mueve con el paso activo del flujo.
  const accionPrimaria = !contract
    ? "compilar"
    : !approved
      ? "aprobar"
      : "ejecutar";

  async function compileContract() {
    setBusy("compile");
    setError(null);
    setVerdict(null);
    setSelectedScenario(null);
    setSuiteResults([]);

    try {
      const payload = compileIntentResponseSchema.parse(
        await postJson("/api/compile", { intent, mode: "auto" }),
      );
      setContract(payload.contract);
      setCompiler(payload.compiler);
      setHistory(EMPTY_HISTORY);
      setAllowedCount(0);
      setBlockedCount(0);
      setAudit([createAuditItem(0, "Contrato compilado", "neutral")]);
    } catch {
      setError("No se pudo compilar el contrato. Revisa la intención e inténtalo de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  async function approveCurrentContract() {
    if (!contract) return;
    setBusy("approve");
    setError(null);

    try {
      const payload = approveContractResponseSchema.parse(
        await postJson("/api/approve", { contract }),
      );
      setContract(payload.contract);
      appendAudit("Contrato aprobado", "neutral");
    } catch {
      setError("No se pudo aprobar el contrato. Compila de nuevo un contrato propuesto válido.");
    } finally {
      setBusy(null);
    }
  }

  async function reviseCurrentContract(patch: ContractRevisionPatch) {
    if (!contract) return;
    setBusy("revise");
    setError(null);

    try {
      const payload = reviseContractResponseSchema.parse(
        await postJson("/api/revise", { contract, patch }),
      );
      setContract(payload.contract);
      setVerdict(null);
      setHistory(EMPTY_HISTORY);
      setAllowedCount(0);
      setBlockedCount(0);
      setSuiteResults([]);
      setSelectedScenario(null);
      appendAudit("Parámetros de autoridad revisados", "neutral");
    } catch {
      setError("No se pudo revisar la autoridad. El contrato aprobado sigue intacto.");
    } finally {
      setBusy(null);
    }
  }

  async function runScenario(scenario: ScenarioId) {
    if (!contract || !approved) return;
    setBusy("evaluate");
    setError(null);
    setVerdict(null);
    setSelectedScenario(scenario);
    setSuiteResults([]);

    try {
      const input = createDemoEvaluationInput(contract, scenario, history);
      const payload = evaluateExecutionResponseSchema.parse(
        await postJson("/api/evaluate", input),
      );
      setVerdict(payload.verdict);

      if (payload.verdict.verdict === "ALLOW") {
        if (payload.nextHistory) setHistory(payload.nextHistory);
        setAllowedCount((count) => count + 1);
        appendAudit("Ejecución permitida", "allow");
      } else {
        setBlockedCount((count) => count + 1);
        appendAudit(
          scenario === "expired"
            ? "Contrato vencido: ejecución prohibida"
            : "Ejecución prohibida",
          "deny",
        );
      }
    } catch {
      setError("La evaluación falló. No se consumió ningún estado de la simulación.");
    } finally {
      setBusy(null);
    }
  }

  async function runThreatSuite() {
    if (!contract || !approved) return;
    setBusy("suite");
    setError(null);
    setVerdict(null);
    setSuiteResults([]);
    setAllowedCount(0);
    setBlockedCount(0);

    let suiteHistory: DemoHistorySnapshot = EMPTY_HISTORY;
    let allowed = 0;
    let blocked = 0;
    const results: ThreatSuiteResult[] = [];

    try {
      for (const scenario of SCENARIOS) {
        setSelectedScenario(scenario.id);
        const input = createDemoEvaluationInput(
          contract,
          scenario.id,
          suiteHistory,
        );
        const payload = evaluateExecutionResponseSchema.parse(
          await postJson("/api/evaluate", input),
        );
        const outcome = payload.verdict.verdict;
        setVerdict(payload.verdict);

        if (outcome === "ALLOW") {
          allowed += 1;
          if (payload.nextHistory) suiteHistory = payload.nextHistory;
        } else {
          blocked += 1;
        }

        results.push({
          scenario: scenario.id,
          label: scenario.label,
          verdict: outcome,
          reason: payload.verdict.reasonCodes[0],
        });
        setSuiteResults([...results]);
        appendAudit(
          `${scenario.label}: ${outcome}`,
          outcome === "ALLOW" ? "allow" : "deny",
        );
      }

      setHistory(suiteHistory);
      setAllowedCount(allowed);
      setBlockedCount(blocked);
    } catch {
      setError("La suite se detuvo de forma segura. Los veredictos completados siguen visibles.");
    } finally {
      setBusy(null);
    }
  }

  function appendAudit(label: string, outcome: AuditItem["outcome"]) {
    setAudit((items) => [
      ...items,
      createAuditItem(items.length, label, outcome),
    ]);
  }

  function resetLab() {
    setIntent(INVOICE_INTENT);
    setContract(null);
    setCompiler(null);
    setVerdict(null);
    setHistory(EMPTY_HISTORY);
    setAllowedCount(0);
    setBlockedCount(0);
    setSuiteResults([]);
    setSelectedScenario(null);
    setError(null);
    setBusy(null);
    setAudit([createAuditItem(0, "Laboratorio reiniciado", "neutral")]);
  }

  return (
    <main className="mission-shell">
      <header className="topbar">
        {/* Lock-up de primera aparición — Manual de marca §1.7 */}
        <div className="brand-lockup">
          <BrandMark />
          <div>
            <strong>ZELIC Guard</strong>
            <span className="brand-respaldo">by LogVox</span>
          </div>
        </div>
        <div className="header-actions">
          <span className="header-badge">OPENAI BUILD WEEK</span>
          {access.kind === "operator" ? (
            <>
              <span className="header-badge operator-badge">ESPACIO DE OPERADOR</span>
              <span className="operator-identity">{access.label}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <span className="header-badge judge-badge">SANDBOX PÚBLICO</span>
              <Link className="operator-login-link" href="/login">Acceso de operador</Link>
            </>
          )}
          {/* Estado real declarado — §4.3 y §7.2 */}
          <span className="header-badge estado-producto">
            <span aria-hidden="true" /> PROTOTIPO FUNCIONAL
          </span>
          <ThemeToggle />
          <button className="reset-button" type="button" onClick={resetLab}>
            <ResetIcon />
            Reiniciar laboratorio
          </button>
        </div>
      </header>

      <section className="hero-compact" aria-labelledby="hero-title">
        <div>
          <p className="overline"><span aria-hidden="true" /> CAPA DE AUTORIDAD EN EJECUCIÓN</p>
          <h1 id="hero-title">Autoriza el alcance. No la sorpresa.</h1>
          <p className="hero-copy">
            Un agente puede planear libremente. Al ejecutar, cada acción debe
            permanecer dentro de la autoridad que una persona aprobó.
          </p>
        </div>
        <div className="proof-chips" aria-label="Garantías del sistema">
          <span><b>10</b> reglas verificadas</span>
          <span><b>SHA-256</b> autoridad</span>
          <span><b>0</b> acciones externas</span>
        </div>
      </section>

      <WorkflowRail contract={contract} verdict={verdict} />

      <div className="workspace-grid">
        <section className="stage-panel authority-panel" aria-labelledby="intent-title">
          <div className="panel-heading">
            <div>
              <span className="stage-number">01–02</span>
              <div>
                <span className="section-kicker">INTENCIÓN / AUTORIDAD</span>
                <h2 id="intent-title">Define el alcance aprobado</h2>
              </div>
            </div>
            <span className="mode-badge">
              <span aria-hidden="true" /> {compilerLabel}
            </span>
          </div>

          <div className="intent-editor">
            <label htmlFor="guard-intent">Intención en lenguaje natural</label>
            <textarea
              id="guard-intent"
              value={intent}
              onChange={(event) => setIntent(event.target.value)}
              spellCheck="false"
            />
            <div className="intent-meta">
              <span>Escenario de factura sembrado</span>
              <span>{compilerDetail}</span>
            </div>
            <button
              className="button-primary"
              type="button"
              data-activa={accionPrimaria === "compilar"}
              onClick={compileContract}
              disabled={!canCompile}
              title={compileButtonHint ?? "Compilar contrato"}
              aria-label="Compilar contrato"
            >
              {busy === "compile" ? <LoadingLabel label="Compilando contrato" /> : "Compilar contrato"}
            </button>
            {!canCompile ? (
              <p className="button-state-note" role="status" aria-live="polite">
                {compileButtonHint}
              </p>
            ) : null}
            <p className="simulation-disclosure">
              <ShieldMini />
              {SIMULATION_DISCLOSURE}
            </p>
          </div>

          <ContractInspector
            contract={contract}
            compiler={compiler}
            approving={busy === "approve"}
            esAccionPrimaria={accionPrimaria === "aprobar"}
            onApprove={approveCurrentContract}
          />
          <ContractParameterEditor
            contract={contract}
            revising={busy === "revise"}
            onRevise={reviseCurrentContract}
          />
        </section>

        <ExecutionGate
          approved={approved}
          evaluating={busy === "evaluate" || busy === "suite"}
          selectedScenario={selectedScenario}
          verdict={verdict}
          allowedCount={allowedCount}
          blockedCount={blockedCount}
          suiteRunning={busy === "suite"}
          suiteResults={suiteResults}
          esAccionPrimaria={accionPrimaria === "ejecutar"}
          onRun={runScenario}
          onRunSuite={runThreatSuite}
        />
      </div>

      <AuditTimeline items={audit} />

      <DeveloperQuickstart />

      <div
        className={error ? "error-banner" : "sr-status"}
        role={error ? "alert" : "status"}
        aria-live="assertive"
      >
        {error ? <><DenyMini />{error}</> : null}
      </div>
    </main>
  );
}

function getCompilerLabel(
  compiler: CompileIntentResponse["compiler"] | null,
): string {
  if (compiler?.provider === "openai") return "GPT-5.6 en vivo";
  if (compiler?.fallbackReason) return "Respaldo determinista";
  return "GPT-5.6 preferido";
}

function getCompilerDetail(
  compiler: CompileIntentResponse["compiler"] | null,
): string {
  if (compiler?.provider === "openai") {
    return `${compiler.model ?? "GPT-5.6"} compiló esta autoridad en el servidor`;
  }
  if (compiler?.fallbackReason === "missing_api_key") {
    return "OPENAI_API_KEY sin configurar · se usó el respaldo determinista";
  }
  if (compiler?.fallbackReason === "provider_error") {
    return "Proveedor OpenAI no disponible · se usó el respaldo determinista";
  }
  return "El servidor usa GPT-5.6 cuando está configurado · incluye respaldo sin conexión";
}

function WorkflowRail({
  contract,
  verdict,
}: {
  readonly contract: IntentContract | null;
  readonly verdict: ExecutionVerdict | null;
}) {
  // Autoridad en interfaz: Permitido · Requiere aprobación · Prohibido — §4.3
  const steps = [
    { label: "Intención", detail: contract ? "Compilada" : "Lista", complete: Boolean(contract) },
    {
      label: "Autoridad",
      detail:
        contract?.status === "approved"
          ? "Aprobada"
          : contract
            ? "Requiere aprobación"
            : "Bloqueada",
      complete: contract?.status === "approved",
    },
    {
      label: "Veredicto",
      detail: verdict ? (verdict.verdict === "ALLOW" ? "Permitido" : "Prohibido") : "Pendiente",
      complete: Boolean(verdict),
    },
  ];

  return (
    <nav className="workflow-rail" aria-label="Flujo del contrato">
      <ol>
        {steps.map((step, index) => (
          <li
            key={step.label}
            className={step.complete ? "rail-complete" : undefined}
            aria-current={!step.complete && (index === 0 || steps[index - 1].complete) ? "step" : undefined}
          >
            <span className="rail-index">0{index + 1}</span>
            <span><strong>{step.label}</strong><small>{step.detail}</small></span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function LoadingLabel({ label }: { readonly label: string }) {
  return <><span className="spinner" aria-hidden="true" />{label}…</>;
}

/* Iconografía LogVox §6.2 — retícula 24×24, trazo 2, remates rectos,
   uniones en ángulo vivo, sin relleno. lv-evolucion y lv-autoridad son los
   conceptos oficiales del set (04-recursos/iconos-mono/). */
function ResetIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 8V3h-5 M19 3l-3.5 3.5A7 7 0 1 0 19 13" /></svg>;
}

function ShieldMini() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 19 6v5.5c0 4-3 7-7 9-4-2-7-5-7-9V6Z M9 12l2.2 2.2L15.5 10" /></svg>;
}

function DenyMini() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>;
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();

  if (!response.ok) throw new Error("Guard API request failed");
  return payload;
}

function createAuditItem(
  sequence: number,
  label: string,
  outcome: AuditItem["outcome"],
): AuditItem {
  return {
    sequence,
    timestamp: AUDIT_TIMESTAMPS[sequence] ?? AUDIT_TIMESTAMPS.at(-1)!,
    label,
    outcome,
  };
}
