import { transcriptSelectionSchema } from "../../qde/schema.ts";
import type { TranscriptSelectionJson } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";
import { SelectionBase, type SelectionBaseSpec } from "./selection-base.ts";

type TranscriptSelectionSpec = SelectionBaseSpec & {
  fromSyncPoint?: string;
  toSyncPoint?: string;
};

export class TranscriptSelection extends SelectionBase {
  readonly fromSyncPoint?: string;
  readonly toSyncPoint?: string;

  static fromJson(json: TranscriptSelectionJson): TranscriptSelection {
    const result = transcriptSelectionSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as TranscriptSelectionJson;
    return new TranscriptSelection({
      guid: data.guid,
      name: data.name,
      description: data.Description,
      creatingUser: data.creatingUser,
      creationDateTime: data.creationDateTime ? new Date(data.creationDateTime) : undefined,
      modifyingUser: data.modifyingUser,
      modifiedDateTime: data.modifiedDateTime ? new Date(data.modifiedDateTime) : undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      fromSyncPoint: data.fromSyncPoint,
      toSyncPoint: data.toSyncPoint,
    });
  }

  constructor(spec: TranscriptSelectionSpec) {
    super(spec);
    this.fromSyncPoint = spec.fromSyncPoint;
    this.toSyncPoint = spec.toSyncPoint;
  }

  toJson(): TranscriptSelectionJson {
    return {
      guid: this.guid,
      name: this.name,
      Description: this.description,
      creatingUser: this.creatingUser,
      creationDateTime: this.creationDateTime?.toISOString(),
      modifyingUser: this.modifyingUser,
      modifiedDateTime: this.modifiedDateTime?.toISOString(),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      fromSyncPoint: this.fromSyncPoint,
      toSyncPoint: this.toSyncPoint,
    };
  }
}
