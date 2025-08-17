import { pictureSelectionSchema } from "../../qde/schema.ts";
import type { PictureSelectionJson } from "../../qde/types.ts";
import { Coding } from "../codebook/coding.ts";
import { Ref } from "../ref/ref.ts";
import { ensureInteger, ensureValidGuid } from "../shared/utils.ts";
import { SelectionBase, type SelectionBaseSpec } from "./selection-base.ts";

type PictureSelectionSpec = SelectionBaseSpec & {
  firstX: number;
  firstY: number;
  secondX: number;
  secondY: number;
};

export class PictureSelection extends SelectionBase {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="firstX" type="xsd:integer" use="required"/> */
  readonly firstX: number;
  /** <xsd:attribute name="firstY" type="xsd:integer" use="required"/> */
  readonly firstY: number;
  /** <xsd:attribute name="secondX" type="xsd:integer" use="required"/> */
  readonly secondX: number;
  /** <xsd:attribute name="secondY" type="xsd:integer" use="required"/> */
  readonly secondY: number;

  /**
   * Create a PictureSelection from a JSON object.
   * @param json - The JSON object to create the PictureSelection from.
   * @returns The created PictureSelection.
   */
  static fromJson(json: PictureSelectionJson): PictureSelection {
    const result = pictureSelectionSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as PictureSelectionJson;
    return new PictureSelection({
      guid: data.guid,
      name: data.name,
      description: data.Description,
      creatingUser: data.creatingUser,
      creationDateTime: data.creationDateTime ? new Date(data.creationDateTime) : undefined,
      modifyingUser: data.modifyingUser,
      modifiedDateTime: data.modifiedDateTime ? new Date(data.modifiedDateTime) : undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      codings: new Set(data.Coding?.map((c) => Coding.fromJson(c)) ?? []),
      firstX: data.firstX,
      firstY: data.firstY,
      secondX: data.secondX,
      secondY: data.secondY,
    });
  }

  /**
   * Create a PictureSelection from a specification object.
   * @param spec - The specification object to create the PictureSelection from.
   */
  constructor(spec: PictureSelectionSpec) {
    super(spec);
    this.firstX = spec.firstX;
    this.firstY = spec.firstY;
    this.secondX = spec.secondX;
    this.secondY = spec.secondY;
  }

  /**
   * Convert the PictureSelection to a JSON object.
   * @returns The JSON object representing the PictureSelection.
   */
  toJson(): PictureSelectionJson {
    const json: PictureSelectionJson = {
      guid: ensureValidGuid(this.guid, "PictureSelection.guid"),
      ...(this.name ? { name: this.name } : {}),
      ...(this.description ? { Description: this.description } : {}),
      ...(this.creatingUser
        ? { creatingUser: ensureValidGuid(this.creatingUser, "PictureSelection.creatingUser") }
        : {}),
      ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
      ...(this.modifyingUser
        ? { modifyingUser: ensureValidGuid(this.modifyingUser, "PictureSelection.modifyingUser") }
        : {}),
      ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.codings.size > 0 ? { Coding: [...this.codings].map((c) => c.toJson()) } : {}),
      firstX: ensureInteger(this.firstX, "PictureSelection.firstX"),
      firstY: ensureInteger(this.firstY, "PictureSelection.firstY"),
      secondX: ensureInteger(this.secondX, "PictureSelection.secondX"),
      secondY: ensureInteger(this.secondY, "PictureSelection.secondY"),
    };
    return json;
  }
}
