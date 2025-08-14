import { caseSchema } from "../../qde/schema.ts";
import type { CaseJson } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";
import { VariableValue as VariableValueClass, type VariableValueType } from "./variableValue.ts";

export type CaseSpec = {
  guid: string;
  name?: string;
  description?: string;
  codeRefs: Ref[];
  variableValues: VariableValueClass<VariableValueType>[];
  sourceRefs: Ref[];
  selectionRefs: Ref[];
};

export class Case {
  readonly guid: string;
  readonly name: string;
  readonly description: string;
  readonly codeRefs: Ref[];
  readonly variableValues: VariableValueClass<VariableValueType>[];
  readonly sourceRefs: Ref[];
  readonly selectionRefs: Ref[];

  static fromJson(json: CaseJson): Case {
    const result = caseSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);

    const {
      guid,
      name,
      Description,
      CodeRef,
      VariableValue,
      SourceRef,
      SelectionRef,
    } = result.data as unknown as CaseJson;

    const variableValues = VariableValue?.map((value) => VariableValueClass.fromJson(value)) ?? [];
    const sourceRefs = SourceRef?.map((ref) => Ref.fromJson(ref)) ?? [];
    const selectionRefs = SelectionRef?.map((ref) => Ref.fromJson(ref)) ?? [];
    const codeRefs = CodeRef?.map((ref) => Ref.fromJson(ref)) ?? [];

    return new Case({
      guid,
      name,
      description: Description,
      codeRefs,
      variableValues,
      sourceRefs,
      selectionRefs,
    });
  }

  constructor(spec: CaseSpec) {
    this.guid = spec.guid;
    this.name = spec.name ?? "";
    this.description = spec.description ?? "";
    this.codeRefs = spec.codeRefs;
    this.variableValues = spec.variableValues;
    this.sourceRefs = spec.sourceRefs;
    this.selectionRefs = spec.selectionRefs;
  }

  toJson(): CaseJson {
    return {
      guid: this.guid,
      name: this.name,
      Description: this.description,
      ...(this.codeRefs.length > 0 ? { CodeRef: this.codeRefs.map((ref) => ref.toJson()) } : {}),
      ...(this.variableValues.length > 0 ? { VariableValue: this.variableValues.map((v) => v.toJson()) } : {}),
      ...(this.sourceRefs.length > 0 ? { SourceRef: this.sourceRefs.map((ref) => ref.toJson()) } : {}),
      ...(this.selectionRefs.length > 0 ? { SelectionRef: this.selectionRefs.map((ref) => ref.toJson()) } : {}),
    };
  }
}
