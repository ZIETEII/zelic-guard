import { createHash } from "node:crypto";

import { canonicalize } from "./canonicalize";
import { intentContractSchema } from "./schemas";

export function contractAuthorityPayload(contract: unknown) {
  const parsed = intentContractSchema.parse(contract);

  return {
    schemaVersion: parsed.schemaVersion,
    id: parsed.id,
    action: parsed.action,
    channel: parsed.channel,
    target: parsed.target,
    constraints: parsed.constraints,
  };
}

export function fingerprintContract(contract: unknown): string {
  const authority = contractAuthorityPayload(contract);
  const digest = createHash("sha256")
    .update(canonicalize(authority), "utf8")
    .digest("hex");

  return `sha256:${digest}`;
}
