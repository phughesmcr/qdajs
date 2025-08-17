import { plainTextSelectionSchema } from "../../qde/schema.ts";
import type { PlainTextSelectionJson } from "../../qde/types.ts";
import { Coding } from "../codebook/coding.ts";
import { Ref } from "../ref/ref.ts";
import { ensureInteger, ensureValidGuid } from "../shared/utils.ts";
import { SelectionBase, type SelectionBaseSpec } from "./selection-base.ts";

type PlainTextSelectionSpec = SelectionBaseSpec & {
  startPosition: number;
  endPosition: number;
};

export class PlainTextSelection extends SelectionBase {
  readonly startPosition: number;
  readonly endPosition: number;

  static fromJson(json: PlainTextSelectionJson): PlainTextSelection {
    const result = plainTextSelectionSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as PlainTextSelectionJson;
    return new PlainTextSelection({
      guid: data.guid,
      name: data.name,
      description: data.Description,
      creatingUser: data.creatingUser,
      creationDateTime: data.creationDateTime ? new Date(data.creationDateTime) : undefined,
      modifyingUser: data.modifyingUser,
      modifiedDateTime: data.modifiedDateTime ? new Date(data.modifiedDateTime) : undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      codings: new Set(data.Coding?.map((c) => Coding.fromJson(c)) ?? []),
      startPosition: data.startPosition,
      endPosition: data.endPosition,
    });
  }

  /**
   * Create a PlainTextSelection from a specification object.
   * @param spec - The specification object to create the PlainTextSelection from.
   */
  constructor(spec: PlainTextSelectionSpec) {
    super(spec);
    this.startPosition = spec.startPosition;
    this.endPosition = spec.endPosition;
  }

  /**
   * Convert the PlainTextSelection to a JSON object.
   * @returns The JSON object representing the PlainTextSelection.
   */
  toJson(): PlainTextSelectionJson {
    const json: PlainTextSelectionJson = {
      guid: ensureValidGuid(this.guid, "PlainTextSelection.guid"),
      ...(this.name ? { name: this.name } : {}),
      ...(this.creatingUser
        ? { creatingUser: ensureValidGuid(this.creatingUser, "PlainTextSelection.creatingUser") }
        : {}),
      ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
      ...(this.modifyingUser
        ? { modifyingUser: ensureValidGuid(this.modifyingUser, "PlainTextSelection.modifyingUser") }
        : {}),
      ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
      ...(this.description ? { Description: this.description } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.codings.size > 0 ? { Coding: [...this.codings].map((c) => c.toJson()) } : {}),

      startPosition: ensureInteger(this.startPosition, "PlainTextSelection.startPosition"),
      endPosition: ensureInteger(this.endPosition, "PlainTextSelection.endPosition"),
    };
    return json;
  }
}
