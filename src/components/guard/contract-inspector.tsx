import type { CompileIntentResponse } from "@/lib/guard/compiler";
import type { IntentContract } from "@/lib/guard/types";

interface ContractInspectorProps {
  readonly contract: IntentContract | null;
  readonly compiler: CompileIntentResponse["compiler"] | null;
  readonly approving: boolean;
  readonly onApprove: () => void;
}

export function ContractInspector({
  contract,
  compiler,
  approving,
  onApprove,
}: ContractInspectorProps) {
  if (!contract) {
    return (
      <div className="contract-inspector empty-state" aria-label="Contract inspector">
        <div className="empty-state-mark" aria-hidden="true">{"{ }"}</div>
        <p>No contract compiled.</p>
        <span>Compile the intent to create a reviewable authority snapshot.</span>
        <button className="button-secondary" type="button" disabled>
          Approve contract
        </button>
      </div>
    );
  }

  return (
    <div className="contract-inspector" aria-label="Contract inspector">
      <div className="inspector-heading">
        <div>
          <span className="section-kicker">AUTHORITY SNAPSHOT</span>
          <h3>Contract inspector</h3>
        </div>
        <span className={`status-badge status-${contract.status}`}>
          <span className="status-dot" aria-hidden="true" />
          {contract.status.toUpperCase()}
        </span>
      </div>

      <dl className="contract-fields">
        <ContractField label="Action" value={contract.action} />
        <ContractField label="Channel" value={contract.channel} />
        <ContractField label="Target" value={contract.target} />
        <ContractField
          label="Recipient"
          value={contract.constraints.allowedRecipients[0]}
          wide
        />
        <ContractField label="Max cost" value={`$${contract.constraints.maxCost.toFixed(2)}`} />
        <ContractField label="Max runs" value={String(contract.constraints.maxRuns)} />
        <ContractField label="Expiry" value={formatDate(contract.constraints.expiresAt)} wide />
        <ContractField
          label="Resource fingerprint"
          value={contract.constraints.resourceFingerprint}
          wide
          hash
        />
        <ContractField label="Contract fingerprint" value={contract.fingerprint} wide hash />
      </dl>

      <div className="authority-actions">
        <button
          className="button-authority"
          type="button"
          onClick={onApprove}
          disabled={contract.status !== "proposed" || approving}
        >
          {approving ? "Approving…" : "Approve contract"}
        </button>
        {compiler ? (
          <span className="compiler-caption">
            Verified by {compiler.provider === "seeded" ? "deterministic compiler" : compiler.model}
          </span>
        ) : null}
      </div>

      <details className="json-disclosure">
        <summary>Authority JSON</summary>
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
