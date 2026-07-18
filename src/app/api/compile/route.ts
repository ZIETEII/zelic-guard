import { z } from "zod";

import {
  compileIntentRequestSchema,
  compileIntentResponseSchema,
  UnsupportedIntentError,
} from "@/lib/guard/compiler";
import {
  compileIntentWithProviders,
  OpenAICompilerError,
} from "@/lib/guard/openai-compiler.server";
import {
  errorResponse,
  InvalidJsonError,
  readJson,
} from "@/lib/guard/route-utils";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = compileIntentRequestSchema.parse(await readJson(request));

    const result = compileIntentResponseSchema.parse(
      await compileIntentWithProviders(input),
    );
    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof InvalidJsonError) {
      return errorResponse(400, "INVALID_REQUEST", "Compile request failed validation");
    }
    if (error instanceof UnsupportedIntentError) {
      return errorResponse(422, "UNSUPPORTED_INTENT", error.message);
    }
    if (error instanceof OpenAICompilerError) {
      return errorResponse(503, "COMPILER_UNAVAILABLE", error.message);
    }
    return errorResponse(500, "COMPILATION_FAILED", "Intent compilation failed");
  }
}
