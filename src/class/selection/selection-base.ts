import type { GuidString } from "../../qde/types.ts";
import type { Coding } from "../codebook/coding.ts";
import type { Ref } from "../ref/ref.ts";

export type SelectionBaseSpec = {
  guid: GuidString;
  name?: string;
  description?: string;
  creatingUser?: GuidString;
  creationDateTime?: Date;
  modifyingUser?: GuidString;
  modifiedDateTime?: Date;
  noteRefs?: Set<Ref>;
  codings?: Set<Coding>;
};

export abstract class SelectionBase {
  // #### ATTRIBUTES ####

  /** <xsd:element name="GUID" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="name" type="xsd:string"/> */
  name?: string;
  /** <xsd:attribute name="creatingUser" type="GUIDType"/> */
  creatingUser?: GuidString;
  /** <xsd:attribute name="creationDateTime" type="xsd:dateTime"/> */
  creationDateTime?: Date;
  /** <xsd:attribute name="modifyingUser" type="GUIDType"/> */
  modifyingUser?: GuidString;
  /** <xsd:attribute name="modifiedDateTime" type="xsd:dateTime"/> */
  modifiedDateTime?: Date;

  // #### ELEMENTS ####

  /** <xsd:element name="Description" type="xsd:string" minOccurs="0"/> */
  readonly description?: string;

  /** <xsd:element name="NoteRef" type="NoteRefType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly noteRefs: Set<Ref>;

  /** <xsd:element name="Coding" type="CodingType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly codings: Set<Coding>;

  protected constructor(spec: SelectionBaseSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.creatingUser = spec.creatingUser;
    this.creationDateTime = spec.creationDateTime;
    this.modifyingUser = spec.modifyingUser;
    this.modifiedDateTime = spec.modifiedDateTime;
    this.description = spec.description;
    this.noteRefs = spec.noteRefs ?? new Set();
    this.codings = spec.codings ?? new Set();
  }
}
