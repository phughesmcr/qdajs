import { codingSchema } from "../../qde/schema.ts";
import type { CodingJson, GuidString } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";
import { ensureValidGuid } from "../shared/utils.ts";

export type CodingSpec = {
  guid: GuidString;
  codeRef: Ref;
  noteRefs?: Set<Ref>;
  creatingUser?: GuidString;
  creationDateTime?: Date;
};

export class Coding {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="creatingUser" type="GUIDType"/> */
  readonly creatingUser?: GuidString;
  /** <xsd:attribute name="creationDateTime" type="xsd:dateTime"/> */
  readonly creationDateTime?: Date;

  // #### ELEMENTS ####

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
    const result = codingSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as CodingJson;
    return new Coding({
      guid: data.guid,
      codeRef: Ref.fromJson(data.CodeRef),
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      creatingUser: data.creatingUser,
      creationDateTime: data.creationDateTime ? new Date(data.creationDateTime) : undefined,
    });
  }

  /**
   * Create a Coding from a specification object.
   * @param spec - The specification object to create the Coding from.
   */
  constructor(spec: CodingSpec) {
    this.guid = spec.guid;
    this.creatingUser = spec.creatingUser;
    this.creationDateTime = spec.creationDateTime;
    this.codeRef = spec.codeRef;
    this.noteRefs = spec.noteRefs ?? new Set();
  }

  /**
   * Convert the Coding to a JSON object.
   * @returns The JSON object representing the Coding.
   */
  toJson(): CodingJson {
    const guid = ensureValidGuid(this.guid, "Coding.guid");
    const creatingUser = this.creatingUser ? ensureValidGuid(this.creatingUser, "Coding.creatingUser") : undefined;
    const creationDateTime = this.creationDateTime ? this.creationDateTime.toISOString() : undefined;
    const noteRefs = [...this.noteRefs].map((r) => r.toJson());
    const codeRef = this.codeRef ? this.codeRef.toJson() : undefined;
    return {
      guid,
      ...(codeRef ? { CodeRef: codeRef } : {}),
      ...(noteRefs.length > 0 ? { NoteRef: noteRefs } : {}),
      ...(creatingUser ? { creatingUser } : {}),
      ...(creationDateTime ? { creationDateTime } : {}),
    };
  }
}
