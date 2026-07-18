import { z } from "zod";

import {
  approveContract,
  ContractApprovalIntegrityError,
  ContractLifecycleError,
} from "@/lib/guard/approve-contract";
import {
  approveContractRequestSchema,
  approveContractResponseSchema,
} from "@/lib/guard/route-schemas";
import {
  errorResponse,
  InvalidJsonError,
  readJson,
} from "@/lib/guard/route-utils";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = approveContractRequestSchema.parse(await readJson(request));
    const result = approveContractResponseSchema.parse({
      contract: approveContract(input.contract),
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof InvalidJsonError) {
      return errorResponse(400, "INVALID_REQUEST", "Approval request failed validation");
    }
    if (
      error instanceof ContractApprovalIntegrityError ||
      error instanceof ContractLifecycleError
    ) {
      return errorResponse(409, "APPROVAL_REJECTED", error.message);
    }
    return errorResponse(500, "APPROVAL_FAILED", "Contract approval failed");
  }
}
