import { textSourceSchema } from "../../qde/schema.ts";
import type { TextSourceJson } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";
import { SourceBase, type SourceBaseSpec } from "./source-base.ts";

type TextSourceSpec = SourceBaseSpec & {
  richTextPath?: string;
  plainTextPath?: string;
  plainTextContent?: string;
};

export class TextSource extends SourceBase {
  readonly richTextPath?: string;
  readonly plainTextPath?: string;
  readonly plainTextContent?: string;

  static fromJson(json: TextSourceJson): TextSource {
    const result = textSourceSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as TextSourceJson;
    return new TextSource({
      guid: data.guid,
      name: data.name,
      description: data.Description,
      creatingUser: data.creatingUser,
      creationDateTime: data.creationDateTime ? new Date(data.creationDateTime) : undefined,
      modifyingUser: data.modifyingUser,
      modifiedDateTime: data.modifiedDateTime ? new Date(data.modifiedDateTime) : undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      variableValues: new Set(data.VariableValue ?? []),
      richTextPath: data.richTextPath,
      plainTextPath: data.plainTextPath,
      plainTextContent: data.PlainTextContent,
    });
  }

  constructor(spec: TextSourceSpec) {
    super(spec);
    this.richTextPath = spec.richTextPath;
    this.plainTextPath = spec.plainTextPath;
    this.plainTextContent = spec.plainTextContent;
  }

  toJson(): TextSourceJson {
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
      richTextPath: this.richTextPath,
      plainTextPath: this.plainTextPath,
      PlainTextContent: this.plainTextContent,
    };
  }
}
