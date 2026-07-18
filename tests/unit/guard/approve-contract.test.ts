import { describe, expect, it } from "vitest";

import {
  ContractApprovalIntegrityError,
  ContractLifecycleError,
  approveContract,
} from "@/lib/guard/approve-contract";
import { fingerprintContract } from "@/lib/guard/fingerprint";
import type { ContractStatus, IntentContract } from "@/lib/guard/types";

const RESOURCE_FINGERPRINT = `sha256:${"a".repeat(64)}`;
const PLACEHOLDER_FINGERPRINT = `sha256:${"b".repeat(64)}`;

function createProposedContract(
  status: ContractStatus = "proposed",
): IntentContract {
  const unsigned: IntentContract = {
    schemaVersion: "1.0",
    id: "contract:invoice:INV-2048",
    action: "send_invoice",
    channel: "email",
    target: "invoice-delivery",
    constraints: {
      allowedRecipients: ["finance@northstar.test"],
      resourceFingerprint: RESOURCE_FINGERPRINT,
      maxCost: 0.25,
      maxRuns: 1,
      expiresAt: "2026-07-18T23:00:00.000Z",
    },
    status,
    fingerprint: PLACEHOLDER_FINGERPRINT,
  };

  return { ...unsigned, fingerprint: fingerprintContract(unsigned) };
}

describe("approveContract", () => {
  it("approves a valid proposed snapshot without mutating the input", () => {
    const proposed = createProposedContract();
    const before = structuredClone(proposed);

    const approved = approveContract(proposed);

    expect(approved).not.toBe(proposed);
    expect(approved).toEqual({ ...proposed, status: "approved" });
    expect(approved.fingerprint).toBe(proposed.fingerprint);
    expect(proposed).toEqual(before);
  });

  it("fails closed after a material edit invalidates the fingerprint", () => {
    const edited = createProposedContract();
    edited.constraints.maxCost = 99;

    expect(() => approveContract(edited)).toThrow(
      ContractApprovalIntegrityError,
    );
  });

  it.each(["approved", "rejected", "expired"] as const)(
    "rejects an invalid transition from %s",
    (status) => {
      expect(() => approveContract(createProposedContract(status))).toThrow(
        ContractLifecycleError,
      );
    },
  );

  it("rejects malformed input instead of returning an approved contract", () => {
    expect(() =>
      approveContract({ ...createProposedContract(), unexpected: true }),
    ).toThrow();
  });
});
