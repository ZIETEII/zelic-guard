import { describe, expect, it, vi } from "vitest";

import { createAuditEvent } from "@/lib/guard/audit";
import { auditEventSchema } from "@/lib/guard/schemas";

const input = {
  sequence: 42,
  timestamp: "2026-07-18T17:00:00.000Z",
  kind: "execution_denied",
  summary: "Recipient drift blocked.",
  reasonCodes: ["RECIPIENT_NOT_ALLOWED"],
  contractId: "contract:invoice:INV-2048",
  executionId: "execution:invoice:INV-2048:attack-001",
} as const;

describe("createAuditEvent", () => {
  it("constructs the same event for the same caller-supplied values", () => {
    const first = createAuditEvent(input);
    const second = createAuditEvent(structuredClone(input));

    expect(first).toEqual(second);
    expect(first).toEqual({
      schemaVersion: "1.0",
      id: "audit:000042",
      ...input,
    });
    expect(auditEventSchema.parse(first)).toEqual(first);
  });

  it("does not read hidden clock or random state", () => {
    const dateNow = vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("Date.now must not be called");
    });
    const random = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Math.random must not be called");
    });

    try {
      expect(createAuditEvent(input).id).toBe("audit:000042");
    } finally {
      dateNow.mockRestore();
      random.mockRestore();
    }
  });

  it("derives ordering only from the supplied sequence", () => {
    const next = createAuditEvent({ ...input, sequence: 43 });

    expect(next.id).toBe("audit:000043");
    expect(next.sequence).toBe(43);
    expect(next.timestamp).toBe(input.timestamp);
  });

  it.each([
    ["negative sequence", { ...input, sequence: -1 }],
    ["invalid timestamp", { ...input, timestamp: "tomorrow" }],
    ["unknown keys", { ...input, hidden: true }],
  ])("fails closed for %s", (_label, candidate) => {
    expect(() => createAuditEvent(candidate)).toThrow();
  });
});
