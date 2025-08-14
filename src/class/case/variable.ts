import { variableSchema } from "../../qde/schema.ts";
import type { VariableJson } from "../../qde/types.ts";
import type { VariableType } from "../../types.ts";

export class Variable {
  readonly guid: string;
  readonly name: string;
  readonly type: VariableType;
  readonly description: string;

  static fromJson(json: VariableJson): Variable {
    const result = variableSchema.safeParse(json);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return new Variable(result.data as unknown as VariableJson);
  }

  constructor(json: VariableJson) {
    this.guid = json.guid;
    this.name = json.name;
    this.type = json.typeOfVariable;
    this.description = json.Description ?? "";
  }

  toJson(): VariableJson {
    return {
      guid: this.guid,
      name: this.name,
      typeOfVariable: this.type,
      Description: this.description,
    };
  }
}
