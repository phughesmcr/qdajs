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

export interface RefJson {
  targetGUID: GuidString;
}

export interface CreationMetadataJson {
  creatingUser?: GuidString;
  creationDateTime?: string;
  modifyingUser?: GuidString;
  modifiedDateTime?: string;
}

export interface CommonMetadataJson extends CreationMetadataJson {
  Description?: string;
  NoteRef?: RefJson[];
}

export interface BaseEntityJson extends CommonMetadataJson {
  guid: GuidString;
  name?: string;
}

export interface CodingJson {
  guid: GuidString;
  creatingUser?: GuidString;
  creationDateTime?: string;
  CodeRef: RefJson;
  NoteRef?: RefJson[];
}

export interface CodeJson {
  _attributes: {
    guid: GuidString;
    name: string;
    isCodable: boolean;
    color?: RGBString;
  };
  Description?: string;
  NoteRef?: RefJson[];
  Code?: CodeJson[];
}

export interface CodebookJson {
  Codes: {
    Code: CodeJson[];
  };
  Sets?: {
    Set: SetJson[];
  };
  origin?: string;
}

export interface UserJson {
  guid: GuidString;
  name?: string;
  id?: string;
}

export interface UsersJson {
  User: UserJson[];
}

export interface BaseSelectionJson extends BaseEntityJson {
  Coding?: CodingJson[];
}

export interface PlainTextSelectionJson extends BaseSelectionJson {
  startPosition: number;
  endPosition: number;
}

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

export interface BaseSourceJson extends BaseEntityJson {
  path?: string;
  currentPath?: string;
  Coding?: CodingJson[];
  VariableValue?: VariableValueJson[];
}

export interface TextSourceJson extends BaseSourceJson {
  richTextPath?: string;
  plainTextPath?: string;
  PlainTextContent?: string;
  PlainTextSelection?: PlainTextSelectionJson[];
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

export interface PictureSelectionJson extends BaseSelectionJson, Coordinates {}

export interface PDFSelectionJson extends BaseSelectionJson, Coordinates {
  page: number;
  Representation?: TextSourceJson;
}

export interface AudioSelectionJson extends BaseSelectionJson, TimeRange {}

export interface VideoSelectionJson extends BaseSelectionJson, TimeRange {}

export interface SyncPointJson {
  guid: GuidString;
  timeStamp?: number;
  position?: number;
}

export interface TranscriptSelectionJson extends BaseSelectionJson {
  fromSyncPoint?: GuidString;
  toSyncPoint?: GuidString;
}

export interface TranscriptJson extends BaseEntityJson {
  richTextPath?: string;
  plainTextPath?: string;
  PlainTextContent?: string;
  SyncPoint?: SyncPointJson[];
  TranscriptSelection?: TranscriptSelectionJson[];
}

export interface PictureSourceJson extends BaseSourceJson {
  TextDescription?: TextSourceJson;
  PictureSelection?: PictureSelectionJson[];
}

export interface PDFSourceJson extends BaseSourceJson {
  PDFSelection?: PDFSelectionJson[];
  Representation?: TextSourceJson;
}

export interface AudioSourceJson extends BaseSourceJson {
  Transcript?: TranscriptJson[];
  AudioSelection?: AudioSelectionJson[];
}

export interface VideoSourceJson extends BaseSourceJson {
  Transcript?: TranscriptJson[];
  VideoSelection?: VideoSelectionJson[];
}

export interface SourcesJson {
  TextSource?: TextSourceJson[];
  PictureSource?: PictureSourceJson[];
  PDFSource?: PDFSourceJson[];
  AudioSource?: AudioSourceJson[];
  VideoSource?: VideoSourceJson[];
}

export interface VariableJson {
  guid: GuidString;
  name: string;
  typeOfVariable: VariableType;
  Description?: string;
}

export interface VariablesJson {
  Variable?: VariableJson[];
}

export interface CaseJson {
  guid: GuidString;
  name?: string;
  Description?: string;
  CodeRef?: RefJson[];
  VariableValue?: VariableValueJson[];
  SourceRef?: RefJson[];
  SelectionRef?: RefJson[];
}

export interface CasesJson {
  Case?: CaseJson[];
}

export interface SetJson {
  guid: GuidString;
  name: string;
  Description?: string;
  MemberCode?: RefJson[];
  MemberSource?: RefJson[];
  MemberNote?: RefJson[];
}

export interface SetsJson {
  Set?: SetJson[];
}

export interface VertexJson {
  guid: GuidString;
  representedGUID?: GuidString;
  name?: string;
  firstX: number;
  firstY: number;
  secondX?: number;
  secondY?: number;
  shape?: Shape;
  color?: RGBString;
}

export interface EdgeJson {
  guid: GuidString;
  representedGUID?: GuidString;
  name?: string;
  sourceVertex: GuidString;
  targetVertex: GuidString;
  color?: RGBString;
  direction?: Direction;
  lineStyle?: LineStyle;
}

export interface GraphJson {
  guid: GuidString;
  name?: string;
  Vertex?: VertexJson[];
  Edge?: EdgeJson[];
}

export interface GraphsJson {
  Graph?: GraphJson[];
}

export interface LinkJson {
  guid: GuidString;
  name?: string;
  direction?: Direction;
  color?: RGBString;
  originGUID?: GuidString;
  targetGUID?: GuidString;
  NoteRef?: RefJson[];
}

export interface LinksJson {
  Link?: LinkJson[];
}

export interface NotesJson {
  Note?: TextSourceJson[];
}

export interface ProjectMetaJson {
  name: string;
  origin?: string;
  creatingUserGUID?: GuidString;
  creationDateTime?: string;
  modifyingUserGUID?: GuidString;
  modifiedDateTime?: string;
  basePath?: string;
  xmlns?: string;
  "xmlns:xsi"?: string;
  "xsi:schemaLocation"?: string;
}

export interface ProjectJson {
  _attributes: ProjectMetaJson;
  Users?: UsersJson;
  CodeBook?: CodebookJson;
  Variables?: VariablesJson;
  Cases?: CasesJson;
  Sources?: SourcesJson;
  Notes?: NotesJson;
  Links?: LinksJson;
  Sets?: SetsJson;
  Graphs?: GraphsJson;
  Description?: string;
  NoteRef?: RefJson[];
}

export type NoteJson = TextSourceJson;

export type QdeToJsonResult = Result<{ qde: ProjectJson }, Error | ZodError>;
export type JsonToQdeResult = Result<{ qde: string }, Error | ZodError>;
