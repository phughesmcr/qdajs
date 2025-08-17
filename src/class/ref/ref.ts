import { refSchema } from "../../qde/schema.ts";
import type { GuidString, RefJson } from "../../qde/types.ts";
import { ensureValidGuid } from "../shared/utils.ts";

export class Ref {
  // #### ELEMENTS ####

  /** <xsd:element name="TargetGUID" type="GUIDType"/> */
  readonly targetGUID: GuidString;

  /**
   * Create a Ref from a JSON object.
   * @param json - The JSON object to create the Ref from.
   * @returns The created Ref.
   */
  static fromJson(json: unknown): Ref {
    const result = refSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    return new Ref(result.data);
  }

  /**
   * Create a Ref from a specification object.
   * @param spec - The specification object to create the Ref from.
   */
  constructor(json: RefJson) {
    this.targetGUID = json.targetGUID;
  }

  /**
   * Convert the Ref to a JSON object.
   * @returns The JSON object representing the Ref.
   */
  toJson(): RefJson {
    return {
      targetGUID: ensureValidGuid(this.targetGUID, "Ref.targetGUID"),
    };
  }
}
