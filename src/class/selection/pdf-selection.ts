import { pdfSelectionSchema } from "../../qde/schema.ts";
import type { PDFSelectionJson } from "../../qde/types.ts";
import { Ref } from "../ref/ref.ts";
import { SelectionBase, type SelectionBaseSpec } from "./selection-base.ts";

type PDFSelectionSpec = SelectionBaseSpec & {
  page: number;
  firstX: number;
  firstY: number;
  secondX: number;
  secondY: number;
};

export class PDFSelection extends SelectionBase {
  readonly page: number;
  readonly firstX: number;
  readonly firstY: number;
  readonly secondX: number;
  readonly secondY: number;

  static fromJson(json: PDFSelectionJson): PDFSelection {
    const result = pdfSelectionSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as PDFSelectionJson;
    return new PDFSelection({
      guid: data.guid,
      name: data.name,
      description: data.Description,
      creatingUser: data.creatingUser,
      creationDateTime: data.creationDateTime ? new Date(data.creationDateTime) : undefined,
      modifyingUser: data.modifyingUser,
      modifiedDateTime: data.modifiedDateTime ? new Date(data.modifiedDateTime) : undefined,
      noteRefs: (data.NoteRef ?? []).map((r) => Ref.fromJson(r)),
      page: data.page,
      firstX: data.firstX,
      firstY: data.firstY,
      secondX: data.secondX,
      secondY: data.secondY,
    });
  }

  constructor(spec: PDFSelectionSpec) {
    super(spec);
    this.page = spec.page;
    this.firstX = spec.firstX;
    this.firstY = spec.firstY;
    this.secondX = spec.secondX;
    this.secondY = spec.secondY;
  }

  toJson(): PDFSelectionJson {
    return {
      guid: this.guid,
      name: this.name,
      Description: this.description,
      creatingUser: this.creatingUser,
      creationDateTime: this.creationDateTime?.toISOString(),
      modifyingUser: this.modifyingUser,
      modifiedDateTime: this.modifiedDateTime?.toISOString(),
      NoteRef: this.noteRefs.map((r) => r.toJson()),
      page: this.page,
      firstX: this.firstX,
      firstY: this.firstY,
      secondX: this.secondX,
      secondY: this.secondY,
    };
  }
}
