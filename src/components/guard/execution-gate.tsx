import { SCENARIOS, type ScenarioId } from "@/lib/guard/demo-seed";
import type { ExecutionVerdict, RuleId } from "@/lib/guard/types";

/**
 * Capa de presentación en es-CO para las reglas del motor.
 *
 * El motor de políticas permanece determinista y en inglés: sus `rule`,
 * `reasonCode` y `message` son el contrato de la API que consume un
 * integrador. La interfaz habla español (Manual de marca §2) sin alterar
 * esa salida.
 */
const REGLAS: Record<RuleId, { readonly etiqueta: string; readonly cumple: string; readonly falla: string }> = {
  contract_approved: {
    etiqueta: "contrato aprobado",
    cumple: "Una persona aprobó este contrato.",
    falla: "El contrato aún no tiene aprobación humana.",
  },
  contract_not_expired: {
    etiqueta: "contrato vigente",
    cumple: "La ejecución ocurre dentro de la ventana autorizada.",
    falla: "El contrato está vencido para este momento.",
  },
  action_matches: {
    etiqueta: "acción autorizada",
    cumple: "La acción del intento coincide con la contratada.",
    falla: "La acción del intento difiere de la contratada.",
  },
  channel_matches: {
    etiqueta: "canal autorizado",
    cumple: "El canal del intento coincide con el contratado.",
    falla: "El canal del intento difiere del contratado.",
  },
  target_matches: {
    etiqueta: "destino autorizado",
    cumple: "El destino del intento coincide con el contratado.",
    falla: "El destino del intento difiere del contratado.",
  },
  recipient_allowed: {
    etiqueta: "destinatario autorizado",
    cumple: "El destinatario está en la lista aprobada.",
    falla: "El destinatario está fuera de la lista aprobada.",
  },
  resource_matches: {
    etiqueta: "recurso autorizado",
    cumple: "La huella del recurso coincide con el contrato.",
    falla: "La huella del recurso difiere del contrato.",
  },
  cost_within_limit: {
    etiqueta: "costo dentro del límite",
    cumple: "El costo del intento respeta el límite aprobado.",
    falla: "El costo del intento supera el límite aprobado.",
  },
  runs_available: {
    etiqueta: "ejecuciones disponibles",
    cumple: "El contrato conserva capacidad de ejecución.",
    falla: "El contrato agotó sus ejecuciones aprobadas.",
  },
  execution_not_replayed: {
    etiqueta: "sin reintento",
    cumple: "El ID de ejecución no se había consumido.",
    falla: "El ID de ejecución ya se había consumido.",
  },
};

interface ExecutionGateProps {
  readonly approved: boolean;
  readonly evaluating: boolean;
  readonly selectedScenario: ScenarioId | null;
  readonly verdict: ExecutionVerdict | null;
  readonly allowedCount: number;
  readonly blockedCount: number;
  readonly suiteRunning: boolean;
  readonly suiteResults: readonly ThreatSuiteResult[];
  readonly esAccionPrimaria: boolean;
  readonly onRun: (scenario: ScenarioId) => void;
  readonly onRunSuite: () => void;
}

export interface ThreatSuiteResult {
  readonly scenario: ScenarioId;
  readonly label: string;
  readonly verdict: "ALLOW" | "DENY";
  readonly reason: string;
}

export function ExecutionGate({
  approved,
  evaluating,
  selectedScenario,
  verdict,
  allowedCount,
  blockedCount,
  suiteRunning,
  suiteResults,
  esAccionPrimaria,
  onRun,
  onRunSuite,
}: ExecutionGateProps) {
  const canRunScenarios = approved && !evaluating;
  const runHint = canRunScenarios
    ? null
    : evaluating
      ? "Espera a que termine la evaluación actual."
      : "Aprueba un contrato para habilitar la ejecución de escenarios.";

  return (
    <section className="stage-panel execution-panel" aria-labelledby="execution-title">
      <div className="panel-heading">
        <div>
          <span className="stage-number">03</span>
          <div>
            <span className="section-kicker">COMPUERTA DE EJECUCIÓN</span>
            <h2 id="execution-title">Prueba el límite</h2>
          </div>
        </div>
        <div className="counter-pair" aria-label="Contadores de ejecución">
          <span><b>{allowedCount}</b> permitidas</span>
          <span><b>{blockedCount}</b> prohibidas</span>
        </div>
      </div>

      <div className="suite-runner">
        <div>
          <span className="section-kicker">PRUEBA EN UN CLIC</span>
          <strong>Desafía cada límite</strong>
          <small>1 ejecución válida · 4 intentos adversarios · 10 reglas cada uno</small>
        </div>
        <button
          className="button-suite"
          type="button"
          data-activa={esAccionPrimaria}
          disabled={!canRunScenarios}
          onClick={onRunSuite}
          title={runHint ?? "Ejecutar la suite completa"}
          aria-label="Ejecutar la suite completa"
        >
          {suiteRunning ? "Ejecutando 5 simulaciones…" : "Ejecutar la suite completa"}
        </button>
        {runHint ? (
          <p className="button-state-note" role="status" aria-live="polite">
            {runHint}
          </p>
        ) : null}
      </div>

      {suiteResults.length ? (
        <section className="suite-report" aria-label="Informe de la suite" aria-live="polite">
          <div className="suite-report-heading">
            <strong>
              {suiteResults.length === SCENARIOS.length
                ? "Suite completa"
                : `Suite ${suiteResults.length}/${SCENARIOS.length}`}
            </strong>
            <span>Suite: {suiteResults.length}/{SCENARIOS.length} límites verificados</span>
          </div>
          <ol>
            {suiteResults.map((result) => (
              <li key={result.scenario} className={`suite-${result.verdict.toLowerCase()}`}>
                <span>{result.label}</span>
                <code>{result.reason}</code>
                <b>{result.verdict}</b>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="scenario-grid" aria-label="Escenarios de ejecución">
        {SCENARIOS.map((scenario, index) => (
          <button
            className="scenario-card"
            key={scenario.id}
            type="button"
            disabled={!canRunScenarios}
            aria-pressed={selectedScenario === scenario.id}
            aria-label={scenario.label}
            title={runHint ?? scenario.label}
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

      <p className="counter-readable">Permitidas {allowedCount} · Prohibidas {blockedCount}</p>

      <section
        className={`verdict-panel${verdict ? ` verdict-${verdict.verdict.toLowerCase()}` : ""}`}
        aria-label="Veredicto de ejecución"
        aria-live="polite"
        aria-busy={evaluating}
      >
        {evaluating ? (
          <div className="verdict-empty">
            <span className="loading-line" aria-hidden="true" />
            <p>Verificando 10 reglas…</p>
          </div>
        ) : verdict ? (
          <VerdictEvidence verdict={verdict} expired={selectedScenario === "expired"} />
        ) : (
          <div className="verdict-empty">
            <ShieldOutline />
            <strong>Veredicto pendiente</strong>
            <p>Aprueba un contrato y elige una simulación.</p>
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
  const permitido = verdict.verdict === "ALLOW";

  return (
    <>
      <div className="verdict-heading">
        <div>
          <span className="section-kicker">DECISIÓN DE AUTORIDAD</span>
          {expired ? <p className="expired-label">Ventana vencida</p> : null}
          {/* Término de interfaz §4.3; el código de la API queda como dato. */}
          <h3>{permitido ? "PERMITIDO" : "PROHIBIDO"}</h3>
          <code>{verdict.verdict}</code>
        </div>
        <span className="verdict-symbol" aria-hidden="true">
          {permitido ? <CheckIcon /> : <DenyIcon />}
        </span>
      </div>

      <div className="reason-list" aria-label="Códigos de razón en orden">
        {verdict.reasonCodes.map((code, index) => (
          <span key={code}><b>{index + 1}</b>{code}</span>
        ))}
      </div>

      <ol className="check-list">
        {verdict.checks.map((check, index) => {
          const regla = REGLAS[check.rule];

          return (
            <li key={check.rule} className={check.passed ? "check-pass" : "check-fail"}>
              <span className="check-icon" aria-hidden="true">
                {check.passed ? <CheckIcon /> : <DenyIcon />}
              </span>
              <span className="check-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="check-copy">
                <strong>{check.passed ? "Cumple" : "Falla"}: {regla.etiqueta}</strong>
                <small>{check.passed ? regla.cumple : regla.falla}</small>
              </span>
              <code>{check.passed ? "PASS" : check.reasonCode}</code>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/* Iconografía LogVox §6.2 — retícula 24×24, trazo 2, remates rectos,
   uniones en ángulo vivo, esquinas nunca redondeadas. */
function CheckIcon() {
  return <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}

function DenyIcon() {
  return <svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19" /></svg>;
}

/* lv-autoridad — concepto oficial del set (04-recursos/iconos-mono/) */
function ShieldOutline() {
  return (
    <svg className="empty-shield" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 19 6v5.5c0 4-3 7-7 9-4-2-7-5-7-9V6Z M9 12l2.2 2.2L15.5 10" />
    </svg>
  );
}
