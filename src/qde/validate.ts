import type { ZodError } from "zod";

import { ERROR_INVALID_PROJECT, ERROR_MISSING_NAME, ERROR_SCHEMA_FAILED } from "../constants.ts";
import { type Project, projectSchema } from "../schema.ts";
import type { Result } from "../types.ts";

export function validateQdeJson(json: unknown): Result<{ qde: Project }, Error | ZodError> {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    return [false, new Error(ERROR_INVALID_PROJECT)];
  }

  const project = json as Record<string, unknown>;
  const attrs = project["_attributes"] as Record<string, unknown>;
  if (attrs && !("name" in attrs)) {
    return [
      false,
      new Error(ERROR_MISSING_NAME),
    ];
  }

  const validationResult = projectSchema.safeParse(project);
  if (!validationResult.success) {
    return [
      false,
      new Error(ERROR_SCHEMA_FAILED, { cause: validationResult.error }),
    ];
  }
  return [true, { qde: validationResult.data }];
}
