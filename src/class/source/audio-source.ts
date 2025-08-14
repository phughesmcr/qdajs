import { audioSourceSchema } from "../../qde/schema.ts";
import type { AudioSourceJson } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";
import { SourceBase, type SourceBaseSpec } from "./source-base.ts";

type AudioSourceSpec = SourceBaseSpec & {
  path?: string;
  currentPath?: string;
};

export class AudioSource extends SourceBase {
  readonly path?: string;
  readonly currentPath?: string;

  static fromJson(json: AudioSourceJson): AudioSource {
    const result = audioSourceSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as AudioSourceJson;
    return new AudioSource({
      guid: data.guid,
      name: data.name,
      description: data.Description,
      creatingUser: data.creatingUser,
      creationDateTime: data.creationDateTime ? new Date(data.creationDateTime) : undefined,
      modifyingUser: data.modifyingUser,
      modifiedDateTime: data.modifiedDateTime ? new Date(data.modifiedDateTime) : undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      variableValues: new Set(data.VariableValue ?? []),
      path: data.path,
      currentPath: data.currentPath,
    });
  }

  constructor(spec: AudioSourceSpec) {
    super(spec);
    this.path = spec.path;
    this.currentPath = spec.currentPath;
  }

  toJson(): AudioSourceJson {
    return {
      guid: this.guid,
      name: this.name,
      Description: this.description,
      creatingUser: this.creatingUser,
      creationDateTime: this.creationDateTime?.toISOString(),
      modifyingUser: this.modifyingUser,
      modifiedDateTime: this.modifiedDateTime?.toISOString(),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.variableValues.size > 0 ? { VariableValue: [...this.variableValues] } : {}),
      path: this.path,
      currentPath: this.currentPath,
    };
  }
}
