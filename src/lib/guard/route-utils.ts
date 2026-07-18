import { z } from "zod";

export const apiErrorResponseSchema = z.strictObject({
  error: z.strictObject({
    code: z.string().min(1).max(64),
    message: z.string().min(1).max(240),
  }),
});

export function errorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  return Response.json(apiErrorResponseSchema.parse({ error: { code, message } }), {
    status,
  });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new InvalidJsonError();
  }
}

export class InvalidJsonError extends Error {
  constructor() {
    super("Request body must be valid JSON");
    this.name = "InvalidJsonError";
  }
}
