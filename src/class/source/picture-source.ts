import { pictureSourceSchema } from "../../qde/schema.ts";
import type { PictureSourceJson } from "../../qde/types.ts";
import { VariableValue } from "../case/variableValue.ts";
import { Coding } from "../codebook/coding.ts";
import { Ref } from "../ref/ref.ts";
import { PictureSelection } from "../selection/picture-selection.ts";
import { ensureValidGuid } from "../shared/utils.ts";
import { SourceBase, type SourceBaseSpec } from "./source-base.ts";
import { TextSource } from "./text-source.ts";

type PictureSourceSpec = SourceBaseSpec & {
  textDescription?: TextSource;
  pictureSelections?: Set<PictureSelection>;
  path?: string;
  currentPath?: string;
};

export class PictureSource extends SourceBase {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="path" type="xsd:string"/> */
  readonly path?: string;
  /** <xsd:attribute name="currentPath" type="xsd:string"/> */
  readonly currentPath?: string;

  // #### ELEMENTS ####

  /** <xsd:element name="PictureSelection" type="PictureSelectionType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly pictureSelections: Set<PictureSelection>;
  /** <xsd:element name="TextDescription" type="TextSourceType" minOccurs="0"/> */
  readonly textDescription?: TextSource;

  /**
   * Create a PictureSource from a JSON object.
   * @param json - The JSON object to create the PictureSource from.
   * @returns The created PictureSource.
   */
  static fromJson(json: PictureSourceJson): PictureSource {
    const result = pictureSourceSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as PictureSourceJson;
    return new PictureSource({
      guid: data.guid,
      name: data.name,
      creatingUser: data.creatingUser,
      creationDateTime: data.creationDateTime ? new Date(data.creationDateTime) : undefined,
      modifyingUser: data.modifyingUser,
      modifiedDateTime: data.modifiedDateTime ? new Date(data.modifiedDateTime) : undefined,
      description: data.Description,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      variableValues: new Set(data.VariableValue?.map((v) => VariableValue.fromJson(v)) ?? []),
      codings: new Set(data.Coding?.map((c) => Coding.fromJson(c)) ?? []),
      path: data.path,
      currentPath: data.currentPath,
      pictureSelections: new Set(data.PictureSelection?.map((s) => PictureSelection.fromJson(s)) ?? []),
      textDescription: data.TextDescription ? TextSource.fromJson(data.TextDescription) : undefined,
    });
  }

  /**
   * Create a PictureSource from a specification object.
   * @param spec - The specification object to create the PictureSource from.
   */
  constructor(spec: PictureSourceSpec) {
    super(spec);
    this.path = spec.path;
    this.currentPath = spec.currentPath;
    this.pictureSelections = spec.pictureSelections ?? new Set();
    this.textDescription = spec.textDescription;
  }

  /**
   * Convert the PictureSource to a JSON object.
   * @returns The JSON object representing the PictureSource.
   */
  toJson(): PictureSourceJson {
    return {
      guid: ensureValidGuid(this.guid, "PictureSource.guid"),
      ...(this.name ? { name: this.name } : {}),
      ...(this.creatingUser ? { creatingUser: ensureValidGuid(this.creatingUser, "PictureSource.creatingUser") } : {}),
      ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
      ...(this.modifyingUser
        ? { modifyingUser: ensureValidGuid(this.modifyingUser, "PictureSource.modifyingUser") }
        : {}),
      ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
      ...(this.description ? { Description: this.description } : {}),
      ...(this.codings.size > 0 ? { Coding: [...this.codings].map((c) => c.toJson()) } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.variableValues.size > 0 ? { VariableValue: [...this.variableValues].map((v) => v.toJson()) } : {}),

      ...(this.pictureSelections.size > 0
        ? { PictureSelection: [...this.pictureSelections].map((s) => s.toJson()) }
        : {}),
      ...(this.textDescription ? { TextDescription: this.textDescription.toJson() } : {}),
      ...(this.path ? { path: this.path } : {}),
      ...(this.currentPath ? { currentPath: this.currentPath } : {}),
    };
  }
}
