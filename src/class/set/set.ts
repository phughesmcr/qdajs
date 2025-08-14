import { setSchema } from "../../qde/schema.ts";
import type { GuidString, SetJson } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";

export type SetSpec = {
  guid: GuidString;
  name: string;
  description?: string;
  memberCodes: Set<Ref>;
  memberSources: Set<Ref>;
  memberNotes: Set<Ref>;
};

export class CodeSet {
  readonly guid: GuidString;
  readonly name: string;
  readonly description?: string;
  readonly memberCodes: Set<Ref>;
  readonly memberSources: Set<Ref>;
  readonly memberNotes: Set<Ref>;

  static fromJson(json: SetJson): CodeSet {
    const result = setSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as SetJson;
    return new CodeSet({
      guid: data.guid,
      name: data.name,
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
    this.memberCodes = spec.memberCodes;
    this.memberSources = spec.memberSources;
    this.memberNotes = spec.memberNotes;
  }

  toJson(): SetJson {
    return {
      guid: this.guid,
      name: this.name,
      Description: this.description,
      ...(this.memberCodes.size > 0 ? { MemberCode: [...this.memberCodes].map((r) => r.toJson()) } : {}),
      ...(this.memberSources.size > 0 ? { MemberSource: [...this.memberSources].map((r) => r.toJson()) } : {}),
      ...(this.memberNotes.size > 0 ? { MemberNote: [...this.memberNotes].map((r) => r.toJson()) } : {}),
    };
  }
}
