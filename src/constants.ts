import type { JsonValue } from "./types.ts";

/** Schema-aware performance optimization sets */
export const referenceElements = new Set([
  "CodeRef",
  "NoteRef",
  "SourceRef",
  "SelectionRef",
  "VariableRef",
]);

export const simpleTextElements = new Set([
  "Description",
  "PlainTextContent",
  "TextValue",
]);

export const valueChoiceElements = new Set([
  "TextValue",
  "BooleanValue",
  "IntegerValue",
  "FloatValue",
  "DateValue",
  "DateTimeValue",
]);

/** Elements that should always be arrays according to the schema */
export const alwaysArrays = new Set([
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
  "Vertex",
  "Edge",
]);

/**
 * Elements that need _attributes object according to the schema
 */
export const elementsWithAttributes = new Set(["Project", "Code"]);

/**
 * Fields that should be XML elements (not attributes) even when they contain primitive values
 * Based on schema.xsd element definitions
 */
export const elementFields = new Set([
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

export const sourceTypes = [
  "TextSource",
  "PictureSource",
  "PDFSource",
  "AudioSource",
  "VideoSource",
];

export const selectionTypes = [
  "PlainTextSelection",
  "PictureSelection",
  "PDFSelection",
  "AudioSelection",
  "VideoSelection",
  "TranscriptSelection",
];

/** Cache for common value conversions */
export const VALUE_CACHE = new Map<string, JsonValue>([
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

// Pre-created error messages to avoid string operations during errors
export const ERROR_NO_ROOT = "No root element found in QDE document";
export const ERROR_INVALID_PROJECT = "Invalid QDE project: root element must be an object";
export const ERROR_MISSING_NAME = "Invalid QDE project: missing Project element or name attribute";
export const ERROR_SCHEMA_FAILED = "Schema validation failed";

// Pre-compiled character escape map for XML
export const XML_ESCAPE_MAP = new Map<string, string>([
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&apos;"],
]);

export const XML_ESCAPE_REGEX = /[&<>"']/g;
