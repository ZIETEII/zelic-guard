import type { CompileIntentResponse } from "@/lib/guard/compiler";
import type { IntentContract } from "@/lib/guard/types";

interface ContractInspectorProps {
  readonly contract: IntentContract | null;
  readonly compiler: CompileIntentResponse["compiler"] | null;
  readonly approving: boolean;
  readonly esAccionPrimaria: boolean;
  readonly onApprove: () => void;
}

export function ContractInspector({
  contract,
  compiler,
  approving,
  esAccionPrimaria,
  onApprove,
}: ContractInspectorProps) {
  if (!contract) {
    const emptyApproveHint = "Compila la intención para habilitar la aprobación del contrato.";

    return (
      <div className="contract-inspector empty-state" aria-label="Inspector de contrato">
        <div className="empty-state-mark" aria-hidden="true">{"{ }"}</div>
        <p>Ningún contrato compilado.</p>
        <span>Compila la intención para obtener una autoridad revisable.</span>
        <button
          className="button-secondary"
          type="button"
          disabled
          title={emptyApproveHint}
          aria-label="Aprobar contrato"
        >
          Aprobar contrato
        </button>
        <p className="button-state-note" role="status" aria-live="polite">
          {emptyApproveHint}
        </p>
      </div>
    );
  }

  const contractCanBeApproved = contract.status === "proposed" && !approving;
  const approveHint = !contractCanBeApproved
    ? approving
      ? "Aprobando contrato..."
      : "Solo se puede aprobar un contrato propuesto."
    : null;

  // Autoridad en interfaz: Permitido · Requiere aprobación · Prohibido — §4.3
  const etiquetaEstado =
    contract.status === "approved" ? "APROBADO" : "REQUIERE APROBACIÓN";

  return (
    <div className="contract-inspector" aria-label="Inspector de contrato">
      <div className="inspector-heading">
        <div>
          <span className="section-kicker">AUTORIDAD APROBADA</span>
          <h3>Inspector de contrato</h3>
        </div>
        <span className={`status-badge status-${contract.status}`}>
          <span className="status-dot" aria-hidden="true" />
          {etiquetaEstado}
        </span>
      </div>

      <dl className="contract-fields">
        <ContractField label="Acción" value={contract.action} />
        <ContractField label="Canal" value={contract.channel} />
        <ContractField label="Destino" value={contract.target} />
        <ContractField
          label="Destinatario"
          value={contract.constraints.allowedRecipients[0]}
          wide
        />
        <ContractField label="Costo máximo" value={`$${contract.constraints.maxCost.toFixed(2)}`} />
        <ContractField label="Ejecuciones máximas" value={String(contract.constraints.maxRuns)} />
        <ContractField label="Vencimiento" value={formatDate(contract.constraints.expiresAt)} wide />
        <ContractField
          label="Huella del recurso"
          value={contract.constraints.resourceFingerprint}
          wide
          hash
        />
        <ContractField label="Huella del contrato" value={contract.fingerprint} wide hash />
      </dl>

      <div className="authority-actions">
        <button
          className="button-authority"
          type="button"
          data-activa={esAccionPrimaria}
          onClick={onApprove}
          disabled={!contractCanBeApproved}
          title={approveHint ?? "Aprobar contrato"}
          aria-label="Aprobar contrato"
        >
          {approving ? "Aprobando…" : "Aprobar contrato"}
        </button>
        {approveHint ? (
          <p className="button-state-note" role="status" aria-live="polite">
            {approveHint}
          </p>
        ) : null}
        {compiler ? (
          <span className="compiler-caption">
            Verificado por {compiler.provider === "seeded" ? "el compilador determinista" : compiler.model}
          </span>
        ) : null}
      </div>

      <details className="json-disclosure">
        <summary>Autoridad en JSON</summary>
        <pre>{JSON.stringify(contract, null, 2)}</pre>
      </details>
    </div>
  );
}

function ContractField({
  label,
  value,
  wide = false,
  hash = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly wide?: boolean;
  readonly hash?: boolean;
}) {
  return (
    <div className={wide ? "field-wide" : undefined}>
      <dt>{label}</dt>
      <dd className={hash ? "hash-value" : undefined}>{value}</dd>
    </div>
  );
}

function formatDate(value: string): string {
  return value.replace("T", " ").replace(".000Z", " UTC");
}
