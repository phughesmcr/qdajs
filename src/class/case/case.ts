import { caseSchema } from "../../qde/schema.ts";
import type { CaseJson, GuidString } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";
import { VariableValue as VariableValueClass, type VariableValueType } from "./variableValue.ts";

export type CaseSpec = {
  guid: string;
  name?: string;
  description?: string;
  codeRefs?: Set<Ref>;
  variableValues?: Set<VariableValueClass<VariableValueType>>;
  sourceRefs?: Set<Ref>;
  selectionRefs?: Set<Ref>;
};

export class Case {
  name?: string;
  description?: string;

  readonly guid: GuidString;
  readonly codeRefs: Set<Ref>;
  readonly variableValues: Set<VariableValueClass<VariableValueType>>;
  readonly sourceRefs: Set<Ref>;
  readonly selectionRefs: Set<Ref>;

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

    const variableValues = new Set(VariableValue?.map((value) => VariableValueClass.fromJson(value)) ?? []);
    const sourceRefs = new Set(SourceRef?.map((ref) => Ref.fromJson(ref)) ?? []);
    const selectionRefs = new Set(SelectionRef?.map((ref) => Ref.fromJson(ref)) ?? []);
    const codeRefs = new Set(CodeRef?.map((ref) => Ref.fromJson(ref)) ?? []);

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
    this.name = spec.name;
    this.description = spec.description;
    this.codeRefs = new Set(spec.codeRefs);
    this.variableValues = new Set(spec.variableValues);
    this.sourceRefs = new Set(spec.sourceRefs);
    this.selectionRefs = new Set(spec.selectionRefs);
  }

  toJson(): CaseJson {
    return {
      guid: this.guid,
      name: this.name,
      Description: this.description,
      ...(this.codeRefs.size > 0 ? { CodeRef: [...this.codeRefs].map((ref) => ref.toJson()) } : {}),
      ...(this.variableValues.size > 0 ? { VariableValue: [...this.variableValues].map((v) => v.toJson()) } : {}),
      ...(this.sourceRefs.size > 0 ? { SourceRef: [...this.sourceRefs].map((ref) => ref.toJson()) } : {}),
      ...(this.selectionRefs.size > 0 ? { SelectionRef: [...this.selectionRefs].map((ref) => ref.toJson()) } : {}),
    };
  }
}
