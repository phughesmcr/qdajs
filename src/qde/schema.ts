/**
 * QDE Zod Schemas
 *
 * One-to-one Zod object schemas for each interface declared in `src/qde/types.ts`.
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

// ENUMS
export const shapeEnum = z.enum<typeof SHAPES>(SHAPES);
export const directionEnum = z.enum<typeof DIRECTIONS>(DIRECTIONS);
export const lineStyleEnum = z.enum<typeof LINE_STYLES>(LINE_STYLES);
export const variableTypeEnum = z.enum<typeof VARIABLE_TYPES>(VARIABLE_TYPES);

// ATTRIBUTES

// Use project-wide GUID rules (more permissive than z.uuid to allow non-RFC versions and nil UUID)
export const guidField = z.string().regex(GUID_REGEX, "Must be a valid GUID/UUID");
export const optionalGuidField = guidField.optional();
export const colorField = z.string().regex(RGB_REGEX, "Must be a valid RGB color");
export const dateField = z.string().regex(ISO_DATE_REGEX, "Must be a valid ISO 8601 date");
export const dateTimeField = z.string().regex(ISO_DATETIME_REGEX, "Must be a valid ISO 8601 datetime");

// Fundamental building blocks
export const identifiedSchema = z.object({ guid: guidField });
export const nameableSchema = z.object({ name: z.string().optional() });
export const describableSchema = z.object({ Description: z.string().optional() });
export const colorableSchema = z.object({ color: colorField.optional() });

// Shapes for composition without relying on .shape from typed Zod objects
const identifiedShape = { guid: guidField } as const;
const nameableShape = { name: z.string().optional() } as const;
const describableShape = { Description: z.string().optional() } as const;
const colorableShape = { color: colorField.optional() } as const;
const auditCreatorAttributesShape = {
  creatingUser: optionalGuidField,
  creationDateTime: dateTimeField.optional(),
} as const;
const auditModifierAttributesShape = {
  modifyingUser: optionalGuidField,
  modifiedDateTime: dateTimeField.optional(),
} as const;
const auditAttributesShape = {
  ...auditCreatorAttributesShape,
  ...auditModifierAttributesShape,
} as const;

export const refJsonSchema = z.object({ targetGUID: guidField });

const withNoteRefsShape = { NoteRef: z.array(refJsonSchema).optional() } as const;
export const withNoteRefsSchema = z.object(withNoteRefsShape);

export const usersJsonSchema = z.object({ User: z.array(z.lazy(() => userJsonSchema)) });

// Code (recursive)
export const codeJsonSchema: z.ZodType<unknown> = z.lazy((): z.ZodType<unknown> =>
  z.object({
    _attributes: z.object({
      ...identifiedShape,
      ...nameableShape,
      ...colorableShape,
      isCodable: z.boolean(),
    }),
    ...describableShape,
    ...withNoteRefsShape,
    Code: z.array(z.lazy((): z.ZodType<unknown> => codeJsonSchema)).optional(),
  }) as z.ZodType<unknown>
);

export const codesJsonSchema = z.object({ Code: z.array(z.lazy(() => codeJsonSchema)).optional() });

// Sets
export const setJsonSchema = z.object({
  _attributes: z.object({
    ...identifiedShape,
    ...nameableShape,
  }),
  ...describableShape,
  MemberCode: z.array(refJsonSchema).optional(),
  MemberSource: z.array(refJsonSchema).optional(),
  MemberNote: z.array(refJsonSchema).optional(),
});

export const setsJsonSchema = z.object({ Set: z.array(z.lazy(() => setJsonSchema)).optional() });

export const codebookJsonSchema = z.object({ Codes: codesJsonSchema, Sets: setsJsonSchema.optional() });

export const variablesJsonSchema = z.object({ Variable: z.array(z.lazy(() => variableJsonSchema)).optional() });

export const casesJsonSchema = z.object({ Case: z.array(z.lazy(() => caseJsonSchema)).optional() });

export const sourcesJsonSchema = z.object({
  TextSource: z.array(z.lazy(() => textSourceJsonSchema)).optional(),
  PictureSource: z.array(z.lazy(() => pictureSourceJsonSchema)).optional(),
  PDFSource: z.array(z.lazy(() => pdfSourceJsonSchema)).optional(),
  AudioSource: z.array(z.lazy(() => audioSourceJsonSchema)).optional(),
  VideoSource: z.array(z.lazy(() => videoSourceJsonSchema)).optional(),
});

export const notesJsonSchema = z.object({ Note: z.array(z.lazy(() => textSourceJsonSchema)).optional() });

export const linksJsonSchema = z.object({ Link: z.array(z.lazy(() => linkJsonSchema)).optional() });

export const graphsJsonSchema = z.object({ Graph: z.array(z.lazy(() => graphJsonSchema)).optional() });

// Project
export const projectAttributesSchema = z.object({
  ...nameableShape,
  ...auditAttributesShape,
  origin: z.string().optional(),
  basePath: z.string().optional(),
  xmlns: z.string().optional(),
  "xmlns:xsi": z.string().optional(),
  "xsi:schemaLocation": z.string().optional(),
});

export const projectJsonSchema = z.object({
  _attributes: projectAttributesSchema,
  Users: usersJsonSchema.optional(),
  CodeBook: codebookJsonSchema.optional(),
  Variables: variablesJsonSchema.optional(),
  Cases: casesJsonSchema.optional(),
  Sources: sourcesJsonSchema.optional(),
  Notes: notesJsonSchema.optional(),
  Links: linksJsonSchema.optional(),
  Sets: setsJsonSchema.optional(),
  Graphs: graphsJsonSchema.optional(),
  ...describableShape,
  ...withNoteRefsShape,
});

// Coding
export const codingJsonSchema = z.object({
  _attributes: z.object({
    ...identifiedShape,
    ...auditCreatorAttributesShape,
  }),
  CodeRef: refJsonSchema.optional(),
  ...withNoteRefsShape,
});

// User
export const userJsonSchema = z.object({
  _attributes: z.object({
    ...identifiedShape,
    ...nameableShape,
    id: z.string().optional(),
  }),
});

// Selections: base helpers (non-exported)
function buildBaseSelectionSchema<T extends z.ZodRawShape>(extraAttributes: T) {
  return z.object({
    _attributes: z.object({
      ...auditAttributesShape,
      ...identifiedShape,
      ...nameableShape,
      ...extraAttributes,
    }),
    ...describableShape,
    ...withNoteRefsShape,
    Coding: z.array(codingJsonSchema).optional(),
  });
}

export const plainTextSelectionJsonSchema = buildBaseSelectionSchema({
  startPosition: z.number().int(),
  endPosition: z.number().int(),
});

export const coordinatesSchema = z.object({
  firstX: z.number(),
  firstY: z.number(),
  secondX: z.number(),
  secondY: z.number(),
});

export const timeRangeSchema = z.object({
  begin: z.number(),
  end: z.number(),
});

export const pictureSelectionJsonSchema = buildBaseSelectionSchema(coordinatesSchema.shape);

export const pdfSelectionJsonSchema = z.object({
  ...buildBaseSelectionSchema({
    page: z.number().int(),
    ...coordinatesSchema.shape,
  }).shape,
  Representation: z.lazy(() => textSourceJsonSchema).optional(),
});

export const audioSelectionJsonSchema = buildBaseSelectionSchema(timeRangeSchema.shape);

export const videoSelectionJsonSchema = buildBaseSelectionSchema(timeRangeSchema.shape);

export const syncPointJsonSchema = z.object({
  _attributes: z.object({
    ...identifiedShape,
    timeStamp: z.number().int().optional(),
    position: z.number().int().optional(),
  }),
});

export const transcriptSelectionJsonSchema = buildBaseSelectionSchema({
  fromSyncPoint: optionalGuidField,
  toSyncPoint: optionalGuidField,
});

// VariableValue
export const variableValueJsonSchema = z
  .object({
    VariableRef: refJsonSchema,
    TextValue: z.string().optional(),
    BooleanValue: z.boolean().optional(),
    IntegerValue: z.number().int().optional(),
    FloatValue: z.number().optional(),
    DateValue: dateField.optional(),
    DateTimeValue: dateTimeField.optional(),
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
      ].filter((field) => (data as Record<string, unknown>)[field] !== undefined).length === 1,
    { message: "Exactly one value type must be present (XSD choice constraint)" },
  );

// Sources: base helpers (non-exported)
function buildBaseSourceSchema<T extends z.ZodRawShape>(extraAttributes: T) {
  return z.object({
    _attributes: z.object({
      ...identifiedShape,
      ...nameableShape,
      ...auditAttributesShape,
      ...extraAttributes,
    }),
    ...describableShape,
    ...withNoteRefsShape,
    Coding: z.array(codingJsonSchema).optional(),
    VariableValue: z.array(variableValueJsonSchema).optional(),
  });
}

export const locatableSchema = z.object({
  path: z.string().optional(),
  currentPath: z.string().optional(),
});

export const textSourceJsonSchema = buildBaseSourceSchema({
  richTextPath: z.string().optional(),
  plainTextPath: z.string().optional(),
}).extend({
  PlainTextContent: z.string().optional(),
  PlainTextSelection: z.array(z.lazy(() => plainTextSelectionJsonSchema)).optional(),
}).refine((data) => {
  const hasContent = (data as Record<string, unknown>)["PlainTextContent"] !== undefined;
  const hasPath = (data as { _attributes: { plainTextPath?: unknown } })._attributes.plainTextPath !== undefined;
  return (hasContent || hasPath) && !(hasContent && hasPath);
}, { message: "Exactly one of PlainTextContent or plainTextPath must be present" });

export const pictureSourceJsonSchema = buildBaseSourceSchema(locatableSchema.shape).extend({
  TextDescription: z.lazy(() => textSourceJsonSchema).optional(),
  PictureSelection: z.array(z.lazy(() => pictureSelectionJsonSchema)).optional(),
});

export const pdfSourceJsonSchema = buildBaseSourceSchema(locatableSchema.shape).extend({
  PDFSelection: z.array(z.lazy(() => pdfSelectionJsonSchema)).optional(),
  Representation: z.lazy(() => textSourceJsonSchema).optional(),
});

export const audioSourceJsonSchema = buildBaseSourceSchema(locatableSchema.shape).extend({
  Transcript: z.array(z.lazy(() => transcriptJsonSchema)).optional(),
  AudioSelection: z.array(z.lazy(() => audioSelectionJsonSchema)).optional(),
});

export const videoSourceJsonSchema = buildBaseSourceSchema(locatableSchema.shape).extend({
  Transcript: z.array(z.lazy(() => transcriptJsonSchema)).optional(),
  VideoSelection: z.array(z.lazy(() => videoSelectionJsonSchema)).optional(),
});

export const transcriptJsonSchema = buildBaseSourceSchema({
  richTextPath: z.string().optional(),
  plainTextPath: z.string().optional(),
}).extend({
  PlainTextContent: z.string().optional(),
  SyncPoint: z.array(z.lazy(() => syncPointJsonSchema)).optional(),
  TranscriptSelection: z.array(z.lazy(() => transcriptSelectionJsonSchema)).optional(),
}).refine((data) => {
  const hasContent = (data as Record<string, unknown>)["PlainTextContent"] !== undefined;
  const hasPath = (data as { _attributes: { plainTextPath?: unknown } })._attributes.plainTextPath !== undefined;
  return (hasContent || hasPath) && !(hasContent && hasPath);
}, { message: "Exactly one of PlainTextContent or plainTextPath must be present" });

// Variables
export const variableJsonSchema = z.object({
  _attributes: z.object({
    ...identifiedShape,
    ...nameableShape,
    typeOfVariable: variableTypeEnum,
  }),
  ...describableShape,
});

// Cases
export const caseJsonSchema = z.object({
  _attributes: z.object({
    ...identifiedShape,
    ...nameableShape,
  }),
  ...describableShape,
  CodeRef: z.array(refJsonSchema).optional(),
  VariableValue: z.array(variableValueJsonSchema).optional(),
  SourceRef: z.array(refJsonSchema).optional(),
  SelectionRef: z.array(refJsonSchema).optional(),
});

// Graphs
export const vertexJsonSchema = z.object({
  _attributes: z.object({
    ...identifiedShape,
    ...nameableShape,
    ...colorableShape,
    representedGUID: optionalGuidField,
    firstX: z.number(),
    firstY: z.number(),
    secondX: z.number().optional(),
    secondY: z.number().optional(),
    shape: shapeEnum.optional(),
  }),
});

export const edgeJsonSchema = z.object({
  _attributes: z.object({
    ...identifiedShape,
    ...nameableShape,
    ...colorableShape,
    representedGUID: optionalGuidField,
    sourceVertex: guidField,
    targetVertex: guidField,
    direction: directionEnum.optional(),
    lineStyle: lineStyleEnum.optional(),
  }),
});

export const graphJsonSchema = z.object({
  _attributes: z.object({
    ...identifiedShape,
    ...nameableShape,
  }),
  Vertex: z.array(vertexJsonSchema).optional(),
  Edge: z.array(edgeJsonSchema).optional(),
});

export const graphsWrapperJsonSchema = graphsJsonSchema;

// Links
export const linkJsonSchema = z.object({
  _attributes: z.object({
    ...identifiedShape,
    ...nameableShape,
    ...colorableShape,
    direction: directionEnum.optional(),
    originGUID: optionalGuidField,
    targetGUID: optionalGuidField,
  }),
  ...withNoteRefsShape,
});

export const notesWrapperJsonSchema = notesJsonSchema;

// Text notes alias
export const noteJsonSchema = z.lazy(() => textSourceJsonSchema);
