import { SCENARIOS, type ScenarioId } from "@/lib/guard/demo-seed";
import type { ExecutionVerdict } from "@/lib/guard/types";

interface ExecutionGateProps {
  readonly approved: boolean;
  readonly evaluating: boolean;
  readonly selectedScenario: ScenarioId | null;
  readonly verdict: ExecutionVerdict | null;
  readonly allowedCount: number;
  readonly blockedCount: number;
  readonly onRun: (scenario: ScenarioId) => void;
}

export function ExecutionGate({
  approved,
  evaluating,
  selectedScenario,
  verdict,
  allowedCount,
  blockedCount,
  onRun,
}: ExecutionGateProps) {
  return (
    <section className="stage-panel execution-panel" aria-labelledby="execution-title">
      <div className="panel-heading">
        <div>
          <span className="stage-number">03</span>
          <div>
            <span className="section-kicker">EXECUTION GATE</span>
            <h2 id="execution-title">Test the boundary</h2>
          </div>
        </div>
        <div className="counter-pair" aria-label="Execution counters">
          <span><b>{allowedCount}</b> allowed</span>
          <span><b>{blockedCount}</b> blocked</span>
        </div>
      </div>

      <div className="scenario-grid" aria-label="Execution scenarios">
        {SCENARIOS.map((scenario, index) => (
          <button
            className="scenario-card"
            key={scenario.id}
            type="button"
            disabled={!approved || evaluating}
            aria-pressed={selectedScenario === scenario.id}
            aria-label={scenario.label}
            onClick={() => onRun(scenario.id)}
          >
            <span className="scenario-index">0{index + 1}</span>
            <span>
              <strong>{scenario.label}</strong>
              <small>{scenario.detail}</small>
            </span>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m5 3 5 5-5 5" />
            </svg>
          </button>
        ))}
      </div>

      <p className="counter-readable">Allowed {allowedCount} · Blocked {blockedCount}</p>

      <section
        className={`verdict-panel${verdict ? ` verdict-${verdict.verdict.toLowerCase()}` : ""}`}
        aria-label="Execution verdict"
        aria-live="polite"
        aria-busy={evaluating}
      >
        {evaluating ? (
          <div className="verdict-empty">
            <span className="loading-line" aria-hidden="true" />
            <p>Evaluating 10 policy checks…</p>
          </div>
        ) : verdict ? (
          <VerdictEvidence verdict={verdict} expired={selectedScenario === "expired"} />
        ) : (
          <div className="verdict-empty">
            <ShieldOutline />
            <strong>Verdict pending</strong>
            <p>Approve a contract, then choose a simulation.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function VerdictEvidence({
  verdict,
  expired,
}: {
  readonly verdict: ExecutionVerdict;
  readonly expired: boolean;
}) {
  return (
    <>
      <div className="verdict-heading">
        <div>
          <span className="section-kicker">POLICY DECISION</span>
          {expired ? <p className="expired-label">Expired window</p> : null}
          <h3>{verdict.verdict}</h3>
        </div>
        <span className="verdict-symbol" aria-hidden="true">
          {verdict.verdict === "ALLOW" ? <CheckIcon /> : <DenyIcon />}
        </span>
      </div>

      <div className="reason-list" aria-label="Ordered reason codes">
        {verdict.reasonCodes.map((code, index) => (
          <span key={code}><b>{index + 1}</b>{code}</span>
        ))}
      </div>

      <ol className="check-list">
        {verdict.checks.map((check, index) => (
          <li key={check.rule} className={check.passed ? "check-pass" : "check-fail"}>
            <span className="check-icon" aria-hidden="true">
              {check.passed ? <CheckIcon /> : <DenyIcon />}
            </span>
            <span className="check-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="check-copy">
              <strong>{check.passed ? "Pass" : "Fail"}: {humanize(check.rule)}</strong>
              <small>{check.message}</small>
            </span>
            <code>{check.passed ? "PASS" : check.reasonCode}</code>
          </li>
        ))}
      </ol>
    </>
  );
}

function CheckIcon() {
  return <svg viewBox="0 0 16 16"><path d="m3 8.5 3 3L13 4.5" /></svg>;
}

function DenyIcon() {
  return <svg viewBox="0 0 16 16"><path d="m4 4 8 8m0-8-8 8" /></svg>;
}

function ShieldOutline() {
  return (
    <svg className="empty-shield" viewBox="0 0 40 44" aria-hidden="true">
      <path d="M20 2 36 8v12c0 10-6.5 17.8-16 22C10.5 37.8 4 30 4 20V8l16-6Z" />
      <path d="M13 16h14M13 22h10" />
    </svg>
  );
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}
