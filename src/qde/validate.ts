/**
 * QDE JSON Validation
 *
 * Schema validation module for QDE (Qualitative Data Exchange) JSON data.
 * Provides Zod-based runtime validation with comprehensive error reporting
 * for ensuring QDE project data conforms to expected schema structure.
 *
 * Validates project attributes, required fields, and nested structures
 * according to REFI-QDA standards for qualitative data analysis.
 *
 * @module
 */

import type { ZodError } from "zod";

import type { Result } from "../types.ts";
import { projectJsonSchema } from "./schema.ts";
import type { ProjectJson } from "./types.ts";

/**
 * Validate JSON data against QDE project schema
 *
 * Performs comprehensive validation of QDE project data using Zod schema.
 * Checks for required project attributes (name), validates structure, and
 * provides detailed error information for validation failures.
 *
 * @param json - Unknown JSON data to validate against QDE schema
 * @returns Result tuple: [true, {qde: validatedData}] on success, [false, Error | ZodError] on validation failure
 *
 * @example
 * ```typescript
 * const projectData = {
 *   _attributes: { name: "My Project" },
 *   Sources: [],
 *   CodeBook: [],
 *   ...
 * };
 *
 * const [valid, result] = validateQdeJson(projectData);
 * if (valid) {
 *   console.log('Valid project:', result.qde);
 * } else {
 *   console.error('Validation error:', result.message);
 * }
 * ```
 */
export function validateQdeJson(json: unknown): Result<{ qde: ProjectJson }, Error | ZodError> {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    return [false, new Error("Invalid QDE project: root element must be an object")];
  }
  const validationResult = projectJsonSchema.safeParse(json);
  if (!validationResult.success) {
    return [false, validationResult.error];
  }
  return [true, { qde: validationResult.data as ProjectJson }];
}
