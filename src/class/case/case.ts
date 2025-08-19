import { caseJsonSchema } from "../../qde/schema.ts";
import type { CaseJson, GuidString } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";
import { ensureValidGuid } from "../shared/utils.ts";
import { VariableValue as VariableValueClass } from "./variableValue.ts";

export type CaseSpec = {
  guid: GuidString;
  name?: string;
  description?: string;
  codeRefs?: Set<Ref>;
  variableValues?: Set<VariableValueClass>;
  sourceRefs?: Set<Ref>;
  selectionRefs?: Set<Ref>;
};

export class Case {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="name" type="xsd:string"/> */
  readonly name?: string;

  // #### ELEMENTS ####

  /** <xsd:element name="Description" type="xsd:string" minOccurs="0"/> */
  readonly description?: string;
  /** <xsd:element name="CodeRef" type="CodeRefType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly codeRefs: Set<Ref>;
  /** <xsd:element name="VariableValue" type="VariableValueType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly variableValues: Set<VariableValueClass>;
  /** <xsd:element name="SourceRef" type="SourceRefType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly sourceRefs: Set<Ref>;
  /** <xsd:element name="SelectionRef" type="SelectionRefType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly selectionRefs: Set<Ref>;

  /**
   * Create a Case from a JSON object.
   * @param json - The JSON object to create the Case from.
   * @returns The created Case.
   */
  static fromJson(json: CaseJson): Case {
    const result = caseJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as CaseJson;
    const attrs = data._attributes as { guid: GuidString; name?: string };

    const variableValues = new Set(data.VariableValue?.map((value) => VariableValueClass.fromJson(value)) ?? []);
    const sourceRefs = new Set(data.SourceRef?.map((ref) => Ref.fromJson(ref)) ?? []);
    const selectionRefs = new Set(data.SelectionRef?.map((ref) => Ref.fromJson(ref)) ?? []);
    const codeRefs = new Set(data.CodeRef?.map((ref) => Ref.fromJson(ref)) ?? []);

    return new Case({
      guid: attrs.guid,
      name: attrs.name,
      description: data.Description,
      codeRefs,
      variableValues,
      sourceRefs,
      selectionRefs,
    });
  }

  /**
   * Create a Case from a specification object.
   * @param spec - The specification object to create the Case from.
   */
  constructor(spec: CaseSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.description = spec.description;
    this.codeRefs = spec.codeRefs ?? new Set();
    this.variableValues = spec.variableValues ?? new Set();
    this.sourceRefs = spec.sourceRefs ?? new Set();
    this.selectionRefs = spec.selectionRefs ?? new Set();
  }

  /**
   * Convert the Case to a JSON object.
   * @returns The JSON object representing the Case.
   */
  toJson(): CaseJson {
    return {
      _attributes: {
        guid: ensureValidGuid(this.guid, "Case.guid"),
        ...(this.name ? { name: this.name } : {}),
      },
      ...(this.description ? { Description: this.description } : {}),
      ...(this.codeRefs.size > 0 ? { CodeRef: [...this.codeRefs].map((ref) => ref.toJson()) } : {}),
      ...(this.variableValues.size > 0 ? { VariableValue: [...this.variableValues].map((v) => v.toJson()) } : {}),
      ...(this.sourceRefs.size > 0 ? { SourceRef: [...this.sourceRefs].map((ref) => ref.toJson()) } : {}),
      ...(this.selectionRefs.size > 0 ? { SelectionRef: [...this.selectionRefs].map((ref) => ref.toJson()) } : {}),
    } as unknown as CaseJson;
  }
}
