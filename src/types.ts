import type { ZodError } from "zod";

export interface JsonObject {
  // deno-lint-ignore no-explicit-any
  [key: string]: any;
}

export type JsonValue = string | number | boolean | JsonObject | JsonValue[];

export interface NormalizedSet {
  id: string;
  name: string;
  description?: string;
  memberSources: string[];
}

export interface NormalizedProject {
  id: string;
  name: string;
  description?: string;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;

  codes: NormalizedCode[];
  users: NormalizedUser[];
  variables: NormalizedVariable[];
  sources: NormalizedSource[];
  sets: NormalizedSet[];
}

export interface NormalizedCode {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isCodable: boolean;
  parentId?: string;
  children: string[];
  usageCount: number;
}

export interface NormalizedUser {
  id: string;
  name: string;
  activityCount: number;
}

export interface NormalizedVariable {
  id: string;
  name: string;
  type: "Text" | "Boolean" | "Integer" | "Float" | "Date" | "DateTime";
  description?: string;
}

export interface NormalizedVariableValue {
  variableId: string;
  value: string;
}

export interface NormalizedSource {
  id: string;
  name: string;
  type: string;
  path?: string;
  description?: string;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
  selections: NormalizedSelection[];
  variableValues: NormalizedVariableValue[];
}

export interface NormalizedSelection {
  id: string;
  type: string;
  content?: string;
  startIndex?: number;
  endIndex?: number;
  codings: NormalizedCoding[];
}

export interface NormalizedCoding {
  id: string;
  codeId: string;
  userId?: string;
  createdDate?: string;
}

export interface NormalizedQdeData {
  // Simplified, flattened project structure
  project: NormalizedProject;
}

export type Result<T, E extends Error = Error> = [T, null] | [null, E];

export type QdeToJsonResult = Result<{ qde: JsonObject }, Error | ZodError>;

export type JsonToQdeResult = Result<{ qde: string }, Error | ZodError>;
