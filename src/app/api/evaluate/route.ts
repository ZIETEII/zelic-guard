import { z } from "zod";

import {
  ContractIntegrityError,
  evaluateExecution,
} from "@/lib/guard/evaluate-execution";
import {
  HistoryConflictError,
  InMemoryExecutionHistory,
} from "@/lib/guard/history";
import {
  evaluateExecutionRequestSchema,
  evaluateExecutionResponseSchema,
} from "@/lib/guard/route-schemas";
import {
  errorResponse,
  InvalidJsonError,
  readJson,
} from "@/lib/guard/route-utils";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = evaluateExecutionRequestSchema.parse(await readJson(request));
    const verdict = evaluateExecution(input);
    let nextHistory = null;

    if (verdict.verdict === "ALLOW") {
      const history = new InMemoryExecutionHistory(input.history);
      nextHistory = history.recordVerdict(verdict, input.attempt.executionId);
    }

    const result = evaluateExecutionResponseSchema.parse({
      verdict,
      nextHistory,
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof InvalidJsonError) {
      return errorResponse(400, "INVALID_REQUEST", "Evaluation request failed validation");
    }
    if (
      error instanceof ContractIntegrityError ||
      error instanceof HistoryConflictError
    ) {
      return errorResponse(409, "EVALUATION_REJECTED", error.message);
    }
    return errorResponse(500, "EVALUATION_FAILED", "Execution evaluation failed");
  }
}
