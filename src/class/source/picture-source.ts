import { pictureSourceSchema } from "../../qde/schema.ts";
import type { PictureSourceJson } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";
import { SourceBase, type SourceBaseSpec } from "./source-base.ts";

type PictureSourceSpec = SourceBaseSpec & {
  path?: string;
  currentPath?: string;
};

export class PictureSource extends SourceBase {
  readonly path?: string;
  readonly currentPath?: string;

  static fromJson(json: PictureSourceJson): PictureSource {
    const result = pictureSourceSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as PictureSourceJson;
    return new PictureSource({
      guid: data.guid,
      name: data.name,
      description: data.Description,
      creatingUser: data.creatingUser,
      creationDateTime: data.creationDateTime ? new Date(data.creationDateTime) : undefined,
      modifyingUser: data.modifyingUser,
      modifiedDateTime: data.modifiedDateTime ? new Date(data.modifiedDateTime) : undefined,
      noteRefs: (data.NoteRef ?? []).map((r) => Ref.fromJson(r)),
      variableValues: data.VariableValue ?? [],
      path: data.path,
      currentPath: data.currentPath,
    });
  }

  constructor(spec: PictureSourceSpec) {
    super(spec);
    this.path = spec.path;
    this.currentPath = spec.currentPath;
  }

  toJson(): PictureSourceJson {
    return {
      guid: this.guid,
      name: this.name,
      Description: this.description,
      creatingUser: this.creatingUser,
      creationDateTime: this.creationDateTime?.toISOString(),
      modifyingUser: this.modifyingUser,
      modifiedDateTime: this.modifiedDateTime?.toISOString(),
      NoteRef: this.noteRefs.map((r) => r.toJson()),
      VariableValue: this.variableValues,
      path: this.path,
      currentPath: this.currentPath,
    };
  }
}
