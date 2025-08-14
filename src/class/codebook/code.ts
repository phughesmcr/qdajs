import { codeSchema } from "../../qde/schema.ts";
import type { CodeJson, RGBString } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";

export interface CodeSpec {
  readonly guid: string;
  readonly name: string;
  readonly isCodable: boolean;
  readonly color: RGBString | undefined;
  readonly description: string | undefined;
  readonly noteRefs: Ref[] | undefined;
  readonly codeRefs: Code[] | undefined;
}

export class Code {
  readonly guid: string;
  readonly name: string;
  readonly isCodable: boolean;
  readonly color: string | undefined;

  readonly description: string | undefined;
  readonly noteRefs: Ref[] | undefined;
  readonly codeRefs: Code[] | undefined;

  static fromJson(json: CodeJson): Code {
    const result = codeSchema.safeParse(json);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    const data = result.data as unknown as CodeJson;
    return new Code({
      guid: data._attributes.guid,
      name: data._attributes.name,
      isCodable: data._attributes.isCodable,
      color: data._attributes.color,
      description: data.Description,
      noteRefs: data.NoteRef?.map((r) => Ref.fromJson(r)),
      codeRefs: data.Code?.map((c) => Code.fromJson(c)),
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
    return {
      _attributes: {
        guid: this.guid,
        name: this.name,
        isCodable: this.isCodable,
        color: this.color,
      },
      Description: this.description,
      NoteRef: this.noteRefs?.map((r) => r.toJson()),
      Code: this.codeRefs?.map((c) => c.toJson()),
    };
  }
}
