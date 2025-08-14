export * from "./audio-selection.ts";
export * from "./pdf-selection.ts";
export * from "./picture-selection.ts";
export * from "./plain-text-selection.ts";
export * from "./selection-base.ts";
export * from "./transcript-selection.ts";
export * from "./video-selection.ts";
export type AnySelection =
  | import("./plain-text-selection.ts").PlainTextSelection
  | import("./picture-selection.ts").PictureSelection
  | import("./pdf-selection.ts").PDFSelection
  | import("./audio-selection.ts").AudioSelection
  | import("./video-selection.ts").VideoSelection
  | import("./transcript-selection.ts").TranscriptSelection;
