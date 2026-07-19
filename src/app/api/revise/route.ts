import { z } from "zod";

import { reviseContract } from "@/lib/guard/revise-contract";
import {
  reviseContractRequestSchema,
  reviseContractResponseSchema,
} from "@/lib/guard/route-schemas";
import {
  errorResponse,
  InvalidJsonError,
  readJson,
} from "@/lib/guard/route-utils";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = reviseContractRequestSchema.parse(await readJson(request));
    const result = reviseContractResponseSchema.parse({
      contract: reviseContract(input),
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof InvalidJsonError) {
      return errorResponse(400, "INVALID_REQUEST", "Revision request failed validation");
    }
    return errorResponse(500, "REVISION_FAILED", "Contract revision failed");
  }
}
