import { codeBookSchema } from "../../qde/schema.ts";
import type { CodebookJson } from "../../qde/types.ts";
import { CodeSet } from "../set/set.ts";
import { Code } from "./code.ts";

export interface CodebookSpec {
  codes: Set<Code>;
  sets?: Set<CodeSet>;
  origin?: string;
}

export class Codebook {
  origin?: string;

  readonly codes: Set<Code>;
  readonly sets: Set<CodeSet>;

  static fromJson(json: CodebookJson): Codebook {
    const result = codeBookSchema.safeParse(json);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    const data = result.data as unknown as CodebookJson;
    const codes = new Set(data.Codes.Code.map((c) => Code.fromJson(c)));
    const sets = new Set(data.Sets?.Set.map((s) => CodeSet.fromJson(s)) ?? []);

    return new Codebook({
      codes,
      sets,
      origin: data.origin,
    });
  }

  constructor(spec: CodebookSpec) {
    this.codes = spec.codes;
    this.sets = spec.sets ?? new Set();
    this.origin = spec.origin;
  }

  toJson(): CodebookJson {
    return {
      Codes: {
        Code: [...this.codes].map((c) => c.toJson()),
      },
      ...(this.sets.size > 0
        ? {
          Sets: {
            Set: [...this.sets].map((s) => s.toJson()),
          },
        }
        : {}),
      origin: this.origin,
    };
  }
}
