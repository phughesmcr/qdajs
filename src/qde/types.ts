/**
 * QDE JSON Data Types
 *
 * Type definitions for QDE (Qualitative Data Exchange) JSON data structures.
 * Defines interfaces for QDE project elements, sources, selections, and metadata
 * according to REFI-QDA standards for qualitative data analysis.
 *
 * @module
 */

import type { ZodError } from "zod";
import type { Direction, LineStyle, Result, Shape, VariableType } from "../types.ts";

export type GuidString = string;

export type RGBString = string;

export interface WithAttributes<T> {
  _attributes: T;
}

export interface AuditCreatorAttributes {
  creatingUser?: GuidString;
  creationDateTime?: string;
}

export interface AuditModifierAttributes {
  modifyingUser?: GuidString;
  modifiedDateTime?: string;
}

export interface AuditAttributes extends AuditCreatorAttributes, AuditModifierAttributes {}

export interface Identified {
  guid: GuidString;
}

export interface Nameable {
  name?: string;
}

export interface Describable {
  Description?: string;
}

export interface Colorable {
  color?: RGBString;
}

export interface RefJson {
  targetGUID: GuidString;
}

export interface WithNoteRefs {
  NoteRef?: RefJson[];
}

export interface ProjectAttributes extends Nameable, AuditAttributes {
  origin?: string;
  basePath?: string;
  xmlns?: string;
  "xmlns:xsi"?: string;
  "xsi:schemaLocation"?: string;
}

export interface ProjectJson extends WithAttributes<ProjectAttributes>, Describable, WithNoteRefs {
  Users?: UsersJson;
  CodeBook?: CodebookJson;
  Variables?: VariablesJson;
  Cases?: CasesJson;
  Sources?: SourcesJson;
  Notes?: NotesJson;
  Links?: LinksJson;
  Sets?: SetsJson;
  Graphs?: GraphsJson;
}

export interface UsersJson {
  User: UserJson[];
}

export interface CodesJson {
  Code?: CodeJson[];
}

export interface CodebookJson {
  Codes: CodesJson;
  Sets?: SetsJson;
  origin?: string;
}

export interface VariablesJson {
  Variable?: VariableJson[];
}

export interface CasesJson {
  Case?: CaseJson[];
}

export interface SourcesJson {
  TextSource?: TextSourceJson[];
  PictureSource?: PictureSourceJson[];
  PDFSource?: PDFSourceJson[];
  AudioSource?: AudioSourceJson[];
  VideoSource?: VideoSourceJson[];
}

export interface NotesJson {
  Note?: TextSourceJson[];
}

export interface LinksJson {
  Link?: LinkJson[];
}

export interface SetsJson {
  Set?: SetJson[];
}

export interface GraphsJson {
  Graph?: GraphJson[];
}

export interface CodeJson
  extends WithAttributes<Identified & Nameable & Colorable & { isCodable: boolean }>, Describable, WithNoteRefs {
  Code?: CodeJson[];
}

export interface CodingJson extends WithAttributes<Identified & AuditCreatorAttributes>, WithNoteRefs {
  CodeRef?: RefJson;
}

export interface UserJson extends WithAttributes<Identified & Nameable & { id?: string }> {}

export interface BaseSelection<T = undefined>
  extends WithAttributes<AuditAttributes & Identified & Nameable & T>, Describable, WithNoteRefs {
  Coding?: CodingJson[];
}

export interface PlainTextSelectionJson extends BaseSelection<{ startPosition: number; endPosition: number }> {}

export type VariableValueJson =
  | {
    VariableRef: RefJson;
    TextValue: string;
    BooleanValue?: never;
    IntegerValue?: never;
    FloatValue?: never;
    DateValue?: never;
    DateTimeValue?: never;
  }
  | {
    VariableRef: RefJson;
    TextValue?: never;
    BooleanValue: boolean;
    IntegerValue?: never;
    FloatValue?: never;
    DateValue?: never;
    DateTimeValue?: never;
  }
  | {
    VariableRef: RefJson;
    TextValue?: never;
    BooleanValue?: never;
    IntegerValue: number;
    FloatValue?: never;
    DateValue?: never;
    DateTimeValue?: never;
  }
  | {
    VariableRef: RefJson;
    TextValue?: never;
    BooleanValue?: never;
    IntegerValue?: never;
    FloatValue: number;
    DateValue?: never;
    DateTimeValue?: never;
  }
  | {
    VariableRef: RefJson;
    TextValue?: never;
    BooleanValue?: never;
    IntegerValue?: never;
    FloatValue?: never;
    DateValue: string;
    DateTimeValue?: never;
  }
  | {
    VariableRef: RefJson;
    TextValue?: never;
    BooleanValue?: never;
    IntegerValue?: never;
    FloatValue?: never;
    DateValue?: never;
    DateTimeValue: string;
  };

export interface BaseSourceJson<T = undefined>
  extends WithAttributes<Identified & Nameable & AuditAttributes & T>, Describable, WithNoteRefs {
  Coding?: CodingJson[];
  VariableValue?: VariableValueJson[];
}

/** <!-- Either PlainTextContent or plainTextPath MUST be filled, not both --> */
export interface TextSourceJson extends BaseSourceJson<{ richTextPath?: string; plainTextPath?: string }> {
  PlainTextContent?: string;
  PlainTextSelection?: PlainTextSelectionJson[];
}

export interface Locatable {
  path?: string;
  currentPath?: string;
}

export interface PictureSourceJson extends BaseSourceJson<Locatable> {
  TextDescription?: TextSourceJson;
  PictureSelection?: PictureSelectionJson[];
}

export interface PDFSourceJson extends BaseSourceJson<Locatable> {
  PDFSelection?: PDFSelectionJson[];
  Representation?: TextSourceJson;
}

export interface AudioSourceJson extends BaseSourceJson<Locatable> {
  Transcript?: TranscriptJson[];
  AudioSelection?: AudioSelectionJson[];
}

export interface VideoSourceJson extends BaseSourceJson<Locatable> {
  Transcript?: TranscriptJson[];
  VideoSelection?: VideoSelectionJson[];
}

export interface Coordinates {
  firstX: number;
  firstY: number;
  secondX: number;
  secondY: number;
}

export interface TimeRange {
  begin: number;
  end: number;
}

export interface PictureSelectionJson extends BaseSelection<Coordinates> {}

export interface PDFSelectionJson extends BaseSelection<Coordinates & { page: number }> {
  Representation?: TextSourceJson;
}

export interface AudioSelectionJson extends BaseSelection<TimeRange> {}

export interface VideoSelectionJson extends BaseSelection<TimeRange> {}

export interface SyncPointJson extends WithAttributes<Identified & { timeStamp?: number; position?: number }> {}

export interface TranscriptSelectionJson
  extends BaseSelection<{ fromSyncPoint?: GuidString; toSyncPoint?: GuidString }> {}

/** <!-- Either PlainTextContent or plainTextPath MUST be filled, not both --> */
export interface TranscriptJson extends BaseSourceJson<{ richTextPath?: string; plainTextPath?: string }> {
  PlainTextContent?: string;
  SyncPoint?: SyncPointJson[];
  TranscriptSelection?: TranscriptSelectionJson[];
}

export interface VariableJson
  extends WithAttributes<Identified & Nameable & { typeOfVariable: VariableType }>, Describable {}

export interface CaseJson extends WithAttributes<Identified & Nameable>, Describable {
  CodeRef?: RefJson[];
  VariableValue?: VariableValueJson[];
  SourceRef?: RefJson[];
  SelectionRef?: RefJson[];
}

export interface SetJson extends WithAttributes<Identified & Nameable>, Describable {
  MemberCode?: RefJson[];
  MemberSource?: RefJson[];
  MemberNote?: RefJson[];
}

export interface VertexJson extends
  WithAttributes<
    Identified & Nameable & Colorable & {
      representedGUID?: GuidString;
      firstX: number;
      firstY: number;
      secondX?: number;
      secondY?: number;
      shape?: Shape;
    }
  > {}

export interface EdgeJson extends
  WithAttributes<
    Identified & Nameable & Colorable & {
      representedGUID?: GuidString;
      sourceVertex: GuidString;
      targetVertex: GuidString;
      direction?: Direction;
      lineStyle?: LineStyle;
    }
  > {}

export interface GraphJson extends WithAttributes<Identified & Nameable> {
  Vertex?: VertexJson[];
  Edge?: EdgeJson[];
}

export interface LinkJson extends
  WithAttributes<
    Identified & Nameable & Colorable & {
      direction?: Direction;
      originGUID?: GuidString;
      targetGUID?: GuidString;
    }
  >,
  WithNoteRefs {}

export type NoteJson = TextSourceJson;

export type QdeToJsonResult = Result<{ qde: ProjectJson }, Error | ZodError>;

export type JsonToQdeResult = Result<{ qde: string }, Error | ZodError>;
