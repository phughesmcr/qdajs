/**
 * QDE Schema Definitions
 *
 * Comprehensive Zod schema definitions for QDE (Qualitative Data Exchange) data structures.
 * Provides runtime validation for QDA project data including sources, codes, users, cases,
 * variables, notes, links, sets, and graphs according to REFI-QDA standards.
 *
 * @module
 */

import { z } from "zod";
import {
  DIRECTIONS,
  GUID_REGEX,
  ISO_DATE_REGEX,
  ISO_DATETIME_REGEX,
  LINE_STYLES,
  RGB_REGEX,
  SHAPES,
  VARIABLE_TYPES,
} from "../constants.ts";
import type { RefJson } from "./types.ts";

// Enums
export const shapeEnum: z.ZodTypeAny = z.enum(SHAPES);
export const directionEnum: z.ZodTypeAny = z.enum(DIRECTIONS);

// Common field schemas
export const guidField: z.ZodString = z.string().regex(
  GUID_REGEX,
  "Must be a valid GUID",
);
export const optionalGuidField: z.ZodOptional<z.ZodString> = guidField.optional();
export const colorField: z.ZodOptional<z.ZodString> = z
  .string()
  .regex(RGB_REGEX, "Must be a valid RGB color")
  .optional();
export const dateTimeField: z.ZodOptional<z.ZodString> = z
  .string()
  .regex(ISO_DATETIME_REGEX, "Must be a valid ISO 8601 datetime")
  .optional();

export const creationMetadata: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  creatingUser: optionalGuidField,
  creationDateTime: dateTimeField,
  modifyingUser: optionalGuidField,
  modifiedDateTime: dateTimeField,
});

// Common metadata fields shared across entities
export const commonMetadata: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  ...creationMetadata.shape,
  Description: z.string().optional(),
  NoteRef: z.array(z.object({ targetGUID: guidField })).optional(),
});

// Base entity with GUID and name
export const baseEntity: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  guid: guidField,
  name: z.string().optional(),
  ...commonMetadata.shape,
});

export const refSchema: z.ZodType<RefJson> = z.object({
  targetGUID: guidField,
});

export const codingSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  guid: guidField,
  creatingUser: optionalGuidField,
  creationDateTime: dateTimeField,
  CodeRef: refSchema,
  NoteRef: z.array(refSchema).optional(),
});

type CodeTree = {
  _attributes: {
    guid: string;
    name: string;
    isCodable: boolean;
    color?: string | undefined;
  };
  Description?: string | undefined;
  NoteRef?: Array<{ targetGUID: string }> | undefined;
  Code?: CodeTree[] | undefined;
};

export const codeSchema: z.ZodType<CodeTree> = z.lazy<z.ZodType<CodeTree>>(
  () =>
    z
      .object({
        _attributes: z.object({
          guid: guidField,
          name: z.string(),
          isCodable: z.boolean(),
          color: colorField,
        }),
        Description: z.string().optional(),
        NoteRef: z.array(refSchema).optional(),
        Code: z.array(codeSchema).optional(),
      }) as z.ZodType<CodeTree>,
);

export const codeBookSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  Codes: z.object({
    Code: z.array(codeSchema),
  }),
});

export const userSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  guid: guidField,
  name: z.string().optional(),
  id: z.string().optional(),
});

export const usersSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  User: z.array(userSchema),
});

export const baseSelectionSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = baseEntity.extend({
  Coding: z.array(codingSchema).optional(),
});

export const plainTextSelectionSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = baseSelectionSchema.extend({
  startPosition: z.number().int(),
  endPosition: z.number().int(),
});

export const variableValueSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z
  .object({
    VariableRef: refSchema,
    TextValue: z.string().optional(),
    BooleanValue: z.boolean().optional(),
    IntegerValue: z.number().int().optional(),
    FloatValue: z.number().optional(),
    DateValue: z.string().regex(ISO_DATE_REGEX, "Must be a valid ISO 8601 date").optional(),
    DateTimeValue: dateTimeField,
  })
  .refine(
    (data) =>
      [
        "TextValue",
        "BooleanValue",
        "IntegerValue",
        "FloatValue",
        "DateValue",
        "DateTimeValue",
      ].filter((field) => data[field as keyof typeof data] !== undefined).length === 1,
    { message: "Exactly one value type must be present (XSD choice constraint)" },
  );

export const baseSourceSchema = baseEntity.extend({
  path: z.string().optional(),
  currentPath: z.string().optional(),
  Coding: z.array(codingSchema).optional(),
  VariableValue: z.array(z.lazy(() => variableValueSchema)).optional(),
});

export const textSourceSchema = baseSourceSchema
  .extend({
    richTextPath: z.string().optional(),
    plainTextPath: z.string().optional(),
    PlainTextContent: z.string().optional(),
    PlainTextSelection: z.array(plainTextSelectionSchema).optional(),
  })
  .refine((data) => {
    const hasContent = data["PlainTextContent"] !== undefined;
    const hasPath = data["plainTextPath"] !== undefined;
    return (hasContent || hasPath) && !(hasContent && hasPath);
  }, { message: "Exactly one of PlainTextContent or plainTextPath must be present" });

const coordinatesSchema: {
  firstX: z.ZodNumber;
  firstY: z.ZodNumber;
  secondX: z.ZodNumber;
  secondY: z.ZodNumber;
} = {
  firstX: z.number().int(),
  firstY: z.number().int(),
  secondX: z.number().int(),
  secondY: z.number().int(),
};

const timeRangeSchema: { begin: z.ZodNumber; end: z.ZodNumber } = {
  begin: z.number().int(),
  end: z.number().int(),
};

export const pictureSelectionSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = baseSelectionSchema.extend(
  coordinatesSchema,
);

export const pdfSelectionSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = baseSelectionSchema.extend({
  page: z.number().int(),
  ...coordinatesSchema,
  Representation: z.lazy(() => textSourceSchema).optional(),
});

export const audioSelectionSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = baseSelectionSchema.extend(
  timeRangeSchema,
);
export const videoSelectionSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = baseSelectionSchema.extend(
  timeRangeSchema,
);

export const syncPointSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  guid: guidField,
  timeStamp: z.number().int().optional(),
  position: z.number().int().optional(),
});

export const transcriptSelectionSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = baseSelectionSchema.extend({
  fromSyncPoint: optionalGuidField,
  toSyncPoint: optionalGuidField,
});

export const transcriptSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = baseEntity
  .extend({
    richTextPath: z.string().optional(),
    plainTextPath: z.string().optional(),
    PlainTextContent: z.string().optional(),
    SyncPoint: z.array(syncPointSchema).optional(),
    TranscriptSelection: z.array(transcriptSelectionSchema).optional(),
  })
  .refine((data) => {
    const hasContent = data["PlainTextContent"] !== undefined;
    const hasPath = data["plainTextPath"] !== undefined;
    return (hasContent || hasPath) && !(hasContent && hasPath);
  }, { message: "Exactly one of PlainTextContent or plainTextPath must be present" });

export const pictureSourceSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = baseSourceSchema.extend({
  TextDescription: textSourceSchema.optional(),
  PictureSelection: z.array(pictureSelectionSchema).optional(),
});

export const pdfSourceSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = baseSourceSchema.extend({
  PDFSelection: z.array(pdfSelectionSchema).optional(),
  Representation: textSourceSchema.optional(),
});

export const audioSourceSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = baseSourceSchema.extend({
  Transcript: z.array(transcriptSchema).optional(),
  AudioSelection: z.array(audioSelectionSchema).optional(),
});

export const videoSourceSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = baseSourceSchema.extend({
  Transcript: z.array(transcriptSchema).optional(),
  VideoSelection: z.array(videoSelectionSchema).optional(),
});

export const sourcesSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  TextSource: z.array(textSourceSchema).optional(),
  PictureSource: z.array(pictureSourceSchema).optional(),
  PDFSource: z.array(pdfSourceSchema).optional(),
  AudioSource: z.array(audioSourceSchema).optional(),
  VideoSource: z.array(videoSourceSchema).optional(),
});

export const variableTypeEnum: z.ZodTypeAny = z.enum(VARIABLE_TYPES);

export const variableSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  guid: guidField,
  name: z.string(),
  typeOfVariable: variableTypeEnum,
  Description: z.string().optional(),
});

export const variablesSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  Variable: z.array(variableSchema).optional(),
});

export const caseSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  guid: guidField,
  name: z.string().optional(),
  Description: z.string().optional(),
  CodeRef: z.array(refSchema).optional(),
  VariableValue: z.array(variableValueSchema).optional(),
  SourceRef: z.array(refSchema).optional(),
  SelectionRef: z.array(refSchema).optional(),
});

export const casesSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  Case: z.array(caseSchema).optional(),
});

export const setSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  guid: guidField,
  name: z.string(),
  Description: z.string().optional(),
  MemberCode: z.array(refSchema).optional(),
  MemberSource: z.array(refSchema).optional(),
  MemberNote: z.array(refSchema).optional(),
});

export const setsSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  Set: z.array(setSchema).optional(),
});

export const vertexSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  guid: guidField,
  representedGUID: optionalGuidField,
  name: z.string().optional(),
  firstX: z.number().int(),
  firstY: z.number().int(),
  secondX: z.number().int().optional(),
  secondY: z.number().int().optional(),
  shape: shapeEnum.optional(),
  color: colorField,
});

export const edgeSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  guid: guidField,
  representedGUID: optionalGuidField,
  name: z.string().optional(),
  sourceVertex: guidField,
  targetVertex: guidField,
  color: colorField,
  direction: directionEnum.optional(),
  lineStyle: z.enum(LINE_STYLES).optional(),
});

export const graphSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  guid: guidField,
  name: z.string().optional(),
  Vertex: z.array(vertexSchema).optional(),
  Edge: z.array(edgeSchema).optional(),
});

export const graphsSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  Graph: z.array(graphSchema).optional(),
});

export const linkSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  guid: guidField,
  name: z.string().optional(),
  direction: directionEnum.optional(),
  color: colorField,
  originGUID: optionalGuidField,
  targetGUID: optionalGuidField,
  NoteRef: z.array(refSchema).optional(),
});

export const linksSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  Link: z.array(linkSchema).optional(),
});

export const notesSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  Note: z.array(textSourceSchema).optional(),
});

export const projectMetaSchema: z.ZodObject<Record<string, z.ZodTypeAny>> = z.object({
  name: z.string(),
  origin: z.string().optional(),
  creatingUserGUID: optionalGuidField,
  creationDateTime: dateTimeField,
  modifyingUserGUID: optionalGuidField,
  modifiedDateTime: dateTimeField,
  basePath: z.string().optional(),
  xmlns: z.string().optional(),
  "xmlns:xsi": z.string().optional(),
  "xsi:schemaLocation": z.string().optional(),
});

export const projectSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    _attributes: projectMetaSchema,
    Users: usersSchema.optional(),
    CodeBook: codeBookSchema.optional(),
    Variables: variablesSchema.optional(),
    Cases: casesSchema.optional(),
    Sources: sourcesSchema.optional(),
    Notes: notesSchema.optional(),
    Links: linksSchema.optional(),
    Sets: setsSchema.optional(),
    Graphs: graphsSchema.optional(),
    Description: z.string().optional(),
    NoteRef: z.array(refSchema).optional(),
  })
);
