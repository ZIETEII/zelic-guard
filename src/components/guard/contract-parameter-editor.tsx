"use client";

import { useState, type FormEvent } from "react";

import type { ContractRevisionPatch, IntentContract } from "@/lib/guard/types";

export function ContractParameterEditor({
  contract,
  revising,
  onRevise,
}: {
  readonly contract: IntentContract | null;
  readonly revising: boolean;
  readonly onRevise: (patch: ContractRevisionPatch) => void;
}) {
  if (!contract) return null;

  return (
    <ParameterEditorForm
      key={contract.fingerprint}
      contract={contract}
      revising={revising}
      onRevise={onRevise}
    />
  );
}

function ParameterEditorForm({
  contract,
  revising,
  onRevise,
}: {
  readonly contract: IntentContract;
  readonly revising: boolean;
  readonly onRevise: (patch: ContractRevisionPatch) => void;
}) {
  const [recipient, setRecipient] = useState(contract.constraints.allowedRecipients[0]);
  const [maxCost, setMaxCost] = useState(String(contract.constraints.maxCost));
  const [maxRuns, setMaxRuns] = useState(String(contract.constraints.maxRuns));
  const [expiresAt, setExpiresAt] = useState(toLocalDateTime(contract.constraints.expiresAt));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRevise({
      allowedRecipients: [recipient],
      maxCost: Number(maxCost),
      maxRuns: Number(maxRuns),
      expiresAt: new Date(expiresAt).toISOString(),
    });
  }

  return (
    <form className="parameter-editor" onSubmit={submit} aria-label="Authority parameters">
      <div className="parameter-editor-heading">
        <div>
          <span className="section-kicker">PARAMETER REVISION</span>
          <h3>Change approved boundaries</h3>
        </div>
        <span className="revision-notice">Reapproval required</span>
      </div>
      <p>
        Editing any boundary creates a new proposed authority snapshot. Previous approval and execution evidence are cleared.
      </p>
      <div className="parameter-grid">
        <label>
          Authorized recipient
          <input
            type="email"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            required
          />
        </label>
        <label>
          Maximum cost (USD)
          <input
            type="number"
            min="0"
            step="0.01"
            value={maxCost}
            onChange={(event) => setMaxCost(event.target.value)}
            required
          />
        </label>
        <label>
          Maximum executions
          <input
            type="number"
            min="1"
            max="1000"
            step="1"
            value={maxRuns}
            onChange={(event) => setMaxRuns(event.target.value)}
            required
          />
        </label>
        <label>
          Expiry (local time)
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            required
          />
        </label>
      </div>
      <button className="button-secondary" type="submit" disabled={revising}>
        {revising ? "Reissuing authority…" : "Apply changes & require approval"}
      </button>
    </form>
  );
}

function toLocalDateTime(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
