import { z } from "zod";

import { REASON_CODES } from "./reason-codes";

const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
const policyTokenPattern = /^[a-z][a-z0-9_:-]{1,63}$/;
const sha256Pattern = /^sha256:[a-f0-9]{64}$/;
export const boundedCostSchema = z
  .number()
  .finite()
  .nonnegative()
  .max(1_000_000);
export const zonedDateTimeSchema = z.iso.datetime({ offset: true });

export const schemaVersionSchema = z.literal("1.0");

export const identifierSchema = z
  .string()
  .min(3)
  .max(128)
  .regex(identifierPattern, "Must be a stable identifier");

export const policyTokenSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(policyTokenPattern, "Must be a lowercase policy token");

export const sha256FingerprintSchema = z
  .string()
  .regex(sha256Pattern, "Must be a lowercase SHA-256 fingerprint");

export const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email());

export const contractStatusSchema = z.enum([
  "proposed",
  "approved",
  "rejected",
  "expired",
]);

export const reasonCodeSchema = z.enum(REASON_CODES);

export const contractConstraintsSchema = z.strictObject({
    allowedRecipients: z
      .array(normalizedEmailSchema)
      .min(1)
      .max(20)
      .superRefine((recipients, context) => {
        if (new Set(recipients).size !== recipients.length) {
          context.addIssue({
            code: "custom",
            message: "Recipients must be unique after normalization",
          });
        }
      }),
    resourceFingerprint: sha256FingerprintSchema,
    maxCost: boundedCostSchema,
    maxRuns: z.number().int().positive().max(1_000),
    expiresAt: zonedDateTimeSchema,
  });

export const contractRevisionPatchSchema = z.strictObject({
  allowedRecipients: z
    .array(normalizedEmailSchema)
    .min(1)
    .max(20)
    .superRefine((recipients, context) => {
      if (new Set(recipients).size !== recipients.length) {
        context.addIssue({
          code: "custom",
          message: "Recipients must be unique after normalization",
        });
      }
    }),
  maxCost: boundedCostSchema,
  maxRuns: z.number().int().positive().max(1_000),
  expiresAt: zonedDateTimeSchema,
});

export const intentContractSchema = z.strictObject({
    schemaVersion: schemaVersionSchema,
    id: identifierSchema,
    action: policyTokenSchema,
    channel: policyTokenSchema,
    target: identifierSchema,
    constraints: contractConstraintsSchema,
    status: contractStatusSchema,
    fingerprint: sha256FingerprintSchema,
  });

export const executionAttemptSchema = z.strictObject({
    schemaVersion: schemaVersionSchema,
    executionId: identifierSchema,
    contractId: identifierSchema,
    action: policyTokenSchema,
    channel: policyTokenSchema,
    target: identifierSchema,
    recipient: normalizedEmailSchema,
    resourceFingerprint: sha256FingerprintSchema,
    cost: boundedCostSchema,
    requestedAt: zonedDateTimeSchema,
  });

export const executionHistorySnapshotSchema = z.strictObject({
  successfulRuns: z.number().int().nonnegative(),
  consumedExecutionIds: z
    .array(identifierSchema)
    .superRefine((executionIds, context) => {
      if (new Set(executionIds).size !== executionIds.length) {
        context.addIssue({
          code: "custom",
          message: "Consumed execution IDs must be unique",
        });
      }
    }),
});

export const ruleIdSchema = z.enum([
  "contract_approved",
  "contract_not_expired",
  "action_matches",
  "channel_matches",
  "target_matches",
  "recipient_allowed",
  "resource_matches",
  "cost_within_limit",
  "runs_available",
  "execution_not_replayed",
]);

export const ruleCheckSchema = z.strictObject({
  rule: ruleIdSchema,
  passed: z.boolean(),
  reasonCode: reasonCodeSchema,
  message: z.string().min(1).max(240),
});

export const executionVerdictSchema = z.strictObject({
  verdict: z.enum(["ALLOW", "DENY"]),
  reasonCodes: z.array(reasonCodeSchema).min(1),
  checks: z.array(ruleCheckSchema).length(10),
});

export const auditEventKindSchema = z.enum([
  "contract_proposed",
  "contract_approved",
  "execution_allowed",
  "execution_denied",
  "contract_expired",
  "lab_reset",
]);

export const auditEventInputSchema = z.strictObject({
  sequence: z.number().int().nonnegative().max(999_999),
  timestamp: zonedDateTimeSchema,
  kind: auditEventKindSchema,
  summary: z.string().trim().min(1).max(240),
  reasonCodes: z.array(reasonCodeSchema).max(10),
  contractId: identifierSchema.optional(),
  executionId: identifierSchema.optional(),
});

export const auditEventSchema = auditEventInputSchema.extend({
  schemaVersion: schemaVersionSchema,
  id: identifierSchema,
});
