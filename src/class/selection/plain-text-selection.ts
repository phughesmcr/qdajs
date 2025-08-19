import { plainTextSelectionJsonSchema } from "../../qde/schema.ts";
import type { PlainTextSelectionJson } from "../../qde/types.ts";
import { Coding } from "../codebook/coding.ts";
import { Ref } from "../ref/ref.ts";
import { ensureInteger, ensureValidGuid } from "../../utils.ts";
import { SelectionBase, type SelectionBaseSpec } from "./selection-base.ts";

type PlainTextSelectionSpec = SelectionBaseSpec & {
  startPosition: number;
  endPosition: number;
};

export class PlainTextSelection extends SelectionBase {
  readonly startPosition: number;
  readonly endPosition: number;

  static fromJson(json: PlainTextSelectionJson): PlainTextSelection {
    const result = plainTextSelectionJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as PlainTextSelectionJson;
    const attrs = data._attributes as {
      guid: string;
      name?: string;
      creatingUser?: string;
      creationDateTime?: string;
      modifyingUser?: string;
      modifiedDateTime?: string;
      startPosition: number;
      endPosition: number;
    };
    return new PlainTextSelection({
      guid: attrs.guid,
      name: attrs.name,
      description: data.Description,
      creatingUser: attrs.creatingUser,
      creationDateTime: attrs.creationDateTime ? new Date(attrs.creationDateTime) : undefined,
      modifyingUser: attrs.modifyingUser,
      modifiedDateTime: attrs.modifiedDateTime ? new Date(attrs.modifiedDateTime) : undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      codings: new Set(data.Coding?.map((c) => Coding.fromJson(c)) ?? []),
      startPosition: attrs.startPosition,
      endPosition: attrs.endPosition,
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
      _attributes: {
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
        startPosition: ensureInteger(this.startPosition, "PlainTextSelection.startPosition"),
        endPosition: ensureInteger(this.endPosition, "PlainTextSelection.endPosition"),
      },
      ...(this.description ? { Description: this.description } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.codings.size > 0 ? { Coding: [...this.codings].map((c) => c.toJson()) } : {}),
    } as unknown as PlainTextSelectionJson;
    return json;
  }
}
