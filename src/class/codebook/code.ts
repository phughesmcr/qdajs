import { codeJsonSchema } from "../../qde/schema.ts";
import type { CodeJson, GuidString, RGBString } from "../../qde/types.ts";
import { ensureValidGuid, ensureValidRgbColor } from "../../utils.ts";
import { Ref } from "../ref/ref.ts";

export interface CodeSpec {
  guid: GuidString;
  name: string;
  isCodable: boolean;
  color?: RGBString;

  description?: string;
  noteRefs?: Set<Ref>;
  children?: Set<Code>;
}

export class Code {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="name" type="xsd:string" use="required"/> */
  readonly name: string;
  /** <xsd:attribute name="isCodable" type="xsd:boolean" use="required"/> */
  readonly isCodable: boolean;
  /** <xsd:attribute name="color" type="RGBType"/> */
  readonly color?: RGBString;

  // #### ELEMENTS ####

  /** <xsd:element name="Description" type="xsd:string" minOccurs="0"/> */
  description?: string;
  /** <xsd:element name="NoteRef" type="NoteRefType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly noteRefs: Set<Ref>;
  /** <xsd:element name="Code" type="CodeType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly children: Set<Code>;

  /**
   * Create a Code from a JSON object.
   * @param json - The JSON object to create the Code from.
   * @returns The created Code.
   */
  static fromJson(json: CodeJson): Code {
    const result = codeJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as CodeJson;
    return new Code({
      guid: data._attributes.guid,
      name: data._attributes.name ?? "",
      isCodable: data._attributes.isCodable,
      color: data._attributes.color,
      description: data.Description,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r))),
      children: new Set(data.Code?.map((c) => Code.fromJson(c))),
    });
  }

  /**
   * Create a Code from a specification object.
   * @param spec - The specification object to create the Code from.
   */
  constructor(spec: CodeSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.isCodable = spec.isCodable;
    this.color = spec.color;
    this.description = spec.description;
    this.noteRefs = spec.noteRefs ?? new Set();
    this.children = spec.children ?? new Set();
  }

  /**
   * Convert the Code to a JSON object.
   * @returns The JSON object representing the Code.
   */
  toJson(): CodeJson {
    const guid = ensureValidGuid(this.guid, "Code.guid");
    const color = this.color ? ensureValidRgbColor(this.color) : undefined;
    const noteRefs = [...this.noteRefs].map((r) => r.toJson());
    const children = [...this.children].map((c) => c.toJson());
    return {
      _attributes: {
        guid,
        name: this.name,
        isCodable: this.isCodable,
        ...(color ? { color } : {}),
      },
      ...(this.description ? { Description: this.description } : {}),
      ...(noteRefs.length > 0 ? { NoteRef: noteRefs } : {}),
      ...(children.length > 0 ? { Code: children } : {}),
    };
  }
}
