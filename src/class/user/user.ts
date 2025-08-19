import { userJsonSchema } from "../../qde/schema.ts";
import type { GuidString, UserJson } from "../../qde/types.ts";
import { ensureValidGuid } from "../../utils.ts";

export type UserSpec = {
  guid: GuidString;
  name?: string;
  id?: string;
};

export class User {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="name" type="xsd:string"/> */
  name?: string;
  /** <xsd:attribute name="id" type="xsd:string"/> */
  id?: string;

  /**
   * Create a User from a JSON object.
   * @param json - The JSON object to create the User from.
   * @returns The created User.
   */
  static fromJson(json: UserJson): User {
    const result = userJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as UserJson;
    const attrs = data._attributes as { guid: GuidString; name?: string; id?: string };
    return new User({
      guid: attrs.guid,
      name: attrs.name,
      id: attrs.id,
    });
  }

  /**
   * Create a User from a specification object.
   * @param spec - The specification object to create the User from.
   */
  constructor(spec: UserSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.id = spec.id;
  }

  /**
   * Convert the User to a JSON object.
   * @returns The JSON object representing the User.
   */
  toJson(): UserJson {
    return {
      _attributes: {
        guid: ensureValidGuid(this.guid, "User.guid"),
        ...(this.name ? { name: this.name } : {}),
        ...(this.id ? { id: this.id } : {}),
      },
    } as unknown as UserJson;
  }
}
