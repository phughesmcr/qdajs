import { linkSchema } from "../../qde/schema.ts";
import type { GuidString, LinkJson, RGBString } from "../../qde/types.ts";
import type { LinkDirection } from "../../types.ts";
import { Ref } from "../ref/ref.ts";

export type LinkSpec = {
  guid: GuidString;
  name?: string;
  direction?: LinkDirection;
  color?: RGBString;
  originGUID?: GuidString;
  targetGUID?: GuidString;
  noteRefs: Set<Ref>;
};

export class Link {
  readonly guid: GuidString;
  readonly name?: string;
  readonly direction?: LinkDirection;
  readonly color?: RGBString;
  readonly originGUID?: GuidString;
  readonly targetGUID?: GuidString;
  readonly noteRefs: Set<Ref>;

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

  constructor(spec: LinkSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.direction = spec.direction;
    this.color = spec.color;
    this.originGUID = spec.originGUID;
    this.targetGUID = spec.targetGUID;
    this.noteRefs = spec.noteRefs;
  }

  toJson(): LinkJson {
    return {
      guid: this.guid,
      name: this.name,
      direction: this.direction,
      color: this.color,
      originGUID: this.originGUID,
      targetGUID: this.targetGUID,
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((ref) => ref.toJson()) } : {}),
    };
  }
}
