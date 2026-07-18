import "server-only";

/**
 * Server-only boundary: this module owns SDK construction and reads only
 * OPENAI_API_KEY / OPENAI_MODEL. Never import it from a Client Component.
 */

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { z } from "zod";

import {
  compileIntentRequestSchema,
  compileIntentResponseSchema,
  type CompileIntentRequest,
  type CompileIntentResponse,
  type IntentCompiler,
} from "./compiler";
import { compileDeterministicIntent } from "./deterministic-compiler";
import { fingerprintContract } from "./fingerprint";
import {
  identifierSchema,
  policyTokenSchema,
  schemaVersionSchema,
  sha256FingerprintSchema,
} from "./schemas";
import type { IntentContract } from "./types";

const modelContractSchema = z.strictObject({
  schemaVersion: schemaVersionSchema,
  id: identifierSchema,
  action: policyTokenSchema,
  channel: policyTokenSchema,
  target: identifierSchema,
  constraints: z.strictObject({
    allowedRecipients: z.array(z.email()).min(1).max(20),
    resourceFingerprint: sha256FingerprintSchema,
    maxCost: z.number().finite().nonnegative().max(1_000_000),
    maxRuns: z.number().int().positive().max(1_000),
    expiresAt: z.iso.datetime({ offset: true }),
  }),
});

const PLACEHOLDER_FINGERPRINT = `sha256:${"0".repeat(64)}`;

export interface OpenAIResponsesClient {
  readonly responses: {
    parse(
      request: ResponseCreateParamsNonStreaming,
    ): PromiseLike<{ output_parsed: unknown }>;
  };
}

interface OpenAICompilerOptions {
  readonly client: OpenAIResponsesClient;
  readonly model: string;
}

interface ProviderSelection {
  readonly apiKey?: string;
  readonly model?: string;
  readonly client?: OpenAIResponsesClient;
}

export class OpenAICompilerError extends Error {
  constructor(message = "OpenAI intent compilation failed") {
    super(message);
    this.name = "OpenAICompilerError";
  }
}

export function createOpenAIIntentCompiler({
  client,
  model,
}: OpenAICompilerOptions): IntentCompiler {
  return {
    async compile(input) {
      const request = compileIntentRequestSchema.parse(input);

      try {
        const response = await client.responses.parse({
          model,
          input: [
            {
              role: "system",
              content:
                "Compile the simulation intent into the supplied strict contract authority schema. Never claim or perform an external action.",
            },
            { role: "user", content: request.intent },
          ],
          text: {
            format: zodTextFormat(modelContractSchema, "intent_contract"),
          },
        });
        const authority = modelContractSchema.parse(response.output_parsed);
        const unsigned: IntentContract = {
          ...authority,
          status: "proposed",
          fingerprint: PLACEHOLDER_FINGERPRINT,
        };

        return compileIntentResponseSchema.parse({
          contract: {
            ...unsigned,
            fingerprint: fingerprintContract(unsigned),
          },
          compiler: {
            mode: "openai",
            provider: "openai",
            model,
            fallbackReason: null,
          },
        });
      } catch {
        throw new OpenAICompilerError();
      }
    },
  };
}

export async function compileIntentWithProviders(
  input: CompileIntentRequest,
  selection: ProviderSelection = {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
  },
): Promise<CompileIntentResponse> {
  const request = compileIntentRequestSchema.parse(input);

  if (request.mode === "deterministic") {
    return compileDeterministicIntent(request);
  }

  if (!selection.apiKey) {
    if (request.mode === "auto") {
      return compileDeterministicIntent(request, "missing_api_key");
    }
    throw new OpenAICompilerError("OpenAI mode requires OPENAI_API_KEY");
  }

  const model = selection.model || "gpt-5.6";
  const client = selection.client ?? createSdkClient(selection.apiKey);

  try {
    return await createOpenAIIntentCompiler({ client, model }).compile(request);
  } catch (error) {
    if (request.mode === "auto") {
      return compileDeterministicIntent(request, "provider_error");
    }
    if (error instanceof OpenAICompilerError) {
      throw error;
    }
    throw new OpenAICompilerError();
  }
}

function createSdkClient(apiKey: string): OpenAIResponsesClient {
  const client = new OpenAI({ apiKey });

  return {
    responses: {
      parse: (request) => client.responses.parse(request),
    },
  };
}
