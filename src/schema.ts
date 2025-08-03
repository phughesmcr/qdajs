import { z } from "zod/v4";

// @deno-fmt-ignore
const guidPattern =
  /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})|(\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\})$/;
const rgbPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
// @deno-fmt-ignore
const isoDateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

// Common field schemas
const guidField = z.string().regex(guidPattern, "Must be a valid GUID");
const optionalGuidField = guidField.optional();
const dateTimeField = z.string().regex(isoDateTimePattern, "Must be a valid ISO 8601 datetime")
  .optional();
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

export const refSchema = z.object({
  targetGUID: guidField,
});

export const codingSchema = z.object({
  guid: guidField,
  creatingUser: optionalGuidField,
  creationDateTime: dateTimeField,
  CodeRef: refSchema,
  NoteRef: z.array(refSchema).optional(),
});

export const codeSchema: z.ZodType<unknown> = z.lazy(() =>
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

export const codeBookSchema = z.object({
  Codes: z.object({
    Code: z.array(codeSchema),
  }),
});

export const userSchema = z.object({
  guid: guidField,
  name: z.string().optional(),
  id: z.string().optional(),
});

export const usersSchema = z.object({
  User: z.array(userSchema),
});

const baseSelectionSchema = baseEntity.extend({
  Coding: z.array(codingSchema).optional(),
});

export const plainTextSelectionSchema = baseSelectionSchema.extend({
  startPosition: z.number().int(),
  endPosition: z.number().int(),
});

export const variableValueSchema = z
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

export const textSourceSchema = baseSourceSchema.extend({
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

export const pictureSelectionSchema = baseSelectionSchema.extend(coordinatesSchema);

export const pdfSelectionSchema = baseSelectionSchema.extend({
  page: z.number().int(),
  ...coordinatesSchema,
  Representation: z.lazy(() => textSourceSchema).optional(),
});

export const audioSelectionSchema = baseSelectionSchema.extend(timeRangeSchema);
export const videoSelectionSchema = baseSelectionSchema.extend(timeRangeSchema);

export const syncPointSchema = z.object({
  guid: guidField,
  timeStamp: z.number().int().optional(),
  position: z.number().int().optional(),
});

export const transcriptSelectionSchema = baseSelectionSchema.extend({
  fromSyncPoint: optionalGuidField,
  toSyncPoint: optionalGuidField,
});

export const transcriptSchema = baseEntity.extend({
  richTextPath: z.string().optional(),
  plainTextPath: z.string().optional(),
  PlainTextContent: z.string().optional(),
  SyncPoint: z.array(syncPointSchema).optional(),
  TranscriptSelection: z.array(transcriptSelectionSchema).optional(),
});

export const pictureSourceSchema = baseSourceSchema.extend({
  TextDescription: textSourceSchema.optional(),
  PictureSelection: z.array(pictureSelectionSchema).optional(),
});

export const pdfSourceSchema = baseSourceSchema.extend({
  PDFSelection: z.array(pdfSelectionSchema).optional(),
  Representation: textSourceSchema.optional(),
});

export const audioSourceSchema = baseSourceSchema.extend({
  Transcript: z.array(transcriptSchema).optional(),
  AudioSelection: z.array(audioSelectionSchema).optional(),
});

export const videoSourceSchema = baseSourceSchema.extend({
  Transcript: z.array(transcriptSchema).optional(),
  VideoSelection: z.array(videoSelectionSchema).optional(),
});

export const sourcesSchema = z.object({
  TextSource: z.array(textSourceSchema).optional(),
  PictureSource: z.array(pictureSourceSchema).optional(),
  PDFSource: z.array(pdfSourceSchema).optional(),
  AudioSource: z.array(audioSourceSchema).optional(),
  VideoSource: z.array(videoSourceSchema).optional(),
});

export const variableSchema = z.object({
  guid: guidField,
  name: z.string(),
  typeOfVariable: z.enum(["Text", "Boolean", "Integer", "Float", "Date", "DateTime"]),
  Description: z.string().optional(),
});

export const variablesSchema = z.object({
  Variable: z.array(variableSchema).optional(),
});

export const caseSchema = z.object({
  guid: guidField,
  name: z.string().optional(),
  Description: z.string().optional(),
  CodeRef: z.array(refSchema).optional(),
  VariableValue: z.array(variableValueSchema).optional(),
  SourceRef: z.array(refSchema).optional(),
  SelectionRef: z.array(refSchema).optional(),
});

export const casesSchema = z.object({
  Case: z.array(caseSchema).optional(),
});

export const setSchema = z.object({
  guid: guidField,
  name: z.string(),
  Description: z.string().optional(),
  MemberCode: z.array(refSchema).optional(),
  MemberSource: z.array(refSchema).optional(),
  MemberNote: z.array(refSchema).optional(),
});

export const setsSchema = z.object({
  Set: z.array(setSchema).optional(),
});

const shapeEnum = z.enum([
  "Person",
  "Oval",
  "Rectangle",
  "RoundedRectangle",
  "Star",
  "LeftTriangle",
  "RightTriangle",
  "UpTriangle",
  "DownTriangle",
  "Note",
]);

const directionEnum = z.enum(["Associative", "OneWay", "Bidirectional"]);

export const vertexSchema = z.object({
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

export const edgeSchema = z.object({
  guid: guidField,
  representedGUID: optionalGuidField,
  name: z.string().optional(),
  sourceVertex: guidField,
  targetVertex: guidField,
  color: colorField,
  direction: directionEnum.optional(),
  lineStyle: z.enum(["dotted", "dashed", "solid"]).optional(),
});

export const graphSchema = z.object({
  guid: guidField,
  name: z.string().optional(),
  Vertex: z.array(vertexSchema).optional(),
  Edge: z.array(edgeSchema).optional(),
});

export const graphsSchema = z.object({
  Graph: z.array(graphSchema).optional(),
});

export const linkSchema = z.object({
  guid: guidField,
  name: z.string().optional(),
  direction: directionEnum.optional(),
  color: colorField,
  originGUID: optionalGuidField,
  targetGUID: optionalGuidField,
  NoteRef: z.array(refSchema).optional(),
});

export const linksSchema = z.object({
  Link: z.array(linkSchema).optional(),
});

export const notesSchema = z.object({
  Note: z.array(textSourceSchema).optional(),
});

export const projectSchema = z.object({
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
});
