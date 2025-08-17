import { transcriptSelectionSchema } from "../../qde/schema.ts";
import type { GuidString, TranscriptSelectionJson } from "../../qde/types.ts";
import { Coding } from "../codebook/coding.ts";
import { Ref } from "../ref/ref.ts";
import { ensureValidGuid } from "../shared/utils.ts";
import { SelectionBase, type SelectionBaseSpec } from "./selection-base.ts";

type TranscriptSelectionSpec = SelectionBaseSpec & {
  fromSyncPoint?: GuidString;
  toSyncPoint?: GuidString;
};

export class TranscriptSelection extends SelectionBase {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="fromSyncPoint" type="GUIDType"/> */
  readonly fromSyncPoint?: GuidString;
  /** <xsd:attribute name="toSyncPoint" type="GUIDType"/> */
  readonly toSyncPoint?: GuidString;

  /**
   * Create a TranscriptSelection from a JSON object.
   * @param json - The JSON object to create the TranscriptSelection from.
   * @returns The created TranscriptSelection.
   */
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
      codings: new Set(data.Coding?.map((c) => Coding.fromJson(c)) ?? []),
      fromSyncPoint: data.fromSyncPoint,
      toSyncPoint: data.toSyncPoint,
    });
  }

  /**
   * Create a TranscriptSelection from a specification object.
   * @param spec - The specification object to create the TranscriptSelection from.
   */
  constructor(spec: TranscriptSelectionSpec) {
    super(spec);
    this.fromSyncPoint = spec.fromSyncPoint;
    this.toSyncPoint = spec.toSyncPoint;
  }

  /**
   * Convert the TranscriptSelection to a JSON object.
   * @returns The JSON object representing the TranscriptSelection.
   */
  toJson(): TranscriptSelectionJson {
    const json: TranscriptSelectionJson = {
      guid: ensureValidGuid(this.guid, "TranscriptSelection.guid"),
      ...(this.name ? { name: this.name } : {}),
      ...(this.description ? { Description: this.description } : {}),
      ...(this.creatingUser
        ? { creatingUser: ensureValidGuid(this.creatingUser, "TranscriptSelection.creatingUser") }
        : {}),
      ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
      ...(this.modifyingUser
        ? { modifyingUser: ensureValidGuid(this.modifyingUser, "TranscriptSelection.modifyingUser") }
        : {}),
      ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.codings.size > 0 ? { Coding: [...this.codings].map((c) => c.toJson()) } : {}),
      ...(this.fromSyncPoint
        ? { fromSyncPoint: ensureValidGuid(this.fromSyncPoint, "TranscriptSelection.fromSyncPoint") }
        : {}),
      ...(this.toSyncPoint
        ? { toSyncPoint: ensureValidGuid(this.toSyncPoint, "TranscriptSelection.toSyncPoint") }
        : {}),
    };
    return json;
  }
}
