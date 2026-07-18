import { fingerprintContract } from "./fingerprint";
import { intentContractSchema } from "./schemas";
import type { IntentContract } from "./types";

export class ContractLifecycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractLifecycleError";
  }
}

export class ContractApprovalIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractApprovalIntegrityError";
  }
}

export function approveContract(contract: unknown): IntentContract {
  const proposed = intentContractSchema.parse(contract);
  assertApprovableSnapshot(proposed);

  return intentContractSchema.parse({
    ...proposed,
    status: "approved",
  });
}

function assertApprovableSnapshot(proposed: IntentContract): void {
  if (proposed.status !== "proposed") {
    throw new ContractLifecycleError(
      `Only a proposed contract can be approved; received ${proposed.status}`,
    );
  }

  if (fingerprintContract(proposed) !== proposed.fingerprint) {
    throw new ContractApprovalIntegrityError(
      "Contract fingerprint does not match the proposed authority payload",
    );
  }
}
