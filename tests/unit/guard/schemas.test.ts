import { describe, expect, it } from "vitest";

import { REASON_CODES } from "@/lib/guard/reason-codes";
import {
  intentContractSchema,
  executionAttemptSchema,
} from "@/lib/guard/schemas";

const SHA256_A = `sha256:${"a".repeat(64)}`;
const SHA256_B = `sha256:${"b".repeat(64)}`;

const validContract = {
  schemaVersion: "1.0",
  id: "contract:invoice:INV-2048",
  action: "send_invoice",
  channel: "email",
  target: "invoice-delivery",
  constraints: {
    allowedRecipients: [" Finance@Northstar.Test "],
    resourceFingerprint: SHA256_A,
    maxCost: 0.25,
    maxRuns: 1,
    expiresAt: "2026-07-18T23:00:00.000Z",
  },
  status: "proposed",
  fingerprint: SHA256_B,
} as const;

const validAttempt = {
  schemaVersion: "1.0",
  executionId: "execution:invoice:INV-2048:001",
  contractId: validContract.id,
  action: validContract.action,
  channel: validContract.channel,
  target: validContract.target,
  recipient: " Finance@Northstar.Test ",
  resourceFingerprint: SHA256_A,
  cost: 0.25,
  requestedAt: "2026-07-18T17:00:00.000Z",
} as const;

function withContractMutation(
  mutate: (draft: Record<string, unknown>) => void,
) {
  const draft = structuredClone(validContract) as unknown as Record<
    string,
    unknown
  >;
  mutate(draft);
  return draft;
}

function withAttemptMutation(mutate: (draft: Record<string, unknown>) => void) {
  const draft = structuredClone(validAttempt) as unknown as Record<
    string,
    unknown
  >;
  mutate(draft);
  return draft;
}

describe("intentContractSchema", () => {
  it("parses a strict contract and normalizes recipient addresses", () => {
    const parsed = intentContractSchema.parse(validContract);

    expect(parsed.constraints.allowedRecipients).toEqual([
      "finance@northstar.test",
    ]);
  });

  it.each([
    [
      "unknown contract keys",
      withContractMutation((draft) => {
        draft.untrusted = true;
      }),
    ],
    [
      "unknown constraint keys",
      withContractMutation((draft) => {
        (draft.constraints as Record<string, unknown>).untrusted = true;
      }),
    ],
    [
      "timestamps without a timezone",
      withContractMutation((draft) => {
        (draft.constraints as Record<string, unknown>).expiresAt =
          "2026-07-18T23:00:00";
      }),
    ],
    [
      "malformed fingerprints",
      withContractMutation((draft) => {
        draft.fingerprint = "sha256:not-a-digest";
      }),
    ],
    [
      "negative costs",
      withContractMutation((draft) => {
        (draft.constraints as Record<string, unknown>).maxCost = -0.01;
      }),
    ],
    [
      "zero max runs",
      withContractMutation((draft) => {
        (draft.constraints as Record<string, unknown>).maxRuns = 0;
      }),
    ],
    [
      "fractional max runs",
      withContractMutation((draft) => {
        (draft.constraints as Record<string, unknown>).maxRuns = 1.5;
      }),
    ],
    [
      "invalid recipients",
      withContractMutation((draft) => {
        (draft.constraints as Record<string, unknown>).allowedRecipients = [
          "not-an-email",
        ];
      }),
    ],
    [
      "duplicate normalized recipients",
      withContractMutation((draft) => {
        (draft.constraints as Record<string, unknown>).allowedRecipients = [
          "finance@northstar.test",
          " FINANCE@NORTHSTAR.TEST ",
        ];
      }),
    ],
  ])("rejects %s", (_label, candidate) => {
    expect(intentContractSchema.safeParse(candidate).success).toBe(false);
  });
});

describe("executionAttemptSchema", () => {
  it("parses a strict attempt and normalizes its recipient", () => {
    const parsed = executionAttemptSchema.parse(validAttempt);

    expect(parsed.recipient).toBe("finance@northstar.test");
  });

  it.each([
    [
      "unknown keys",
      withAttemptMutation((draft) => {
        draft.untrusted = true;
      }),
    ],
    [
      "negative cost",
      withAttemptMutation((draft) => {
        draft.cost = -0.01;
      }),
    ],
    [
      "invalid recipient",
      withAttemptMutation((draft) => {
        draft.recipient = "not-an-email";
      }),
    ],
    [
      "invalid requested timestamp",
      withAttemptMutation((draft) => {
        draft.requestedAt = "tomorrow";
      }),
    ],
    [
      "malformed resource fingerprint",
      withAttemptMutation((draft) => {
        draft.resourceFingerprint = "sha256:not-a-digest";
      }),
    ],
  ])("rejects %s", (_label, candidate) => {
    expect(executionAttemptSchema.safeParse(candidate).success).toBe(false);
  });
});

describe("reason codes", () => {
  it("exposes the complete deterministic policy vocabulary", () => {
    expect(REASON_CODES).toEqual([
      "CONTRACT_NOT_APPROVED",
      "CONTRACT_EXPIRED",
      "ACTION_MISMATCH",
      "CHANNEL_MISMATCH",
      "TARGET_MISMATCH",
      "RECIPIENT_NOT_ALLOWED",
      "RESOURCE_FINGERPRINT_MISMATCH",
      "COST_LIMIT_EXCEEDED",
      "MAX_RUNS_EXCEEDED",
      "REPLAY_DETECTED",
      "ALL_RULES_PASSED",
    ]);
  });
});
