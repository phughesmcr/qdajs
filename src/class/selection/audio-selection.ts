import { audioSelectionSchema } from "../../qde/schema.ts";
import type { AudioSelectionJson } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";
import { SelectionBase, type SelectionBaseSpec } from "./selection-base.ts";

export type AudioSelectionSpec = SelectionBaseSpec & {
  begin: number;
  end: number;
};

export class AudioSelection extends SelectionBase {
  readonly begin: number;
  readonly end: number;

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
      begin: data.begin,
      end: data.end,
    });
  }

  constructor(spec: AudioSelectionSpec) {
    super(spec);
    this.begin = spec.begin;
    this.end = spec.end;
  }

  toJson(): AudioSelectionJson {
    return {
      guid: this.guid,
      name: this.name,
      Description: this.description,
      creatingUser: this.creatingUser,
      creationDateTime: this.creationDateTime?.toISOString(),
      modifyingUser: this.modifyingUser,
      modifiedDateTime: this.modifiedDateTime?.toISOString(),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      begin: this.begin,
      end: this.end,
    };
  }
}
