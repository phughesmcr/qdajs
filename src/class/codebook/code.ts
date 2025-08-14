import { codeSchema } from "../../qde/schema.ts";
import type { CodeJson, GuidString, RGBString } from "../../qde/types.ts";
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
  name: string;
  isCodable: boolean;
  color?: RGBString;
  description?: string;

  readonly guid: GuidString;
  readonly noteRefs?: Set<Ref>;
  readonly children?: Set<Code>;

  static fromJson(json: CodeJson): Code {
    const result = codeSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as CodeJson;
    return new Code({
      guid: data._attributes.guid,
      name: data._attributes.name,
      isCodable: data._attributes.isCodable,
      color: data._attributes.color,
      description: data.Description,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r))),
      children: new Set(data.Code?.map((c) => Code.fromJson(c))),
    });
  }

  constructor(spec: CodeSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.isCodable = spec.isCodable;
    this.color = spec.color;
    this.description = spec.description;
    this.noteRefs = spec.noteRefs;
    this.children = spec.children;
  }

  toJson(): CodeJson {
    const noteRefs = this.noteRefs ? [...this.noteRefs].map((r) => r.toJson()) : [];
    const children = this.children ? [...this.children].map((c) => c.toJson()) : [];
    return {
      _attributes: {
        guid: this.guid,
        name: this.name,
        isCodable: this.isCodable,
        color: this.color,
      },
      Description: this.description,
      ...(noteRefs.length > 0 ? { NoteRef: noteRefs } : {}),
      ...(children.length > 0 ? { Code: children } : {}),
    };
  }
}
