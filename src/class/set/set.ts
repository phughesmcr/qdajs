import { setJsonSchema } from "../../qde/schema.ts";
import type { GuidString, SetJson } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";
import { ensureValidGuid } from "../shared/utils.ts";

export type SetSpec = {
  guid: GuidString;
  name: string;
  description?: string;
  memberCodes?: Set<Ref>;
  memberSources?: Set<Ref>;
  memberNotes?: Set<Ref>;
};

export class CodeSet {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="name" type="xsd:string" use="required"/> */
  readonly name: string;

  // #### ELEMENTS ####

  /** <xsd:element name="Description" type="xsd:string" minOccurs="0"/> */
  readonly description?: string;
  /** <xsd:element name="MemberCode" type="CodeRefType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly memberCodes: Set<Ref>;
  /** <xsd:element name="MemberSource" type="SourceRefType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly memberSources: Set<Ref>;
  /** <xsd:element name="MemberNote" type="NoteRefType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly memberNotes: Set<Ref>;

  /**
   * Create a CodeSet from a JSON object.
   * @param json - The JSON object to create the CodeSet from.
   * @returns The created CodeSet.
   */
  static fromJson(json: SetJson): CodeSet {
    const result = setJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as SetJson;
    const attrs = data._attributes as { guid: GuidString; name: string };
    return new CodeSet({
      guid: attrs.guid,
      name: attrs.name,
      description: data.Description,
      memberCodes: new Set(data.MemberCode?.map(Ref.fromJson) ?? []),
      memberSources: new Set(data.MemberSource?.map(Ref.fromJson) ?? []),
      memberNotes: new Set(data.MemberNote?.map(Ref.fromJson) ?? []),
    });
  }

  constructor(spec: SetSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.description = spec.description;
    this.memberCodes = spec.memberCodes ?? new Set();
    this.memberSources = spec.memberSources ?? new Set();
    this.memberNotes = spec.memberNotes ?? new Set();
  }

  toJson(): SetJson {
    return {
      _attributes: {
        guid: ensureValidGuid(this.guid, "Set.guid"),
        name: this.name,
      },
      ...(this.description ? { Description: this.description } : {}),
      ...(this.memberCodes.size > 0 ? { MemberCode: [...this.memberCodes].map((r) => r.toJson()) } : {}),
      ...(this.memberSources.size > 0 ? { MemberSource: [...this.memberSources].map((r) => r.toJson()) } : {}),
      ...(this.memberNotes.size > 0 ? { MemberNote: [...this.memberNotes].map((r) => r.toJson()) } : {}),
    } as unknown as SetJson;
  }
}
