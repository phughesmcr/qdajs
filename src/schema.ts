import { z } from "zod/v4";
import {
  DIRECTIONS,
  guidPattern,
  isoDatePattern,
  isoDateTimePattern,
  LINE_STYLES,
  rgbPattern,
  SHAPES,
  VARIABLE_TYPES,
} from "./constants.ts";

// Enums
const shapeEnum = z.enum(SHAPES);
const directionEnum = z.enum(DIRECTIONS);

// Common field schemas
const guidField = z.string().regex(guidPattern, "Must be a valid GUID");
const optionalGuidField = guidField.optional();
const dateTimeField = z.string().regex(isoDateTimePattern, "Must be a valid ISO 8601 datetime").optional();
const colorField = z.string().regex(rgbPattern, "Must be a valid RGB color").optional();

// Common metadata fields shared across entities
const commonMetadata = {
  creatingUser: optionalGuidField,
  creationDateTime: dateTimeField,
  modifyingUser: optionalGuidField,
  modifiedDateTime: dateTimeField,
  Description: z.string().optional(),
  NoteRef: z.array(z.object({ targetGUID: guidField })).optional(),
};

// Base entity with GUID and name
const baseEntity = z.object({
  guid: guidField,
  name: z.string().optional(),
  ...commonMetadata,
});

const refSchema = z.object({
  targetGUID: guidField,
});

const codingSchema = z.object({
  guid: guidField,
  creatingUser: optionalGuidField,
  creationDateTime: dateTimeField,
  CodeRef: refSchema,
  NoteRef: z.array(refSchema).optional(),
});

const codeSchema = z.lazy(() =>
  z.object({
    _attributes: z.object({
      guid: guidField,
      name: z.string(),
      isCodable: z.boolean(),
      color: colorField,
    }),
    Description: z.string().optional(),
    NoteRef: z.array(refSchema).optional(),
    Code: z.array(z.lazy((): z.ZodType<unknown> => codeSchema)).optional(),
  })
);

const codeBookSchema = z.object({
  Codes: z.object({
    Code: z.array(codeSchema),
  }),
});

const userSchema = z.object({
  guid: guidField,
  name: z.string().optional(),
  id: z.string().optional(),
});

const usersSchema = z.object({
  User: z.array(userSchema),
});

const baseSelectionSchema = baseEntity.extend({
  Coding: z.array(codingSchema).optional(),
});

const plainTextSelectionSchema = baseSelectionSchema.extend({
  startPosition: z.number().int(),
  endPosition: z.number().int(),
});

const variableValueSchema = z
  .object({
    VariableRef: refSchema,
    TextValue: z.string().optional(),
    BooleanValue: z.boolean().optional(),
    IntegerValue: z.number().int().optional(),
    FloatValue: z.number().optional(),
    DateValue: z.string().regex(isoDatePattern, "Must be a valid ISO 8601 date").optional(),
    DateTimeValue: dateTimeField,
  })
  .refine(
    (data) =>
      ["TextValue", "BooleanValue", "IntegerValue", "FloatValue", "DateValue", "DateTimeValue"]
        .filter((field) => data[field as keyof typeof data] !== undefined).length === 1,
    { message: "Exactly one value type must be present (XSD choice constraint)" },
  );

const baseSourceSchema = baseEntity.extend({
  path: z.string().optional(),
  currentPath: z.string().optional(),
  Coding: z.array(codingSchema).optional(),
  VariableValue: z.array(z.lazy(() => variableValueSchema)).optional(),
});

const textSourceSchema = baseSourceSchema.extend({
  richTextPath: z.string().optional(),
  plainTextPath: z.string().optional(),
  PlainTextContent: z.string().optional(),
  PlainTextSelection: z.array(plainTextSelectionSchema).optional(),
});

const coordinatesSchema = {
  firstX: z.number().int(),
  firstY: z.number().int(),
  secondX: z.number().int(),
  secondY: z.number().int(),
};

const timeRangeSchema = {
  begin: z.number().int(),
  end: z.number().int(),
};

const pictureSelectionSchema = baseSelectionSchema.extend(coordinatesSchema);

const pdfSelectionSchema = baseSelectionSchema.extend({
  page: z.number().int(),
  ...coordinatesSchema,
  Representation: z.lazy(() => textSourceSchema).optional(),
});

const audioSelectionSchema = baseSelectionSchema.extend(timeRangeSchema);
const videoSelectionSchema = baseSelectionSchema.extend(timeRangeSchema);

const syncPointSchema = z.object({
  guid: guidField,
  timeStamp: z.number().int().optional(),
  position: z.number().int().optional(),
});

const transcriptSelectionSchema = baseSelectionSchema.extend({
  fromSyncPoint: optionalGuidField,
  toSyncPoint: optionalGuidField,
});

const transcriptSchema = baseEntity.extend({
  richTextPath: z.string().optional(),
  plainTextPath: z.string().optional(),
  PlainTextContent: z.string().optional(),
  SyncPoint: z.array(syncPointSchema).optional(),
  TranscriptSelection: z.array(transcriptSelectionSchema).optional(),
});

const pictureSourceSchema = baseSourceSchema.extend({
  TextDescription: textSourceSchema.optional(),
  PictureSelection: z.array(pictureSelectionSchema).optional(),
});

const pdfSourceSchema = baseSourceSchema.extend({
  PDFSelection: z.array(pdfSelectionSchema).optional(),
  Representation: textSourceSchema.optional(),
});

const audioSourceSchema = baseSourceSchema.extend({
  Transcript: z.array(transcriptSchema).optional(),
  AudioSelection: z.array(audioSelectionSchema).optional(),
});

const videoSourceSchema = baseSourceSchema.extend({
  Transcript: z.array(transcriptSchema).optional(),
  VideoSelection: z.array(videoSelectionSchema).optional(),
});

const sourcesSchema = z.object({
  TextSource: z.array(textSourceSchema).optional(),
  PictureSource: z.array(pictureSourceSchema).optional(),
  PDFSource: z.array(pdfSourceSchema).optional(),
  AudioSource: z.array(audioSourceSchema).optional(),
  VideoSource: z.array(videoSourceSchema).optional(),
});

const variableSchema = z.object({
  guid: guidField,
  name: z.string(),
  typeOfVariable: z.enum(VARIABLE_TYPES),
  Description: z.string().optional(),
});

const variablesSchema = z.object({
  Variable: z.array(variableSchema).optional(),
});

const caseSchema = z.object({
  guid: guidField,
  name: z.string().optional(),
  Description: z.string().optional(),
  CodeRef: z.array(refSchema).optional(),
  VariableValue: z.array(variableValueSchema).optional(),
  SourceRef: z.array(refSchema).optional(),
  SelectionRef: z.array(refSchema).optional(),
});

const casesSchema = z.object({
  Case: z.array(caseSchema).optional(),
});

const setSchema = z.object({
  guid: guidField,
  name: z.string(),
  Description: z.string().optional(),
  MemberCode: z.array(refSchema).optional(),
  MemberSource: z.array(refSchema).optional(),
  MemberNote: z.array(refSchema).optional(),
});

const setsSchema = z.object({
  Set: z.array(setSchema).optional(),
});

const vertexSchema = z.object({
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

const edgeSchema = z.object({
  guid: guidField,
  representedGUID: optionalGuidField,
  name: z.string().optional(),
  sourceVertex: guidField,
  targetVertex: guidField,
  color: colorField,
  direction: directionEnum.optional(),
  lineStyle: z.enum(LINE_STYLES).optional(),
});

const graphSchema = z.object({
  guid: guidField,
  name: z.string().optional(),
  Vertex: z.array(vertexSchema).optional(),
  Edge: z.array(edgeSchema).optional(),
});

const graphsSchema = z.object({
  Graph: z.array(graphSchema).optional(),
});

const linkSchema = z.object({
  guid: guidField,
  name: z.string().optional(),
  direction: directionEnum.optional(),
  color: colorField,
  originGUID: optionalGuidField,
  targetGUID: optionalGuidField,
  NoteRef: z.array(refSchema).optional(),
});

const linksSchema = z.object({
  Link: z.array(linkSchema).optional(),
});

const notesSchema = z.object({
  Note: z.array(textSourceSchema).optional(),
});

export const projectSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    _attributes: z.object({
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
    }),
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

export type Project = z.infer<typeof projectSchema>;
