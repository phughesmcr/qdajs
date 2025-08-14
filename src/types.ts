/**
 * Shared types
 * @module
 */

import type { DIRECTIONS, LINE_STYLES, SHAPES, VARIABLE_TYPES } from "./constants.ts";

export type { Entry } from "@zip-js/zip-js";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = Record<string, unknown>;

export type Result<T, E extends Error = Error> = [ok: true, data: T] | [ok: false, error: E];

export type Shape = typeof SHAPES[number];

export type Direction = typeof DIRECTIONS[number];

export type VariableType = typeof VARIABLE_TYPES[number];

export type LineStyle = typeof LINE_STYLES[number];
