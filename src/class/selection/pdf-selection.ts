import { pdfSelectionJsonSchema } from "../../qde/schema.ts";
import type { PDFSelectionJson } from "../../qde/types.ts";
import { Coding } from "../codebook/coding.ts";
import { Ref } from "../ref/ref.ts";
import { ensureInteger, ensureValidGuid } from "../../utils.ts";
import { TextSource } from "../source/text-source.ts";
import { SelectionBase, type SelectionBaseSpec } from "./selection-base.ts";

type PDFSelectionSpec = SelectionBaseSpec & {
  page: number;
  firstX: number;
  firstY: number;
  secondX: number;
  secondY: number;
  representation?: TextSource;
};

export class PDFSelection extends SelectionBase {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="page" type="xsd:integer" use="required"/> */
  readonly page: number;
  /** <xsd:attribute name="firstX" type="xsd:integer" use="required"/> */
  readonly firstX: number;
  /** <xsd:attribute name="firstY" type="xsd:integer" use="required"/> */
  readonly firstY: number;
  /** <xsd:attribute name="secondX" type="xsd:integer" use="required"/> */
  readonly secondX: number;
  /** <xsd:attribute name="secondY" type="xsd:integer" use="required"/> */
  readonly secondY: number;

  // #### ELEMENTS ####

  /** <xsd:element name="Representation" type="TextSourceType" minOccurs="0"/> */
  readonly representation?: TextSource;

  /**
   * Create a PDFSelection from a JSON object.
   * @param json - The JSON object to create the PDFSelection from.
   * @returns The created PDFSelection.
   */
  static fromJson(json: PDFSelectionJson): PDFSelection {
    const result = pdfSelectionJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as PDFSelectionJson;
    const attrs = data._attributes as {
      guid: string;
      name?: string;
      creatingUser?: string;
      creationDateTime?: string;
      modifyingUser?: string;
      modifiedDateTime?: string;
      page: number;
      firstX: number;
      firstY: number;
      secondX: number;
      secondY: number;
    };
    return new PDFSelection({
      guid: attrs.guid,
      name: attrs.name,
      description: data.Description,
      creatingUser: attrs.creatingUser,
      creationDateTime: attrs.creationDateTime ? new Date(attrs.creationDateTime) : undefined,
      modifyingUser: attrs.modifyingUser,
      modifiedDateTime: attrs.modifiedDateTime ? new Date(attrs.modifiedDateTime) : undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      codings: new Set(data.Coding?.map((c) => Coding.fromJson(c)) ?? []),
      page: attrs.page,
      firstX: attrs.firstX,
      firstY: attrs.firstY,
      secondX: attrs.secondX,
      secondY: attrs.secondY,
      representation: data.Representation ? TextSource.fromJson(data.Representation) : undefined,
    });
  }

  /**
   * Create a PDFSelection from a specification object.
   * @param spec - The specification object to create the PDFSelection from.
   */
  constructor(spec: PDFSelectionSpec) {
    super(spec);
    this.page = spec.page;
    this.firstX = spec.firstX;
    this.firstY = spec.firstY;
    this.secondX = spec.secondX;
    this.secondY = spec.secondY;
    this.representation = spec.representation;
  }

  /**
   * Convert the PDFSelection to a JSON object.
   * @returns The JSON object representing the PDFSelection.
   */
  toJson(): PDFSelectionJson {
    const json: PDFSelectionJson = {
      _attributes: {
        guid: ensureValidGuid(this.guid, "PDFSelection.guid"),
        ...(this.name ? { name: this.name } : {}),
        ...(this.creatingUser ? { creatingUser: ensureValidGuid(this.creatingUser, "PDFSelection.creatingUser") } : {}),
        ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
        ...(this.modifyingUser
          ? { modifyingUser: ensureValidGuid(this.modifyingUser, "PDFSelection.modifyingUser") }
          : {}),
        ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
        page: ensureInteger(this.page, "PDFSelection.page"),
        firstX: ensureInteger(this.firstX, "PDFSelection.firstX"),
        firstY: ensureInteger(this.firstY, "PDFSelection.firstY"),
        secondX: ensureInteger(this.secondX, "PDFSelection.secondX"),
        secondY: ensureInteger(this.secondY, "PDFSelection.secondY"),
      },
      ...(this.description ? { Description: this.description } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.codings.size > 0 ? { Coding: [...this.codings].map((c) => c.toJson()) } : {}),
      ...(this.representation ? { Representation: this.representation.toJson() } : {}),
    } as unknown as PDFSelectionJson;
    return json;
  }
}
