import { transcriptSchema } from "../../qde/schema.ts";
import type { SyncPointJson, TranscriptJson, TranscriptSelectionJson } from "../../qde/types.ts";
import type { HasNoteRefs } from "../index.ts";
import { Ref } from "../ref/ref.ts";
import type { Auditable, Described, Identifiable, Named } from "../shared/interfaces.ts";

export type TranscriptSpec =
  & Identifiable
  & Partial<Named & Described & Auditable>
  & HasNoteRefs
  & {
    syncPoints: Set<SyncPointJson>;
    selections: Set<TranscriptSelectionJson>;
    plainTextPath?: string;
    richTextPath?: string;
    plainTextContent?: string;
  };

export class Transcript implements Identifiable, Partial<Named>, Partial<Described> {
  readonly guid: string;
  readonly name?: string;
  readonly description?: string;
  readonly creatingUser?: string;
  readonly creationDateTime?: Date;
  readonly modifyingUser?: string;
  readonly modifiedDateTime?: Date;
  readonly noteRefs: Set<Ref>;
  readonly syncPoints: Set<SyncPointJson>;
  readonly selections: Set<TranscriptSelectionJson>;
  readonly plainTextPath?: string;
  readonly richTextPath?: string;
  readonly plainTextContent?: string;

  static fromJson(json: TranscriptJson): Transcript {
    const result = transcriptSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as TranscriptJson;
    return new Transcript({
      guid: data.guid,
      name: data.name,
      description: data.Description,
      creatingUser: data.creatingUser,
      creationDateTime: data.creationDateTime ? new Date(data.creationDateTime) : undefined,
      modifyingUser: data.modifyingUser,
      modifiedDateTime: data.modifiedDateTime ? new Date(data.modifiedDateTime) : undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      syncPoints: new Set(data.SyncPoint ?? []),
      selections: new Set(data.TranscriptSelection ?? []),
      plainTextPath: data.plainTextPath,
      richTextPath: data.richTextPath,
      plainTextContent: data.PlainTextContent,
    });
  }

  constructor(spec: TranscriptSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.description = spec.description;
    this.creatingUser = spec.creatingUser;
    this.creationDateTime = spec.creationDateTime;
    this.modifyingUser = spec.modifyingUser;
    this.modifiedDateTime = spec.modifiedDateTime;
    this.noteRefs = spec.noteRefs;
    this.syncPoints = spec.syncPoints;
    this.selections = spec.selections;
    this.plainTextPath = spec.plainTextPath;
    this.richTextPath = spec.richTextPath;
    this.plainTextContent = spec.plainTextContent;
  }

  toJson(): TranscriptJson {
    return {
      guid: this.guid,
      name: this.name,
      Description: this.description,
      creatingUser: this.creatingUser,
      creationDateTime: this.creationDateTime?.toISOString(),
      modifyingUser: this.modifyingUser,
      modifiedDateTime: this.modifiedDateTime?.toISOString(),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.syncPoints.size > 0 ? { SyncPoint: [...this.syncPoints] } : {}),
      ...(this.selections.size > 0 ? { TranscriptSelection: [...this.selections] } : {}),
      plainTextPath: this.plainTextPath,
      richTextPath: this.richTextPath,
      PlainTextContent: this.plainTextContent,
    };
  }
}
