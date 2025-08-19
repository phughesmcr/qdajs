/**
 * QDPX Archive Packing
 *
 * QDPX packing module for creating QDE project archives with source files.
 * Provides comprehensive validation, REFI-QDA compliance checking, and efficient
 * ZIP file creation with proper MIME type handling.
 *
 * Features REFI-QDA standard validation for supported file formats:
 * - Text: .txt (UTF-8), .docx (Office Open XML)
 * - Images: .jpg/.jpeg, .png
 * - Documents: .pdf
 * - Audio/Video: .m4a, .mp4 (recommended), others stored as-is
 *
 * Automatically organizes files in proper QDPX structure with project.qde
 * at root and source files in sources/ directory.
 *
 * @module
 */

import { BlobReader, BlobWriter, terminateWorkers, TextReader, ZipWriter } from "@zip-js/zip-js";

import { jsonToQde } from "../qde/jsonToXml.ts";
import type { ProjectJson } from "../qde/types.ts";
import { validateQdeJson } from "../qde/validate.ts";
import { qdeToJson } from "../qde/xmlToJson.ts";
import type { Result } from "../types.ts";

export type PackQdpxOptions = {
  password?: string;
  signal?: AbortSignal;
  contentEncoding?: string;
  filenameEncoding?: string;

  validateProjectQde?: boolean;
  validateSources?: boolean;
};

export type SourceFile = {
  path: string;
  content: ArrayBuffer | string | Blob;
  mimeType?: string;
};

export type ValidationResult = {
  isValid: boolean;
  warnings: string[];
  errors: string[];
};

function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  const mimeMap: Record<string, string> = {
    // REFI-QDA Standard: Plain Text (UTF-8)
    "txt": "text/plain",

    // REFI-QDA Standard: Styled text (Office Open XML)
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // REFI-QDA Standard: PDF Documents
    "pdf": "application/pdf",

    // REFI-QDA Standard: Image formats (JPEG and PNG only)
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",

    // REFI-QDA Standard: Audio & Video (recommended formats)
    "mp4": "video/mp4", // h264 encoded video (recommended)
    "m4a": "audio/mp4", // audio (recommended)

    // Other common audio/video formats (stored as-is per standard)
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "flac": "audio/flac",
    "aac": "audio/aac",
    "avi": "video/x-msvideo",
    "mov": "video/quicktime",
    "wmv": "video/x-ms-wmv",
    "webm": "video/webm",
    "mkv": "video/x-matroska",
    "m4v": "video/x-m4v",
  };

  return mimeMap[ext || ""] || "application/octet-stream";
}

function validateSourceFile(sourceFile: SourceFile): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // QDPX spec requires flat source file structure (no subdirectories in the filename itself)
  // Note: Files will be placed in sources/ directory, but individual filenames should be flat
  if (sourceFile.path.includes("/") || sourceFile.path.includes("\\")) {
    errors.push(
      "Source file paths must be flat (no subdirectories in filename) - files are automatically placed in sources/ directory",
    );
  }

  const ext = sourceFile.path.toLowerCase().split(".").pop() || "";
  const detectedMimeType = getMimeTypeFromExtension(sourceFile.path);
  const actualMimeType = sourceFile.mimeType || detectedMimeType;

  // REFI-QDA Standard validation
  switch (actualMimeType) {
    case "text/plain":
      if (ext !== "txt") {
        errors.push(`Plain text files must have .txt extension, found: .${ext}`);
      }
      break;

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      if (ext !== "docx") {
        errors.push(`Styled text files must have .docx extension, found: .${ext}`);
      }
      // TODO: Detect plain text representation for DOCX files
      // warnings.push("DOCX files should be accompanied by plain text representation for text selections");
      break;

    case "application/pdf":
      if (ext !== "pdf") {
        errors.push(`PDF files must have .pdf extension, found: .${ext}`);
      }
      // TODO: Detect plain text representation for PDF files
      // warnings.push("PDF files should be accompanied by plain text representation for text selections");

      // TODO: Detect encrypted PDFs
      // warnings.push("Encrypted PDFs are not supported - passwords must not be stored");
      break;

    case "image/jpeg":
      if (!["jpg", "jpeg"].includes(ext)) {
        errors.push(`JPEG files must have .jpg or .jpeg extension, found: .${ext}`);
      }
      break;

    case "image/png":
      if (ext !== "png") {
        errors.push(`PNG files must have .png extension, found: .${ext}`);
      }
      break;

    case "video/mp4":
      if (ext !== "mp4") {
        warnings.push(`Video file extension .${ext} does not match MIME type video/mp4`);
      }
      break;

    case "audio/mp4":
      if (ext !== "m4a") {
        warnings.push(`Audio file extension .${ext} does not match MIME type audio/mp4`);
      }
      break;

    default:
      if (actualMimeType.startsWith("image/") && !["image/jpeg", "image/png"].includes(actualMimeType)) {
        errors.push(
          `Unsupported image format: ${actualMimeType}. Only JPEG and PNG are supported by REFI-QDA standard`,
        );
      } else if (actualMimeType.startsWith("audio/") || actualMimeType.startsWith("video/")) {
        warnings.push(
          `Audio/video format ${actualMimeType} will be stored as-is. Consider MP4/M4A for better compatibility`,
        );
      } else if (actualMimeType === "application/octet-stream") {
        warnings.push(`Unknown file format for ${sourceFile.path}. Will be treated as binary data`);
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
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

  // QDPX spec: source files go in sources/ directory
  const zipPath = `sources/${sourceFile.path}`;
  await zipWriter.add(zipPath, reader);
  return zipWriter;
}

async function zip(
  qdeXml: string,
  sources: SourceFile[],
  opts: PackQdpxOptions = {},
): Promise<Blob> {
  const zipFileWriter = new BlobWriter();
  const zipWriter = new ZipWriter(zipFileWriter, opts);
  await addTextFile(zipWriter, "project.qde", qdeXml);
  for (const source of sources) {
    await addSourceFile(zipWriter, source);
  }
  await zipWriter.close();
  return zipFileWriter.getData();
}

function validateProject(qde: unknown): ProjectJson {
  // if qde is a string, convert to Project
  if (typeof qde === "string") {
    const [xmlValid, xmlResult] = qdeToJson(qde);
    if (!xmlValid) {
      throw new Error(`Failed to parse project.qde: ${xmlResult}`);
    }
    return xmlResult.qde as ProjectJson;
  } else {
    // if qde is a Project, validate it
    const [valid, result] = validateQdeJson(qde);
    if (!valid) {
      throw new Error(`Invalid project.qde: ${result.message}`);
    }
    return result.qde;
  }
}

/**
 * Pack QDE project and source files into QDPX archive
 *
 * Creates a QDPX archive containing the QDE project file and associated source files.
 * Includes comprehensive validation of project data and source files against REFI-QDA
 * standards. Automatically converts Project objects to XML format.
 *
 * @param qde - QDE project data (Project object or XML string)
 * @param sources - Array of source files to include in the archive
 * @param opts - Packing options including validation settings and ZIP parameters
 * @returns Promise resolving to Result<Blob> containing the QDPX archive
 *
 * @example
 * ```typescript
 * // Pack with Project object
 * const project = {
 *   _attributes: { name: "My Project" },
 *   Sources: [],
 *   CodeBook: []
 * };
 *
 * const sourceFiles = [
 *   {
 *     path: "interview.txt",
 *     content: "Interview transcript...",
 *     mimeType: "text/plain"
 *   }
 * ];
 *
 * const [qdpxSuccess, qdpxBlob] = await pack(project, sourceFiles, {
 *   validateProjectQde: true,
 *   validateSources: true
 * });
 *
 * if (!qdpxSuccess) throw qdpxBlob;
 *
 * // Save to file
 * const url = URL.createObjectURL(qdpxBlob);
 * const link = document.createElement('a');
 * link.href = url;
 * link.download = 'project.qdpx';
 * link.click();
 * ```
 */
export async function pack(
  qde: ProjectJson | { qde: ProjectJson },
  sources: SourceFile[] = [],
  opts: PackQdpxOptions = {},
): Promise<Result<Blob>> {
  try {
    if (!qde) {
      throw new Error("No project provided");
    }

    if (opts.validateProjectQde !== false) {
      qde = validateProject(qde);
    }

    let qdeXml: string | undefined;

    // if qde is a Project, convert to XML
    if (typeof qde === "object") {
      const [xmlValid, xmlResult] = jsonToQde(qde as ProjectJson);
      if (!xmlValid) {
        throw new Error(`Failed to parse project.qde: ${xmlResult}`);
      }
      qdeXml = xmlResult.qde;
    }

    if (!qdeXml) {
      throw new Error("No project.qde provided");
    }

    if (opts.validateSources !== false) {
      for (const source of sources) {
        const validation = validateSourceFile(source);
        if (!validation.isValid) {
          throw new Error(`Invalid source file ${source.path}: ${validation.errors.join(", ")}`);
        }
      }
    }

    const blob = await zip(qdeXml, sources, opts);
    await terminateWorkers();
    return [true, blob];
  } catch (error) {
    return [false, error as Error];
  }
}

export default pack;
