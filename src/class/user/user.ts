import { userSchema } from "../../qde/schema.ts";
import type { GuidString, UserJson } from "../../qde/types.ts";

export type UserSpec = {
  guid: GuidString;
  name?: string;
  id?: string;
};

export class User {
  name?: string;
  id?: string;

  readonly guid: GuidString;

  static fromJson(json: UserJson): User {
    const result = userSchema.safeParse(json);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    const data = result.data as unknown as UserJson;
    return new User({
      guid: data.guid,
      name: data.name,
      id: data.id,
    });
  }

  constructor(spec: UserSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.id = spec.id;
  }

  toJson(): UserJson {
    return {
      guid: this.guid,
      name: this.name,
      id: this.id,
    };
  }
}
