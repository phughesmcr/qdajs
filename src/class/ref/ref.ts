import { refSchema } from "../../qde/schema.ts";
import type { RefJson } from "../../qde/types.ts";

export class Ref {
  readonly targetGUID: string;

  static fromJson(json: unknown): Ref {
    const result = refSchema.safeParse(json);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return new Ref(result.data);
  }

  constructor(json: RefJson) {
    this.targetGUID = json.targetGUID;
  }

  toJson(): RefJson {
    return {
      targetGUID: this.targetGUID,
    };
  }
}
