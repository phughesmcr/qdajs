import { audioSelectionSchema } from "../../qde/schema.ts";
import type { AudioSelectionJson } from "../../qde/types.ts";
import { Coding } from "../codebook/coding.ts";
import { Ref } from "../ref/ref.ts";
import { ensureInteger, ensureValidGuid } from "../shared/utils.ts";
import { SelectionBase, type SelectionBaseSpec } from "./selection-base.ts";

export type AudioSelectionSpec = SelectionBaseSpec & {
  begin: number;
  end: number;
};

export class AudioSelection extends SelectionBase {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="begin" type="xsd:integer" use="required"/> */
  readonly begin: number;
  /** <xsd:attribute name="end" type="xsd:integer" use="required"/> */
  readonly end: number;

  /**
   * Create an AudioSelection from a JSON object.
   * @param json - The JSON object to create the AudioSelection from.
   * @returns The created AudioSelection.
   */
  static fromJson(json: AudioSelectionJson): AudioSelection {
    const result = audioSelectionSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as AudioSelectionJson;
    return new AudioSelection({
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
   * Create an AudioSelection from a specification object.
   * @param spec - The specification object to create the AudioSelection from.
   */
  constructor(spec: AudioSelectionSpec) {
    super(spec);
    this.begin = spec.begin;
    this.end = spec.end;
  }

  /**
   * Convert the AudioSelection to a JSON object.
   * @returns The JSON object representing the AudioSelection.
   */
  toJson(): AudioSelectionJson {
    return {
      guid: ensureValidGuid(this.guid, "AudioSelection.guid"),
      ...(this.name ? { name: this.name } : {}),
      ...(this.description ? { Description: this.description } : {}),
      ...(this.creatingUser ? { creatingUser: ensureValidGuid(this.creatingUser, "AudioSelection.creatingUser") } : {}),
      ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
      ...(this.modifyingUser
        ? { modifyingUser: ensureValidGuid(this.modifyingUser, "AudioSelection.modifyingUser") }
        : {}),
      ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.codings.size > 0 ? { Coding: [...this.codings].map((c) => c.toJson()) } : {}),
      begin: ensureInteger(this.begin, "AudioSelection.begin"),
      end: ensureInteger(this.end, "AudioSelection.end"),
    };
  }
}
