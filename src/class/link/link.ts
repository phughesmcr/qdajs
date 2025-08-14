import { linkSchema } from "../../qde/schema.ts";
import type { LinkJson } from "../../qde/types.ts";
import type { LinkDirection } from "../../types.ts";
import { Ref } from "../ref/ref.ts";

export type LinkSpec = {
  guid: string;
  name: string;
  direction: LinkDirection;
  color?: string;
  originGUID?: string;
  targetGUID?: string;
  noteRefs: Ref[];
};

export class Link {
  readonly guid: string;
  readonly name: string;
  readonly direction: LinkDirection;
  readonly color?: string;
  readonly originGUID?: string;
  readonly targetGUID?: string;
  readonly noteRefs: Ref[];

  static fromJson(json: LinkJson): Link {
    const result = linkSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);

    const {
      guid,
      name = "",
      direction = "Associative" as LinkDirection,
      color,
      originGUID,
      targetGUID,
      NoteRef,
    } = result.data as unknown as LinkJson;

    const noteRefs = NoteRef?.map((ref) => Ref.fromJson(ref)) ?? [];

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
    this.name = spec.name ?? "";
    this.direction = spec.direction ?? "Associative";
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
      NoteRef: this.noteRefs.map((ref) => ref.toJson()),
    };
  }
}
