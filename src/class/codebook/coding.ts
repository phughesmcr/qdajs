import { codingJsonSchema } from "../../qde/schema.ts";
import type { CodingJson, GuidString } from "../../qde/types.ts";
import { ensureValidGuid } from "../../utils.ts";
import { Ref } from "../ref/ref.ts";

export type CodingSpec = {
  guid: GuidString;
  codeRef: Ref;
  noteRefs?: Set<Ref>;
  creatingUser?: GuidString;
  creationDateTime?: Date;
};

export class Coding {
  readonly _attributes: {
    /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
    guid: GuidString;
    /** <xsd:attribute name="creatingUser" type="GUIDType"/> */
    creatingUser?: GuidString;
    /** <xsd:attribute name="creationDateTime" type="xsd:dateTime"/> */
    creationDateTime?: Date;
  };

  /** <xsd:element name="CodeRef" type="CodeRefType"/> */
  readonly codeRef: Ref;
  /** <xsd:element name="NoteRef" type="NoteRefType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly noteRefs: Set<Ref>;

  /**
   * Create a Coding from a JSON object.
   * @param json - The JSON object to create the Coding from.
   * @returns The created Coding.
   */
  static fromJson(json: CodingJson): Coding {
    const result = codingJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as CodingJson;
    const attrs = data._attributes as {
      guid: GuidString;
      creatingUser?: GuidString;
      creationDateTime?: string;
    };
    return new Coding({
      guid: attrs.guid,
      codeRef: Ref.fromJson(data.CodeRef),
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      creatingUser: attrs.creatingUser,
      creationDateTime: attrs.creationDateTime ? new Date(attrs.creationDateTime) : undefined,
    });
  }

  /**
   * Create a Coding from a specification object.
   * @param spec - The specification object to create the Coding from.
   */
  constructor(spec: CodingSpec) {
    this._attributes = {
      guid: spec.guid,
      creatingUser: spec.creatingUser,
      creationDateTime: spec.creationDateTime,
    };
    this.codeRef = spec.codeRef;
    this.noteRefs = spec.noteRefs ?? new Set();
  }

  /**
   * Convert the Coding to a JSON object.
   * @returns The JSON object representing the Coding.
   */
  toJson(): CodingJson {
    ensureValidGuid(this._attributes.guid, "Coding.guid");
    const creatingUser = this._attributes.creatingUser
      ? ensureValidGuid(this._attributes.creatingUser, "Coding.creatingUser")
      : undefined;
    const creationDateTime = this._attributes.creationDateTime
      ? this._attributes.creationDateTime.toISOString()
      : undefined;
    const noteRefs = [...this.noteRefs].map((r) => r.toJson());
    const codeRef = this.codeRef ? this.codeRef.toJson() : undefined;
    return {
      _attributes: {
        guid: this._attributes.guid,
        ...(creatingUser ? { creatingUser } : {}),
        ...(creationDateTime ? { creationDateTime } : {}),
      },
      ...(codeRef ? { CodeRef: codeRef } : {}),
      ...(noteRefs.length > 0 ? { NoteRef: noteRefs } : {}),
    };
  }
}
