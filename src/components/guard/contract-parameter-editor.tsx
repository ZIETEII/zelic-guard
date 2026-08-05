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
    <form className="parameter-editor" onSubmit={submit} aria-label="Parámetros de autoridad">
      <div className="parameter-editor-heading">
        <div>
          <span className="section-kicker">REVISIÓN DE PARÁMETROS</span>
          <h3>Cambia los límites aprobados</h3>
        </div>
        <span className="revision-notice">Requiere aprobación</span>
      </div>
      <p>
        Editar cualquier límite genera una autoridad nueva por aprobar. La
        aprobación anterior y su evidencia de ejecución se descartan.
      </p>
      <div className="parameter-grid">
        <label>
          Destinatario autorizado
          <input
            type="email"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            required
          />
        </label>
        <label>
          Costo máximo (USD)
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
          Ejecuciones máximas
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
          Vencimiento (hora local)
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            required
          />
        </label>
      </div>
      <button className="button-secondary" type="submit" disabled={revising}>
        {revising ? "Reemitiendo autoridad…" : "Aplicar cambios y pedir aprobación"}
      </button>
    </form>
  );
}

function toLocalDateTime(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
