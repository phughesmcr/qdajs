import { plainTextSelectionSchema } from "../../qde/schema.ts";
import type { PlainTextSelectionJson } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";
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
      noteRefs: (data.NoteRef ?? []).map((r) => Ref.fromJson(r)),
      startPosition: data.startPosition,
      endPosition: data.endPosition,
    });
  }

  constructor(spec: PlainTextSelectionSpec) {
    super(spec);
    this.startPosition = spec.startPosition;
    this.endPosition = spec.endPosition;
  }

  toJson(): PlainTextSelectionJson {
    return {
      guid: this.guid,
      name: this.name,
      Description: this.description,
      creatingUser: this.creatingUser,
      creationDateTime: this.creationDateTime?.toISOString(),
      modifyingUser: this.modifyingUser,
      modifiedDateTime: this.modifiedDateTime?.toISOString(),
      NoteRef: this.noteRefs.map((r) => r.toJson()),
      startPosition: this.startPosition,
      endPosition: this.endPosition,
    };
  }
}
