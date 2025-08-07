/**
 * @module Type Definitions
 *
 * Core TypeScript type definitions for QDAJS library.
 * Defines result patterns, JSON value types, and function return types
 * used throughout the QDE/QDPX processing pipeline.
 *
 * Uses a consistent Result pattern for error handling across all
 * conversion and validation functions, providing type-safe success/error states.
 */

import type { ZodError } from "zod";

import type { Project } from "./schema.ts";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type Result<T, E extends Error = Error> = [ok: true, data: T] | [ok: false, error: E];

export type QdeToJsonResult = Result<{ qde: Project }, Error | ZodError>;

export type JsonToQdeResult = Result<{ qde: string }, Error | ZodError>;
