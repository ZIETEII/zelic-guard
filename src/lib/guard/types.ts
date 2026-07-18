import type { z } from "zod";

import type {
  contractConstraintsSchema,
  contractStatusSchema,
  executionVerdictSchema,
  executionAttemptSchema,
  intentContractSchema,
  reasonCodeSchema,
  ruleCheckSchema,
  ruleIdSchema,
} from "./schemas";

export type ContractConstraints = z.infer<typeof contractConstraintsSchema>;
export type ContractStatus = z.infer<typeof contractStatusSchema>;
export type IntentContract = z.infer<typeof intentContractSchema>;
export type ExecutionAttempt = z.infer<typeof executionAttemptSchema>;
export type ReasonCode = z.infer<typeof reasonCodeSchema>;
export type RuleId = z.infer<typeof ruleIdSchema>;
export type RuleCheck = z.infer<typeof ruleCheckSchema>;
export type ExecutionVerdict = z.infer<typeof executionVerdictSchema>;
