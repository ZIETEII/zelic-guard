import { auditEventInputSchema, auditEventSchema } from "./schemas";
import type { AuditEvent } from "./types";

export function createAuditEvent(input: unknown): AuditEvent {
  const parsed = auditEventInputSchema.parse(input);

  return auditEventSchema.parse({
    ...parsed,
    schemaVersion: "1.0",
    id: formatAuditEventId(parsed.sequence),
  });
}

function formatAuditEventId(sequence: number): string {
  return `audit:${sequence.toString().padStart(6, "0")}`;
}
