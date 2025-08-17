import { variableValueSchema } from "../../qde/schema.ts";
import type { VariableValueJson } from "../../qde/types.ts";
import type { VariableType } from "../../types.ts";
import { Ref } from "../ref/ref.ts";
import { ensureFiniteNumber, ensureInteger, ensureValidIsoDate, ensureValidIsoDateTime } from "../shared/utils.ts";

export type TextVariableValue = { type: "Text"; value: string };
export type BooleanVariableValue = { type: "Boolean"; value: boolean };
export type IntegerVariableValue = { type: "Integer"; value: number };
export type FloatVariableValue = { type: "Float"; value: number };
export type DateVariableValue = { type: "Date"; value: string }; // YYYY-MM-DD
export type DateTimeVariableValue = { type: "DateTime"; value: string }; // ISO 8601

export type VariableValueDiscriminated =
  | TextVariableValue
  | BooleanVariableValue
  | IntegerVariableValue
  | FloatVariableValue
  | DateVariableValue
  | DateTimeVariableValue;

export type VariableValueSpec = {
  variableRef: Ref;
} & VariableValueDiscriminated;

export class VariableValue {
  // #### ELEMENTS ####

  /** <xsd:element name="VariableRef" type="VariableRefType"/> */
  readonly variableRef: Ref;
  /** <xsd:element name="TextValue" type="xsd:string" minOccurs="0"/> */
  readonly value: VariableValueDiscriminated["value"];

  /** @internal */
  readonly type: VariableType;

  /**
   * Create a VariableValue from a JSON object.
   * @param json - The JSON object to create the VariableValue from.
   * @returns The created VariableValue.
   */
  static fromJson(json: VariableValueJson): VariableValue {
    const result = variableValueSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);

    const variableRef = Ref.fromJson(result.data["VariableRef"]);

    if (result.data["TextValue"] !== undefined) {
      return new VariableValue({
        variableRef,
        value: result.data["TextValue"] as string,
        type: "Text",
      });
    } else if (result.data["BooleanValue"] !== undefined) {
      return new VariableValue({
        variableRef,
        value: result.data["BooleanValue"] as boolean,
        type: "Boolean",
      });
    } else if (result.data["IntegerValue"] !== undefined) {
      return new VariableValue({
        variableRef,
        value: result.data["IntegerValue"] as number,
        type: "Integer",
      });
    } else if (result.data["FloatValue"] !== undefined) {
      return new VariableValue({
        variableRef,
        value: result.data["FloatValue"] as number,
        type: "Float",
      });
    } else if (result.data["DateValue"] !== undefined) {
      return new VariableValue({
        variableRef,
        value: result.data["DateValue"] as string,
        type: "Date",
      });
    } else if (result.data["DateTimeValue"] !== undefined) {
      return new VariableValue({
        variableRef,
        value: result.data["DateTimeValue"] as string,
        type: "DateTime",
      });
    }

    throw new Error("Invalid variable value");
  }

  /**
   * Create a VariableValue from a specification object.
   * @param spec - The specification object to create the VariableValue from.
   */
  constructor(spec: VariableValueSpec) {
    this.variableRef = spec.variableRef;
    this.value = spec.value;
    this.type = spec.type;
  }

  /**
   * Convert the VariableValue to a JSON object.
   * @returns The JSON object representing the VariableValue.
   */
  toJson(): VariableValueJson {
    const variableRefJson = this.variableRef.toJson();
    const result = { VariableRef: variableRefJson };
    switch (this.type) {
      case "Text":
        return { ...result, TextValue: String(this.value) };
      case "Boolean":
        return { ...result, BooleanValue: !!this.value };
      case "Integer":
        return { ...result, IntegerValue: ensureInteger(this.value as number, "VariableValue.IntegerValue") };
      case "Float":
        return { ...result, FloatValue: ensureFiniteNumber(this.value as number, "VariableValue.FloatValue") };
      case "Date": {
        const date = ensureValidIsoDate(this.value as string);
        return { ...result, DateValue: date };
      }
      case "DateTime": {
        const iso = ensureValidIsoDateTime(this.value as string);
        return { ...result, DateTimeValue: iso };
      }
      default: {
        // Exhaustive check
        const neverType: never = this.type as never;
        throw new Error(`Unsupported variable value type: ${neverType as unknown as string}`);
      }
    }
  }
}
