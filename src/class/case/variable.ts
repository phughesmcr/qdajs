import { variableSchema } from "../../qde/schema.ts";
import type { GuidString, VariableJson } from "../../qde/types.ts";
import type { VariableType } from "../../types.ts";

export type VariableSpec = {
  guid: GuidString;
  name: string;
  type: VariableType;
  description?: string;
};

export class Variable {
  readonly guid: GuidString;
  readonly name: string;
  readonly type: VariableType;
  readonly description?: string;

  static fromJson(json: VariableJson): Variable {
    const result = variableSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as VariableJson;
    return new Variable({
      guid: data.guid,
      name: data.name,
      type: data.typeOfVariable,
      description: data.Description,
    });
  }

  constructor(spec: VariableSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.type = spec.type;
    this.description = spec.description;
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
