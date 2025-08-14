export * from "./audio-source.ts";
export * from "./pdf-source.ts";
export * from "./picture-source.ts";
export * from "./source-base.ts";
export * from "./text-source.ts";
export * from "./transcript.ts";
export * from "./video-source.ts";
export type AnySource =
  | import("./text-source.ts").TextSource
  | import("./picture-source.ts").PictureSource
  | import("./pdf-source.ts").PDFSource
  | import("./audio-source.ts").AudioSource
  | import("./video-source.ts").VideoSource;
