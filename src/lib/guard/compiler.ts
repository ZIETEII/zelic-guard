import { z } from "zod";

import { intentContractSchema } from "./schemas";

export const compilerModeSchema = z.enum([
  "deterministic",
  "auto",
  "openai",
]);

export const compileIntentRequestSchema = z.strictObject({
  intent: z.string().trim().min(1).max(2_000),
  mode: compilerModeSchema,
});

export const compilerMetadataSchema = z.strictObject({
  mode: z.enum(["deterministic", "openai"]),
  provider: z.enum(["seeded", "openai"]),
  model: z.string().min(1).max(120).nullable(),
  fallbackReason: z.enum(["missing_api_key", "provider_error"]).nullable(),
});

export const compileIntentResponseSchema = z.strictObject({
  contract: intentContractSchema,
  compiler: compilerMetadataSchema,
});

export type CompileIntentRequest = z.infer<typeof compileIntentRequestSchema>;
export type CompileIntentResponse = z.infer<typeof compileIntentResponseSchema>;

export interface IntentCompiler {
  compile(request: CompileIntentRequest): Promise<CompileIntentResponse>;
}

export class UnsupportedIntentError extends Error {
  constructor() {
    super("Unsupported deterministic intent");
    this.name = "UnsupportedIntentError";
  }
}
