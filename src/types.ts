import type { ZodError } from "zod";

import type { Project } from "./schema.ts";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type Result<T, E extends Error = Error> = [ok: true, data: T] | [ok: false, error: E];

export type QdeToJsonResult = Result<{ qde: Project }, Error | ZodError>;

export type JsonToQdeResult = Result<{ qde: string }, Error | ZodError>;
