import { describe, expect, it } from "vitest";

import {
  CanonicalizationError,
  canonicalize,
} from "@/lib/guard/canonicalize";
import { fingerprintContract } from "@/lib/guard/fingerprint";

const RESOURCE_FINGERPRINT = `sha256:${"a".repeat(64)}`;
const PLACEHOLDER_FINGERPRINT = `sha256:${"b".repeat(64)}`;

const validContract = {
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
  status: "proposed",
  fingerprint: PLACEHOLDER_FINGERPRINT,
} as const;

describe("canonicalize", () => {
  it("sorts object keys recursively regardless of insertion order", () => {
    const first = {
      z: [{ b: 2, a: 1 }, "signal"],
      a: { d: 4, c: 3 },
    };
    const second = {
      a: { c: 3, d: 4 },
      z: [{ a: 1, b: 2 }, "signal"],
    };

    expect(canonicalize(first)).toBe(canonicalize(second));
    expect(canonicalize(first)).toBe(
      '{"a":{"c":3,"d":4},"z":[{"a":1,"b":2},"signal"]}',
    );
  });

  it("keeps array order significant", () => {
    expect(canonicalize({ values: ["first", "second"] })).not.toBe(
      canonicalize({ values: ["second", "first"] }),
    );
  });

  it.each([
    ["undefined", { value: undefined }],
    ["non-finite numbers", { value: Number.POSITIVE_INFINITY }],
    ["dates", { value: new Date("2026-07-18T17:00:00.000Z") }],
    ["functions", { value: () => true }],
  ])("rejects non-canonical %s", (_label, value) => {
    expect(() => canonicalize(value)).toThrow(CanonicalizationError);
  });

  it("rejects cyclic structures", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;

    expect(() => canonicalize(cyclic)).toThrow(CanonicalizationError);
  });
});

describe("fingerprintContract", () => {
  it("is stable across contract object key insertion order", () => {
    const reordered = {
      fingerprint: validContract.fingerprint,
      status: validContract.status,
      constraints: {
        expiresAt: validContract.constraints.expiresAt,
        maxRuns: validContract.constraints.maxRuns,
        maxCost: validContract.constraints.maxCost,
        resourceFingerprint: validContract.constraints.resourceFingerprint,
        allowedRecipients: validContract.constraints.allowedRecipients,
      },
      target: validContract.target,
      channel: validContract.channel,
      action: validContract.action,
      id: validContract.id,
      schemaVersion: validContract.schemaVersion,
    };

    expect(fingerprintContract(reordered)).toBe(
      fingerprintContract(validContract),
    );
    expect(fingerprintContract(validContract)).toMatch(
      /^sha256:[a-f0-9]{64}$/,
    );
  });

  it("excludes derived fingerprint and lifecycle status", () => {
    expect(
      fingerprintContract({
        ...validContract,
        status: "approved",
        fingerprint: `sha256:${"c".repeat(64)}`,
      }),
    ).toBe(fingerprintContract(validContract));
  });

  it("changes when a material authority field changes", () => {
    expect(
      fingerprintContract({
        ...validContract,
        constraints: {
          ...validContract.constraints,
          maxCost: 0.26,
        },
      }),
    ).not.toBe(fingerprintContract(validContract));
  });

  it("keeps recipient array order significant", () => {
    const first = {
      ...validContract,
      constraints: {
        ...validContract.constraints,
        allowedRecipients: [
          "finance@northstar.test",
          "audit@northstar.test",
        ],
      },
    };
    const second = {
      ...first,
      constraints: {
        ...first.constraints,
        allowedRecipients: [...first.constraints.allowedRecipients].reverse(),
      },
    };

    expect(fingerprintContract(first)).not.toBe(fingerprintContract(second));
  });

  it("fails closed for a malformed contract", () => {
    expect(() =>
      fingerprintContract({ ...validContract, unexpected: true }),
    ).toThrow();
  });
});
