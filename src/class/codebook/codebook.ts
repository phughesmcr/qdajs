import { codeBookSchema } from "../../qde/schema.ts";
import type { CodebookJson } from "../../qde/types.ts";
import type { CodeSet } from "../set/set.ts";
import { stripUndefinedDeep } from "../shared/utils.ts";
import { Code } from "./code.ts";

export interface CodebookSpec {
  codes: Set<Code>;
  // "origin" and "sets" are contained in the Project object
}

export interface CodebookJsonOutputOpts {
  sets?: Set<CodeSet>;
  origin?: string;
}

export class Codebook {
  // #### ELEMENTS ####

  /** <xsd:element name="Codes" type="CodesType"/> */
  readonly codes: Set<Code>;

  /**
   * Create a Codebook from a JSON object.
   * @param json - The JSON object to create the Codebook from.
   * @returns The created Codebook.
   */
  static fromJson(json: CodebookJson): Codebook {
    const result = codeBookSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as CodebookJson;
    const codes = new Set(data.Codes.Code.map((c) => Code.fromJson(c)));
    return new Codebook({ codes });
  }

  /**
   * Create a Codebook from a specification object.
   * @param spec - The specification object to create the Codebook from.
   * @returns The created Codebook.
   */
  constructor(spec: CodebookSpec) {
    this.codes = spec.codes;
  }

  /**
   * Convert the Codebook to a JSON object.
   * @param opts - Optional options for the JSON output.
   * @returns The JSON object.
   */
  toJson(opts?: CodebookJsonOutputOpts): CodebookJson {
    const json: CodebookJson = {
      Codes: {
        Code: [...this.codes].map((c) => c.toJson()),
      },
      ...(opts?.sets ? { Sets: { Set: [...opts.sets].map((s) => s.toJson()) } } : {}),
      ...(opts?.origin ? { Origin: opts.origin } : {}),
    };
    return stripUndefinedDeep(json);
  }
}
