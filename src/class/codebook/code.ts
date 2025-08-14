import { codeSchema } from "../../qde/schema.ts";
import type { CodeJson, GuidString, RGBString } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";

export interface CodeSpec {
  readonly guid: GuidString;
  readonly name: string;
  readonly isCodable: boolean;
  readonly color?: RGBString;
  readonly description?: string;
  readonly noteRefs?: Set<Ref>;
  readonly codeRefs?: Set<Code>;
}

export class Code {
  readonly guid: GuidString;
  readonly name: string;
  readonly isCodable: boolean;
  readonly color?: RGBString;
  readonly description?: string;
  readonly noteRefs?: Set<Ref>;
  readonly codeRefs?: Set<Code>;

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
      codeRefs: new Set(data.Code?.map((c) => Code.fromJson(c))),
    });
  }

  constructor(spec: CodeSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.isCodable = spec.isCodable;
    this.color = spec.color;
    this.description = spec.description;
    this.noteRefs = spec.noteRefs;
    this.codeRefs = spec.codeRefs;
  }

  toJson(): CodeJson {
    const noteRefs = this.noteRefs ? [...this.noteRefs].map((r) => r.toJson()) : [];
    const codeRefs = this.codeRefs ? [...this.codeRefs].map((c) => c.toJson()) : [];
    return {
      _attributes: {
        guid: this.guid,
        name: this.name,
        isCodable: this.isCodable,
        color: this.color,
      },
      Description: this.description,
      ...(noteRefs.length > 0 ? { NoteRef: noteRefs } : {}),
      ...(codeRefs.length > 0 ? { Code: codeRefs } : {}),
    };
  }
}
