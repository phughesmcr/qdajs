import { linkSchema } from "../../qde/schema.ts";
import type { GuidString, LinkJson, RGBString } from "../../qde/types.ts";
import type { Direction } from "../../types.ts";
import { Ref } from "../ref/ref.ts";
import { ensureValidGuid, ensureValidRgbColor } from "../shared/utils.ts";

export type LinkSpec = {
  guid: GuidString;
  name?: string;
  direction?: Direction;
  color?: RGBString;
  originGUID?: GuidString;
  targetGUID?: GuidString;
  noteRefs?: Set<Ref>;
};

export class Link {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="name" type="xsd:string"/> */
  name?: string;
  /** <xsd:attribute name="direction" type="directionType"/> */
  readonly direction?: Direction;
  /** <xsd:attribute name="color" type="RGBType"/> */
  readonly color?: RGBString;
  /** <xsd:attribute name="originGUID" type="GUIDType"/> */
  readonly originGUID?: GuidString;
  /** <xsd:attribute name="targetGUID" type="GUIDType"/> */
  readonly targetGUID?: GuidString;

  // #### ELEMENTS ####

  /** <xsd:element name="NoteRef" type="NoteRefType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly noteRefs: Set<Ref>;

  /**
   * Create a Link from a JSON object.
   * @param json - The JSON object to create the Link from.
   * @returns The created Link.
   */
  static fromJson(json: LinkJson): Link {
    const result = linkSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);

    const {
      guid,
      name,
      direction,
      color,
      originGUID,
      targetGUID,
      NoteRef,
    } = result.data as unknown as LinkJson;

    const noteRefs = new Set(NoteRef?.map((ref) => Ref.fromJson(ref)) ?? []);

    return new Link({
      guid,
      name,
      direction,
      color,
      originGUID,
      targetGUID,
      noteRefs,
    });
  }

  /**
   * Create a Link from a specification object.
   * @param spec - The specification object to create the Link from.
   */
  constructor(spec: LinkSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.direction = spec.direction;
    this.color = spec.color;
    this.originGUID = spec.originGUID;
    this.targetGUID = spec.targetGUID;
    this.noteRefs = spec.noteRefs ?? new Set();
  }

  /**
   * Convert the Link to a JSON object.
   * @returns The JSON object representing the Link.
   */
  toJson(): LinkJson {
    const guid = ensureValidGuid(this.guid, "Link.guid");
    const color = this.color ? ensureValidRgbColor(this.color) : undefined;
    const originGUID = this.originGUID ? ensureValidGuid(this.originGUID, "Link.originGUID") : undefined;
    const targetGUID = this.targetGUID ? ensureValidGuid(this.targetGUID, "Link.targetGUID") : undefined;
    const noteRefs = [...this.noteRefs].map((ref) => ref.toJson());

    return {
      guid,
      ...(this.name ? { name: this.name } : {}),
      ...(this.direction ? { direction: this.direction } : {}),
      ...(color ? { color } : {}),
      ...(originGUID ? { originGUID } : {}),
      ...(targetGUID ? { targetGUID } : {}),
      ...(noteRefs.length > 0 ? { NoteRef: noteRefs } : {}),
    };
  }
}
