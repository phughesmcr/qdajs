import { variableSchema } from "../../qde/schema.ts";
import type { GuidString, VariableJson } from "../../qde/types.ts";
import type { VariableType } from "../../types.ts";
import { ensureValidGuid } from "../shared/utils.ts";

export type VariableSpec = {
  guid: GuidString;
  name: string;
  type: VariableType;
  description?: string;
};

export class Variable {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="name" type="xsd:string" use="required"/> */
  readonly name: string;
  /** <xsd:attribute name="typeOfVariable" type="typeOfVariableType" use="required"/> */
  readonly type: VariableType;

  // #### ELEMENTS ####

  /** <xsd:element name="Description" type="xsd:string" minOccurs="0"/> */
  readonly description?: string;

  /**
   * Create a Variable from a JSON object.
   * @param json - The JSON object to create the Variable from.
   * @returns The created Variable.
   */
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

  /**
   * Create a Variable from a specification object.
   * @param spec - The specification object to create the Variable from.
   */
  constructor(spec: VariableSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.type = spec.type;
    this.description = spec.description;
  }

  /**
   * Convert the Variable to a JSON object.
   * @returns The JSON object representing the Variable.
   */
  toJson(): VariableJson {
    return {
      guid: ensureValidGuid(this.guid, "Variable.guid"),
      name: this.name,
      typeOfVariable: this.type,
      ...(this.description ? { Description: this.description } : {}),
    };
  }
}
