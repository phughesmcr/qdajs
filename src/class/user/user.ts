import { userSchema } from "../../qde/schema.ts";
import type { GuidString, UserJson } from "../../qde/types.ts";

export class User {
  readonly guid: GuidString;
  readonly name: string;
  readonly id: string;

  static fromJson(json: UserJson): User {
    const result = userSchema.safeParse(json);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return new User(result.data as unknown as UserJson);
  }

  constructor(json: UserJson) {
    this.guid = json.guid;
    this.name = json.name ?? "";
    this.id = json.id ?? "";
  }

  toJson(): UserJson {
    return {
      guid: this.guid,
      name: this.name,
      id: this.id,
    };
  }
}
