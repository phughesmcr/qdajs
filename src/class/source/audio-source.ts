import { audioSourceJsonSchema } from "../../qde/schema.ts";
import type { AudioSourceJson } from "../../qde/types.ts";
import { VariableValue } from "../case/variableValue.ts";
import { Coding } from "../codebook/coding.ts";
import { Ref } from "../ref/ref.ts";
import { AudioSelection } from "../selection/audio-selection.ts";
import { ensureValidGuid } from "../shared/utils.ts";
import { SourceBase, type SourceBaseSpec } from "./source-base.ts";
import { Transcript } from "./transcript.ts";

type AudioSourceSpec = SourceBaseSpec & {
  path?: string;
  currentPath?: string;
  transcripts?: Set<Transcript>;
  audioSelections?: Set<AudioSelection>;
};

export class AudioSource extends SourceBase {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="path" type="xsd:string"/> */
  readonly path?: string;
  /** <xsd:attribute name="currentPath" type="xsd:string"/> */
  readonly currentPath?: string;

  // #### ELEMENTS ####

  /** <xsd:element name="Transcript" type="TranscriptType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly transcripts: Set<Transcript>;
  /** <xsd:element name="AudioSelection" type="AudioSelectionType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly audioSelections: Set<AudioSelection>;

  /**
   * Create an AudioSource from a JSON object.
   * @param json - The JSON object to create the AudioSource from.
   * @returns The created AudioSource.
   */
  static fromJson(json: AudioSourceJson): AudioSource {
    const result = audioSourceJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as AudioSourceJson;
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
    return new AudioSource({
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
      audioSelections: new Set(data.AudioSelection?.map((s) => AudioSelection.fromJson(s)) ?? []),
    });
  }

  /**
   * Create an AudioSource from a specification object.
   * @param spec - The specification object to create the AudioSource from.
   */
  constructor(spec: AudioSourceSpec) {
    super(spec);
    this.path = spec.path;
    this.currentPath = spec.currentPath;
    this.transcripts = spec.transcripts ?? new Set();
    this.audioSelections = spec.audioSelections ?? new Set();
  }

  /**
   * Convert the AudioSource to a JSON object.
   * @returns The JSON object representing the AudioSource.
   */
  toJson(): AudioSourceJson {
    return {
      _attributes: {
        guid: ensureValidGuid(this.guid, "AudioSource.guid"),
        ...(this.name ? { name: this.name } : {}),
        ...(this.creatingUser ? { creatingUser: ensureValidGuid(this.creatingUser, "AudioSource.creatingUser") } : {}),
        ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
        ...(this.modifyingUser
          ? { modifyingUser: ensureValidGuid(this.modifyingUser, "AudioSource.modifyingUser") }
          : {}),
        ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
        ...(this.path ? { path: this.path } : {}),
        ...(this.currentPath ? { currentPath: this.currentPath } : {}),
      },
      ...(this.description ? { Description: this.description } : {}),
      ...(this.transcripts.size > 0 ? { Transcript: [...this.transcripts].map((t) => t.toJson()) } : {}),
      ...(this.audioSelections.size > 0 ? { AudioSelection: [...this.audioSelections].map((s) => s.toJson()) } : {}),
      ...(this.codings.size > 0 ? { Coding: [...this.codings].map((c) => c.toJson()) } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.variableValues.size > 0 ? { VariableValue: [...this.variableValues].map((v) => v.toJson()) } : {}),
    } as unknown as AudioSourceJson;
  }
}
