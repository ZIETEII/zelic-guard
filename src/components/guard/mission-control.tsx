"use client";

import { useState } from "react";

import { AuditTimeline, type AuditItem } from "./audit-timeline";
import { BrandMark } from "./brand-mark";
import { ContractInspector } from "./contract-inspector";
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
} from "@/lib/guard/route-schemas";
import type { ExecutionVerdict, IntentContract } from "@/lib/guard/types";

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

export function MissionControl() {
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
    useState<"compile" | "approve" | "evaluate" | "suite" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const approved = contract?.status === "approved";
  const compilerLabel = getCompilerLabel(compiler);
  const compilerDetail = getCompilerDetail(compiler);

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
      setAudit([createAuditItem(0, "Contract compiled", "neutral")]);
    } catch {
      setError("Contract compilation failed. Check the intent and try again.");
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
      appendAudit("Contract approved", "neutral");
    } catch {
      setError("Contract approval failed. Recompile a valid proposed contract.");
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
        appendAudit("Execution allowed", "allow");
      } else {
        setBlockedCount((count) => count + 1);
        appendAudit(
          scenario === "expired"
            ? "Expired contract blocked"
            : "Execution denied",
          "deny",
        );
      }
    } catch {
      setError("Evaluation failed. No simulation state was consumed.");
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
      setError("Threat suite stopped safely. Completed verdicts remain visible.");
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
    setAudit([createAuditItem(0, "Lab reset", "neutral")]);
  }

  return (
    <main className="mission-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <BrandMark />
          <div>
            <strong>ZELIC Guard</strong>
            <span>Intent contracts for autonomous systems</span>
          </div>
        </div>
        <div className="header-actions">
          <span className="header-badge">OPENAI BUILD WEEK</span>
          <span className="header-badge simulation-badge">
            <span aria-hidden="true" /> SIMULATION
          </span>
          <button className="reset-button" type="button" onClick={resetLab}>
            <ResetIcon />
            Reset Lab
          </button>
        </div>
      </header>

      <section className="hero-compact" aria-labelledby="hero-title">
        <div>
          <p className="overline"><span aria-hidden="true" /> RUNTIME AUTHORITY LAYER</p>
          <h1 id="hero-title">Approve the intent. Not the surprise.</h1>
          <p className="hero-copy">
            Autonomous systems can plan freely. At execution time, every action
            must remain inside the authority a human approved.
          </p>
        </div>
        <div className="proof-chips" aria-label="System guarantees">
          <span><b>10</b> policy checks</span>
          <span><b>SHA-256</b> authority</span>
          <span><b>0</b> external actions</span>
        </div>
      </section>

      <WorkflowRail contract={contract} verdict={verdict} />

      <div className="workspace-grid">
        <section className="stage-panel authority-panel" aria-labelledby="intent-title">
          <div className="panel-heading">
            <div>
              <span className="stage-number">01–02</span>
              <div>
                <span className="section-kicker">INTENT / AUTHORITY</span>
                <h2 id="intent-title">Define approved scope</h2>
              </div>
            </div>
            <span className="mode-badge">
              <span aria-hidden="true" /> {compilerLabel}
            </span>
          </div>

          <div className="intent-editor">
            <label htmlFor="guard-intent">Natural-language intent</label>
            <textarea
              id="guard-intent"
              value={intent}
              onChange={(event) => setIntent(event.target.value)}
              spellCheck="false"
            />
            <div className="intent-meta">
              <span>Seeded invoice scenario</span>
              <span>{compilerDetail}</span>
            </div>
            <button
              className="button-primary"
              type="button"
              onClick={compileContract}
              disabled={busy !== null || !intent.trim()}
            >
              {busy === "compile" ? <LoadingLabel label="Compiling contract" /> : "Compile contract"}
            </button>
            <p className="simulation-disclosure">
              <ShieldMini />
              {SIMULATION_DISCLOSURE}
            </p>
          </div>

          <ContractInspector
            contract={contract}
            compiler={compiler}
            approving={busy === "approve"}
            onApprove={approveCurrentContract}
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
          onRun={runScenario}
          onRunSuite={runThreatSuite}
        />
      </div>

      <AuditTimeline items={audit} />

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
  if (compiler?.provider === "openai") return "GPT-5.6 live";
  if (compiler?.fallbackReason) return "Deterministic fallback";
  return "GPT-5.6 preferred";
}

function getCompilerDetail(
  compiler: CompileIntentResponse["compiler"] | null,
): string {
  if (compiler?.provider === "openai") {
    return `${compiler.model ?? "GPT-5.6"} compiled this authority on the server`;
  }
  if (compiler?.fallbackReason === "missing_api_key") {
    return "OPENAI_API_KEY not configured · deterministic fallback used";
  }
  if (compiler?.fallbackReason === "provider_error") {
    return "OpenAI provider unavailable · deterministic fallback used";
  }
  return "Server chooses GPT-5.6 when configured · offline fallback included";
}

function WorkflowRail({
  contract,
  verdict,
}: {
  readonly contract: IntentContract | null;
  readonly verdict: ExecutionVerdict | null;
}) {
  const steps = [
    { label: "Intent", detail: contract ? "Compiled" : "Ready", complete: Boolean(contract) },
    {
      label: "Authority",
      detail: contract?.status === "approved" ? "Approved" : contract ? "Proposed" : "Locked",
      complete: contract?.status === "approved",
    },
    {
      label: "Verdict",
      detail: verdict?.verdict ?? "Pending",
      complete: Boolean(verdict),
    },
  ];

  return (
    <nav className="workflow-rail" aria-label="Contract workflow">
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

function ResetIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 5V2m0 0h-3m3 0-2.2 2.2A5.5 5.5 0 1 0 13.5 9" /></svg>;
}

function ShieldMini() {
  return <svg viewBox="0 0 16 18" aria-hidden="true"><path d="M8 1 14 3.3v4.5c0 3.8-2.4 6.7-6 8.2-3.6-1.5-6-4.4-6-8.2V3.3L8 1Z" /></svg>;
}

function DenyMini() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" /></svg>;
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
