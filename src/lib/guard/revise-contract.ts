import { fingerprintContract } from "./fingerprint";
import { reviseContractRequestSchema } from "./route-schemas";
import { intentContractSchema } from "./schemas";
import type { IntentContract } from "./types";

const PLACEHOLDER_FINGERPRINT = `sha256:${"0".repeat(64)}`;

/**
 * Reissues authority after an operator edits its bounded parameters.
 *
 * A revision is always proposed, so a previous approval can never authorize
 * the changed recipient, cost, run limit, or expiry.
 */
export function reviseContract(input: unknown): IntentContract {
  const { contract, patch } = reviseContractRequestSchema.parse(input);
  const unsigned = {
    ...contract,
    constraints: {
      ...contract.constraints,
      ...patch,
    },
    status: "proposed" as const,
    fingerprint: PLACEHOLDER_FINGERPRINT,
  };

  return intentContractSchema.parse({
    ...unsigned,
    fingerprint: fingerprintContract(unsigned),
  });
}
