import { videoSourceJsonSchema } from "../../qde/schema.ts";
import type { VideoSourceJson } from "../../qde/types.ts";
import { VariableValue } from "../case/variableValue.ts";
import { Coding } from "../codebook/coding.ts";
import { Ref } from "../ref/ref.ts";
import { VideoSelection } from "../selection/video-selection.ts";
import { ensureValidGuid } from "../../utils.ts";
import { SourceBase, type SourceBaseSpec } from "./source-base.ts";
import { Transcript } from "./transcript.ts";

type VideoSourceSpec = SourceBaseSpec & {
  path?: string;
  currentPath?: string;
  transcripts?: Set<Transcript>;
  videoSelections?: Set<VideoSelection>;
};

export class VideoSource extends SourceBase {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="path" type="xsd:string"/> */
  readonly path?: string;
  /** <xsd:attribute name="currentPath" type="xsd:string"/> */
  readonly currentPath?: string;

  // #### ELEMENTS ####

  /** <xsd:element name="Transcript" type="TranscriptType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly transcripts: Set<Transcript>;
  /** <xsd:element name="VideoSelection" type="VideoSelectionType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly videoSelections: Set<VideoSelection>;

  /**
   * Create a VideoSource from a JSON object.
   * @param json - The JSON object to create the VideoSource from.
   * @returns The created VideoSource.
   */
  static fromJson(json: VideoSourceJson): VideoSource {
    const result = videoSourceJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as VideoSourceJson;
    const attrs = data._attributes as {
      guid: string;
      name?: string;
      creatingUser?: string;
      creationDateTime?: string;
      modifyingUser?: string;
      modifiedDateTime?: string;
      path?: string;
      currentPath?: string;
    };
    return new VideoSource({
      guid: attrs.guid,
      name: attrs.name,
      description: data.Description,
      creatingUser: attrs.creatingUser,
      creationDateTime: attrs.creationDateTime ? new Date(attrs.creationDateTime) : undefined,
      modifyingUser: attrs.modifyingUser,
      modifiedDateTime: attrs.modifiedDateTime ? new Date(attrs.modifiedDateTime) : undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      variableValues: new Set(data.VariableValue?.map((v) => VariableValue.fromJson(v)) ?? []),
      codings: new Set(data.Coding?.map((c) => Coding.fromJson(c)) ?? []),
      path: attrs.path,
      currentPath: attrs.currentPath,
      transcripts: new Set(data.Transcript?.map((t) => Transcript.fromJson(t)) ?? []),
      videoSelections: new Set(data.VideoSelection?.map((s) => VideoSelection.fromJson(s)) ?? []),
    });
  }

  /**
   * Create a VideoSource from a specification object.
   * @param spec - The specification object to create the VideoSource from.
   */
  constructor(spec: VideoSourceSpec) {
    super(spec);
    this.path = spec.path;
    this.currentPath = spec.currentPath;
    this.transcripts = spec.transcripts ?? new Set();
    this.videoSelections = spec.videoSelections ?? new Set();
  }

  /**
   * Convert the VideoSource to a JSON object.
   * @returns The JSON object representing the VideoSource.
   */
  toJson(): VideoSourceJson {
    return {
      _attributes: {
        guid: ensureValidGuid(this.guid, "VideoSource.guid"),
        ...(this.name ? { name: this.name } : {}),
        ...(this.creatingUser ? { creatingUser: ensureValidGuid(this.creatingUser, "VideoSource.creatingUser") } : {}),
        ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
        ...(this.modifyingUser
          ? { modifyingUser: ensureValidGuid(this.modifyingUser, "VideoSource.modifyingUser") }
          : {}),
        ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
        ...(this.path ? { path: this.path } : {}),
        ...(this.currentPath ? { currentPath: this.currentPath } : {}),
      },
      ...(this.description ? { Description: this.description } : {}),
      ...(this.transcripts.size > 0 ? { Transcript: [...this.transcripts].map((t) => t.toJson()) } : {}),
      ...(this.videoSelections.size > 0 ? { VideoSelection: [...this.videoSelections].map((s) => s.toJson()) } : {}),
      ...(this.codings.size > 0 ? { Coding: [...this.codings].map((c) => c.toJson()) } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.variableValues.size > 0 ? { VariableValue: [...this.variableValues].map((v) => v.toJson()) } : {}),
    } as unknown as VideoSourceJson;
  }
}
