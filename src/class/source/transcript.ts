import { transcriptJsonSchema } from "../../qde/schema.ts";
import type { GuidString, TranscriptJson } from "../../qde/types.ts";
import { assertExactlyOne, ensureInteger, ensureValidGuid } from "../../utils.ts";
import { Ref } from "../ref/ref.ts";
import { SyncPoint } from "../selection/sync-point.ts";
import { TranscriptSelection } from "../selection/transcript-selection.ts";

export type TranscriptSpec = {
  guid: GuidString;
  name?: string;
  description?: string;
  creatingUser?: GuidString;
  creationDateTime?: Date;
  modifyingUser?: GuidString;
  modifiedDateTime?: Date;
  noteRefs: Set<Ref>;
  syncPoints: Set<SyncPoint>;
  selections: Set<TranscriptSelection>;
  plainTextPath?: string;
  richTextPath?: string;
  plainTextContent?: string;
};

export class Transcript {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="name" type="xsd:string"/> */
  name?: string;
  /** <xsd:attribute name="plainTextPath" type="xsd:string"/> */
  readonly plainTextPath?: string;
  /** <xsd:attribute name="richTextPath" type="xsd:string"/> */
  readonly richTextPath?: string;
  /** <xsd:attribute name="creatingUser" type="GUIDType"/> */
  creatingUser?: GuidString;
  /** <xsd:attribute name="creationDateTime" type="xsd:dateTime"/> */
  creationDateTime?: Date;
  /** <xsd:attribute name="modifyingUser" type="GUIDType"/> */
  modifyingUser?: GuidString;
  /** <xsd:attribute name="modifiedDateTime" type="xsd:dateTime"/> */
  modifiedDateTime?: Date;

  // #### ELEMENTS ####

  /** <xsd:element name="Description" type="xsd:string" minOccurs="0"/> */
  description?: string;
  /** <xsd:element name="PlainTextContent" type="xsd:string" minOccurs="0"/> */
  readonly plainTextContent?: string;
  /** <xsd:element name="SyncPoint" type="SyncPointType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly syncPoints: Set<SyncPoint>;
  /** <xsd:element name="TranscriptSelection" type="TranscriptSelectionType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly selections: Set<TranscriptSelection>;
  /** <xsd:element name="NoteRef" type="NoteRefType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly noteRefs: Set<Ref>;

  /**
   * Create a Transcript from a JSON object.
   * @param json - The JSON object to create the Transcript from.
   * @returns The created Transcript.
   */
  static fromJson(json: TranscriptJson): Transcript {
    const result = transcriptJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as TranscriptJson;
    const attrs = data._attributes as {
      guid: GuidString;
      name?: string;
      creatingUser?: GuidString;
      creationDateTime?: string;
      modifyingUser?: GuidString;
      modifiedDateTime?: string;
      plainTextPath?: string;
      richTextPath?: string;
    };
    const obj = {
      guid: attrs.guid,
      name: attrs.name,
      description: data.Description,
      creatingUser: attrs.creatingUser,
      creationDateTime: attrs.creationDateTime ? new Date(attrs.creationDateTime) : undefined,
      modifyingUser: attrs.modifyingUser,
      modifiedDateTime: attrs.modifiedDateTime ? new Date(attrs.modifiedDateTime) : undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      syncPoints: new Set(data.SyncPoint?.map((s) => SyncPoint.fromJson(s)) ?? []),
      selections: new Set(data.TranscriptSelection?.map((s) => TranscriptSelection.fromJson(s)) ?? []),
      plainTextPath: attrs.plainTextPath,
      richTextPath: attrs.richTextPath,
      plainTextContent: data.PlainTextContent,
    } as TranscriptSpec;
    assertExactlyOne(
      { PlainTextContent: obj.plainTextContent, plainTextPath: obj.plainTextPath },
      ["PlainTextContent", "plainTextPath"],
      "Transcript",
    );
    return new Transcript(obj);
  }

  /**
   * Create a Transcript from a specification object.
   * @param spec - The specification object to create the Transcript from.
   * @note Either PlainTextContent or plainTextPath MUST be filled, not both.
   */
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

  /**
   * Convert the Transcript to a JSON object.
   * @returns The JSON object representing the Transcript.
   */
  toJson(): TranscriptJson {
    const json: TranscriptJson = {
      _attributes: {
        guid: ensureValidGuid(this.guid, "Transcript.guid"),
        ...(this.name ? { name: this.name } : {}),
        ...(this.creatingUser ? { creatingUser: ensureValidGuid(this.creatingUser, "Transcript.creatingUser") } : {}),
        ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
        ...(this.modifyingUser
          ? { modifyingUser: ensureValidGuid(this.modifyingUser, "Transcript.modifyingUser") }
          : {}),
        ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
        ...(this.plainTextContent === undefined && this.plainTextPath ? { plainTextPath: this.plainTextPath } : {}),
        ...(this.richTextPath ? { richTextPath: this.richTextPath } : {}),
      },
      ...(this.description ? { Description: this.description } : {}),
      ...(this.plainTextContent ? { PlainTextContent: this.plainTextContent } : {}),
      ...(this.syncPoints.size > 0
        ? {
          SyncPoint: [...this.syncPoints].map((s) => ({
            guid: ensureValidGuid(s.guid, "SyncPoint.guid"),
            ...(s.timeStamp !== undefined ? { timeStamp: ensureInteger(s.timeStamp, "SyncPoint.timeStamp") } : {}),
            ...(s.position !== undefined ? { position: ensureInteger(s.position, "SyncPoint.position") } : {}),
          })),
        }
        : {}),
      ...(this.selections.size > 0 ? { TranscriptSelection: [...this.selections].map((s) => s.toJson()) } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
    } as unknown as TranscriptJson;
    // Re-assert XOR at serialization time to catch post-construction mutations
    assertExactlyOne(
      { PlainTextContent: json.PlainTextContent, plainTextPath: json._attributes.plainTextPath },
      ["PlainTextContent", "plainTextPath"],
      "Transcript",
    );
    return json;
  }
}
