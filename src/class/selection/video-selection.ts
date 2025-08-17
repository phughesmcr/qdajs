import { videoSelectionSchema } from "../../qde/schema.ts";
import type { VideoSelectionJson } from "../../qde/types.ts";
import { Coding } from "../codebook/coding.ts";
import { Ref } from "../ref/ref.ts";
import { ensureInteger, ensureValidGuid } from "../shared/utils.ts";
import { SelectionBase, type SelectionBaseSpec } from "./selection-base.ts";

type VideoSelectionSpec = SelectionBaseSpec & {
  begin: number;
  end: number;
};

export class VideoSelection extends SelectionBase {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="begin" type="xsd:integer" use="required"/> */
  readonly begin: number;
  /** <xsd:attribute name="end" type="xsd:integer" use="required"/> */
  readonly end: number;

  /**
   * Create a VideoSelection from a JSON object.
   * @param json - The JSON object to create the VideoSelection from.
   * @returns The created VideoSelection.
   */
  static fromJson(json: VideoSelectionJson): VideoSelection {
    const result = videoSelectionSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as VideoSelectionJson;
    return new VideoSelection({
      guid: data.guid,
      name: data.name,
      description: data.Description,
      creatingUser: data.creatingUser,
      creationDateTime: data.creationDateTime ? new Date(data.creationDateTime) : undefined,
      modifyingUser: data.modifyingUser,
      modifiedDateTime: data.modifiedDateTime ? new Date(data.modifiedDateTime) : undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      codings: new Set(data.Coding?.map((c) => Coding.fromJson(c)) ?? []),
      begin: data.begin,
      end: data.end,
    });
  }

  /**
   * Create a VideoSelection from a specification object.
   * @param spec - The specification object to create the VideoSelection from.
   */
  constructor(spec: VideoSelectionSpec) {
    super(spec);
    this.begin = spec.begin;
    this.end = spec.end;
  }

  /**
   * Convert the VideoSelection to a JSON object.
   * @returns The JSON object representing the VideoSelection.
   */
  toJson(): VideoSelectionJson {
    return {
      guid: ensureValidGuid(this.guid, "VideoSelection.guid"),
      ...(this.name ? { name: this.name } : {}),
      ...(this.description ? { Description: this.description } : {}),
      ...(this.creatingUser ? { creatingUser: ensureValidGuid(this.creatingUser, "VideoSelection.creatingUser") } : {}),
      ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
      ...(this.modifyingUser
        ? { modifyingUser: ensureValidGuid(this.modifyingUser, "VideoSelection.modifyingUser") }
        : {}),
      ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.codings.size > 0 ? { Coding: [...this.codings].map((c) => c.toJson()) } : {}),
      begin: ensureInteger(this.begin, "VideoSelection.begin"),
      end: ensureInteger(this.end, "VideoSelection.end"),
    };
  }
}
