import { BlobReader, BlobWriter, type Entry, TextReader, ZipWriter } from "@zip-js/zip-js";

export type QdpxPacker = {
  entries: Entry[];
  readProjectQde: () => Promise<string>;
  extractAll: () => AsyncGenerator<ArrayBuffer>;
  close: () => Promise<void>;
};

export type PackQdpxOptions = {
  password?: string;
  signal?: AbortSignal;
  contentEncoding?: string;
  filenameEncoding?: string;
};

export type SourceFile = {
  path: string;
  content: ArrayBuffer | string | Blob;
  mimeType?: string;
};

function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  const mimeMap: Record<string, string> = {
    // Text formats
    "txt": "text/plain",
    "rtf": "application/rtf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "doc": "application/msword",
    "html": "text/html",
    "htm": "text/html",

    // Image formats
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "bmp": "image/bmp",
    "tiff": "image/tiff",
    "tif": "image/tiff",
    "webp": "image/webp",
    "svg": "image/svg+xml",

    // PDF
    "pdf": "application/pdf",

    // Audio formats
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "flac": "audio/flac",
    "m4a": "audio/mp4",
    "aac": "audio/aac",
    "wma": "audio/x-ms-wma",

    // Video formats
    "mp4": "video/mp4",
    "avi": "video/x-msvideo",
    "mov": "video/quicktime",
    "wmv": "video/x-ms-wmv",
    "flv": "video/x-flv",
    "webm": "video/webm",
    "mkv": "video/x-matroska",
    "m4v": "video/x-m4v",
  };

  return mimeMap[ext || ""] || "application/octet-stream";
}

function getQdaSourceType(mimeType: string): string {
  if (mimeType.startsWith("text/") || mimeType.includes("document") || mimeType.includes("rtf")) {
    return "TextSource";
  }
  if (mimeType.startsWith("image/")) {
    return "PictureSource";
  }
  if (mimeType === "application/pdf") {
    return "PDFSource";
  }
  if (mimeType.startsWith("audio/")) {
    return "AudioSource";
  }
  if (mimeType.startsWith("video/")) {
    return "VideoSource";
  }
  // Default to TextSource for unknown types
  return "TextSource";
}

async function addTextFile(zipWriter: ZipWriter<Blob>, filePath: string, text: string) {
  const textReader = new TextReader(text);
  await zipWriter.add(filePath, textReader);
  return zipWriter;
}

async function addSourceFile(zipWriter: ZipWriter<Blob>, sourceFile: SourceFile) {
  let reader;

  if (typeof sourceFile.content === "string") {
    reader = new TextReader(sourceFile.content);
  } else if (sourceFile.content instanceof ArrayBuffer) {
    const blob = new Blob([sourceFile.content], {
      type: sourceFile.mimeType || getMimeTypeFromExtension(sourceFile.path),
    });
    reader = new BlobReader(blob);
  } else if (sourceFile.content instanceof Blob) {
    reader = new BlobReader(sourceFile.content);
  } else {
    throw new Error(`Unsupported content type for ${sourceFile.path}`);
  }

  await zipWriter.add(sourceFile.path, reader);
  return zipWriter;
}

async function zip(
  qde: string,
  sources: SourceFile[],
  opts: PackQdpxOptions = {},
): Promise<Blob> {
  const zipFileWriter = new BlobWriter();
  const zipWriter = new ZipWriter(zipFileWriter, opts);

  // Add the project.qde file
  await addTextFile(zipWriter, "project.qde", qde);

  // Add all source files
  for (const source of sources) {
    await addSourceFile(zipWriter, source);
  }

  await zipWriter.close();
  return zipFileWriter.getData();
}

export async function pack(
  qde: string,
  sources: SourceFile[] = [],
  opts: PackQdpxOptions = {},
): Promise<Blob> {
  return await zip(qde, sources, opts);
}

export { getMimeTypeFromExtension, getQdaSourceType, zip };
