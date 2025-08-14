import { codeBookSchema } from "../../qde/schema.ts";
import type { CodebookJson } from "../../qde/types.ts";
import { Set } from "../set/set.ts";
import { Code } from "./code.ts";

export interface CodebookSpec {
  readonly codes: Code[];
  readonly sets: Set[];
  readonly origin: string | undefined;
}

export class Codebook {
  readonly codes: Code[];
  readonly sets: Set[];
  readonly origin: string | undefined;

  static fromJson(json: CodebookJson): Codebook {
    const result = codeBookSchema.safeParse(json);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    const data = result.data as unknown as CodebookJson;
    return new Codebook({
      codes: data.Codes.Code.map((c) => Code.fromJson(c)),
      sets: data.Sets?.Set.map((s) => Set.fromJson(s)) ?? [],
      origin: data.origin,
    });
  }

  constructor(spec: CodebookSpec) {
    this.codes = spec.codes;
    this.sets = spec.sets;
    this.origin = spec.origin;
  }

  toJson(): CodebookJson {
    return {
      Codes: {
        Code: this.codes.map((c) => c.toJson()),
      },
      ...(this.sets.length > 0
        ? {
          Sets: {
            Set: this.sets.map((s) => s.toJson()),
          },
        }
        : {}),
      origin: this.origin,
    };
  }
}
