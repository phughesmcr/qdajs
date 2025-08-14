import { setSchema } from "../../qde/schema.ts";
import type { SetJson } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";

export type SetSpec = {
  guid: string;
  name: string;
  description?: string;
  memberCodes: Ref[];
  memberSources: Ref[];
  memberNotes: Ref[];
};

export class Set {
  readonly guid: string;
  readonly name: string;
  readonly description?: string;
  readonly memberCodes: Ref[];
  readonly memberSources: Ref[];
  readonly memberNotes: Ref[];

  static fromJson(json: SetJson): Set {
    const result = setSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as SetJson;
    return new Set({
      guid: data.guid,
      name: data.name,
      description: data.Description,
      memberCodes: (data.MemberCode ?? []).map(Ref.fromJson),
      memberSources: (data.MemberSource ?? []).map(Ref.fromJson),
      memberNotes: (data.MemberNote ?? []).map(Ref.fromJson),
    });
  }

  constructor(spec: SetSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.description = spec.description;
    this.memberCodes = spec.memberCodes;
    this.memberSources = spec.memberSources;
    this.memberNotes = spec.memberNotes;
  }

  toJson(): SetJson {
    return {
      guid: this.guid,
      name: this.name,
      Description: this.description,
      ...(this.memberCodes.length > 0 ? { MemberCode: this.memberCodes.map((r) => r.toJson()) } : {}),
      ...(this.memberSources.length > 0 ? { MemberSource: this.memberSources.map((r) => r.toJson()) } : {}),
      ...(this.memberNotes.length > 0 ? { MemberNote: this.memberNotes.map((r) => r.toJson()) } : {}),
    };
  }
}
