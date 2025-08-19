/**
 * Shared constants
 * @module
 */

/** Schema-aware performance optimization sets */
export const REF_ELEMENTS = new Set([
  "CodeRef",
  "NoteRef",
  "SourceRef",
  "SelectionRef",
  "VariableRef",
  // Set membership elements behave like references (attribute-only with targetGUID)
  "MemberCode",
  "MemberSource",
  "MemberNote",
]);

export const TEXT_ELEMENTS = new Set([
  "Description",
  "PlainTextContent",
  "TextValue",
]);

export const VALUE_CHOICE_ELEMENTS = new Set([
  "TextValue",
  "BooleanValue",
  "IntegerValue",
  "FloatValue",
  "DateValue",
  "DateTimeValue",
]);

/** Elements that should always be arrays according to the schema */
export const ALWAYS_ARRAYS = new Set([
  "User",
  "Code",
  "Variable",
  "Case",
  "Set",
  "Graph",
  "Link",
  "Note",
  "TextSource",
  "PictureSource",
  "PDFSource",
  "AudioSource",
  "VideoSource",
  "PlainTextSelection",
  "PictureSelection",
  "PDFSelection",
  "AudioSelection",
  "VideoSelection",
  "TranscriptSelection",
  "Transcript",
  "SyncPoint",
  "Coding",
  "NoteRef",
  // CodeRef should be single object per Coding, not array
  // VariableRef should be single object per VariableValue, not array
  "SourceRef",
  "SelectionRef",
  "VariableValue",
  // Set membership elements should always be arrays
  "MemberCode",
  "MemberSource",
  "MemberNote",
  "Vertex",
  "Edge",
]);

/**
 * Elements that need _attributes object according to the schema
 */
export const ELEMENTS_WITH_ATTRIBUTES = new Set(["Project", "Code"]);

/**
 * Fields that should be XML elements (not attributes) even when they contain primitive values
 * Based on schema.xsd element definitions
 */
export const ELEMENT_FIELDS = new Set([
  // Core container elements
  "Users",
  "CodeBook",
  "Variables",
  "Cases",
  "Sources",
  "Notes",
  "Links",
  "Sets",
  "Graphs",
  "Codes",

  // Content elements
  "Description",
  "PlainTextContent",
  "TextDescription",
  "Representation",

  // Value elements
  "TextValue",
  "BooleanValue",
  "IntegerValue",
  "FloatValue",
  "DateValue",
  "DateTimeValue",

  // Reference elements
  "NoteRef",
  "CodeRef",
  "SourceRef",
  "SelectionRef",
  "VariableRef",

  // Collection elements
  "User",
  "Code",
  "Case",
  "Variable",
  "VariableValue",
  "Set",
  "TextSource",
  "PictureSource",
  "PDFSource",
  "AudioSource",
  "VideoSource",
  "PlainTextSelection",
  "PictureSelection",
  "PDFSelection",
  "AudioSelection",
  "VideoSelection",
  "TranscriptSelection",
  "Transcript",
  "SyncPoint",
  "Coding",
  "Graph",
  "Vertex",
  "Edge",
  "Note",
  "Link",

  // Member elements
  "MemberCode",
  "MemberSource",
  "MemberNote",
]);

export const SOURCE_TYPES = [
  "TextSource",
  "PictureSource",
  "PDFSource",
  "AudioSource",
  "VideoSource",
];

export const SELECTION_TYPES = [
  "PlainTextSelection",
  "PictureSelection",
  "PDFSelection",
  "AudioSelection",
  "VideoSelection",
  "TranscriptSelection",
];

/** Cache for common value conversions */
export const VALUE_CACHE = new Map<string, unknown>([
  ["true", true],
  ["false", false],
  ["0", 0],
  ["1", 1],
  ["-1", -1],
  ["", ""],
]);

// Reuse objects and cache regex patterns for performance
export const EMPTY_OBJECT = {};
export const FLOAT_REGEX = /^-?\d*\.\d+$/;
export const INT_REGEX = /^-?\d+$/;
export const RGB_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
// @deno-fmt-ignore
export const GUID_REGEX = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})|(\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\})$/;

// QDE constants

export const SHAPES = [
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
] as const;

export const DIRECTIONS = ["Associative", "OneWay", "Bidirectional"] as const;

export const VARIABLE_TYPES = ["Text", "Boolean", "Integer", "Float", "Date", "DateTime"] as const;

export const LINE_STYLES = ["dotted", "dashed", "solid"] as const;
