import { variableValueSchema } from "../../qde/schema.ts";
import type { VariableValueJson } from "../../qde/types.ts";
import type { VariableType } from "../../types.ts";
import { Ref } from "../ref/ref.ts";

export type VariableValueType = string | boolean | number | Date;

export type VariableValueSpec<T extends VariableValueType> = {
  variableRef: Ref;
  value: T;
  type: VariableType;
};

export class VariableValue<T extends VariableValueType> {
  readonly variableRef: Ref;
  readonly value: T;
  readonly type: VariableType;

  static fromJson<T extends VariableValueType>(json: VariableValueJson): VariableValue<T> {
    const result = variableValueSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);

    const variableRef = Ref.fromJson(result.data["VariableRef"]);

    if (result.data["TextValue"] !== undefined) {
      return new VariableValue<T>({
        variableRef,
        value: result.data["TextValue"] as T,
        type: "Text",
      });
    } else if (result.data["BooleanValue"] !== undefined) {
      return new VariableValue<T>({
        variableRef,
        value: result.data["BooleanValue"] as T,
        type: "Boolean",
      });
    } else if (result.data["IntegerValue"] !== undefined) {
      return new VariableValue<T>({
        variableRef,
        value: result.data["IntegerValue"] as T,
        type: "Integer",
      });
    } else if (result.data["FloatValue"] !== undefined) {
      return new VariableValue<T>({
        variableRef,
        value: result.data["FloatValue"] as T,
        type: "Float",
      });
    } else if (result.data["DateValue"] !== undefined) {
      return new VariableValue<T>({
        variableRef,
        value: result.data["DateValue"] as T,
        type: "Date",
      });
    } else if (result.data["DateTimeValue"] !== undefined) {
      return new VariableValue<T>({
        variableRef,
        value: result.data["DateTimeValue"] as T,
        type: "DateTime",
      });
    }

    throw new Error("Invalid variable value");
  }

  constructor(spec: VariableValueSpec<T>) {
    this.variableRef = spec.variableRef;
    this.value = spec.value;
    this.type = spec.type;
  }

  toJson(): VariableValueJson {
    const variableRefJson = this.variableRef.toJson();
    switch (this.type) {
      case "Text":
        return { VariableRef: variableRefJson, TextValue: this.value as unknown as string };
      case "Boolean":
        return { VariableRef: variableRefJson, BooleanValue: this.value as unknown as boolean };
      case "Integer":
        return { VariableRef: variableRefJson, IntegerValue: this.value as unknown as number };
      case "Float":
        return { VariableRef: variableRefJson, FloatValue: this.value as unknown as number };
      case "Date":
        return { VariableRef: variableRefJson, DateValue: this.value as unknown as string };
      case "DateTime":
        return { VariableRef: variableRefJson, DateTimeValue: this.value as unknown as string };
      default: {
        // Exhaustive check
        const neverType: never = this.type;
        throw new Error(`Unsupported variable value type: ${neverType}`);
      }
    }
  }
}
