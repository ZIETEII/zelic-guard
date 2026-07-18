import type { z } from "zod";

import type {
  contractConstraintsSchema,
  contractStatusSchema,
  executionAttemptSchema,
  intentContractSchema,
  reasonCodeSchema,
} from "./schemas";

export type ContractConstraints = z.infer<typeof contractConstraintsSchema>;
export type ContractStatus = z.infer<typeof contractStatusSchema>;
export type IntentContract = z.infer<typeof intentContractSchema>;
export type ExecutionAttempt = z.infer<typeof executionAttemptSchema>;
export type ReasonCode = z.infer<typeof reasonCodeSchema>;
