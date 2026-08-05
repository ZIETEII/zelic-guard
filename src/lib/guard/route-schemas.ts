import { z } from "zod";

import {
  contractRevisionPatchSchema,
  executionAttemptSchema,
  executionHistorySnapshotSchema,
  executionVerdictSchema,
  intentContractSchema,
} from "./schemas";

export const reviseContractRequestSchema = z.strictObject({
  contract: intentContractSchema,
  patch: contractRevisionPatchSchema,
});

export const reviseContractResponseSchema = z.strictObject({
  contract: intentContractSchema,
});

export const approveContractRequestSchema = z.strictObject({
  contract: intentContractSchema,
});

export const approveContractResponseSchema = z.strictObject({
  contract: intentContractSchema,
});

export const evaluateExecutionRequestSchema = z.strictObject({
  contract: intentContractSchema,
  attempt: executionAttemptSchema,
  now: z.iso.datetime({ offset: true }),
  history: executionHistorySnapshotSchema,
});

export const evaluateExecutionResponseSchema = z.strictObject({
  verdict: executionVerdictSchema,
  nextHistory: executionHistorySnapshotSchema.nullable(),
});
