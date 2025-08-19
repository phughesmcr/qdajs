import { pdfSourceJsonSchema } from "../../qde/schema.ts";
import type { PDFSourceJson } from "../../qde/types.ts";
import { VariableValue } from "../case/variableValue.ts";
import { Coding } from "../codebook/coding.ts";
import { Ref } from "../ref/ref.ts";
import { PDFSelection } from "../selection/pdf-selection.ts";
import { ensureValidGuid } from "../../utils.ts";
import { SourceBase, type SourceBaseSpec } from "./source-base.ts";
import { TextSource } from "./text-source.ts";

type PDFSourceSpec = SourceBaseSpec & {
  path?: string;
  currentPath?: string;
  pdfSelections?: Set<PDFSelection>;
  representation?: TextSource;
};

export class PDFSource extends SourceBase {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="path" type="xsd:string"/> */
  readonly path?: string;
  /** <xsd:attribute name="currentPath" type="xsd:string"/> */
  readonly currentPath?: string;

  // #### ELEMENTS ####

  /** <xsd:element name="PDFSelection" type="PDFSelectionType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly pdfSelections: Set<PDFSelection>;
  /** <xsd:element name="Representation" type="TextSourceType" minOccurs="0"/> */
  readonly representation?: TextSource;

  /**
   * Create a PDFSource from a JSON object.
   * @param json - The JSON object to create the PDFSource from.
   * @returns The created PDFSource.
   */
  static fromJson(json: PDFSourceJson): PDFSource {
    const result = pdfSourceJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as PDFSourceJson;
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
    return new PDFSource({
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
      pdfSelections: new Set(data.PDFSelection?.map((s) => PDFSelection.fromJson(s)) ?? []),
      representation: data.Representation ? TextSource.fromJson(data.Representation) : undefined,
    });
  }

  /**
   * Create a PDFSource from a specification object.
   * @param spec - The specification object to create the PDFSource from.
   */
  constructor(spec: PDFSourceSpec) {
    super(spec);
    this.path = spec.path;
    this.currentPath = spec.currentPath;
    this.pdfSelections = spec.pdfSelections ?? new Set();
    this.representation = spec.representation;
  }

  /**
   * Convert the PDFSource to a JSON object.
   * @returns The JSON object representing the PDFSource.
   */
  toJson(): PDFSourceJson {
    return {
      _attributes: {
        guid: ensureValidGuid(this.guid, "PDFSource.guid"),
        ...(this.name ? { name: this.name } : {}),
        ...(this.creatingUser ? { creatingUser: ensureValidGuid(this.creatingUser, "PDFSource.creatingUser") } : {}),
        ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
        ...(this.modifyingUser
          ? { modifyingUser: ensureValidGuid(this.modifyingUser, "PDFSource.modifyingUser") }
          : {}),
        ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
        ...(this.path ? { path: this.path } : {}),
        ...(this.currentPath ? { currentPath: this.currentPath } : {}),
      },
      ...(this.description ? { Description: this.description } : {}),
      ...(this.pdfSelections.size > 0 ? { PDFSelection: [...this.pdfSelections].map((s) => s.toJson()) } : {}),
      ...(this.representation ? { Representation: this.representation.toJson() } : {}),
      ...(this.codings.size > 0 ? { Coding: [...this.codings].map((c) => c.toJson()) } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.variableValues.size > 0 ? { VariableValue: [...this.variableValues].map((v) => v.toJson()) } : {}),
    } as unknown as PDFSourceJson;
  }
}
