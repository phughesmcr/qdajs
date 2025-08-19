/**
 * Shared types
 * @module
 */

export type { Entry } from "@zip-js/zip-js";

export type Result<T, E extends Error = Error> = [ok: true, data: T] | [ok: false, error: E];
