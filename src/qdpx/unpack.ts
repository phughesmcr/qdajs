/**
 * QDPX Archive Unpacking
 *
 * QDPX unpacking module for extracting QDE projects and source files from ZIP archives.
 * Provides async access to project.qde files and source file extraction with proper
 * resource management and error handling.
 *
 * @module
 */
import { BlobReader, type Entry, terminateWorkers, ZipReader } from "@zip-js/zip-js";

import type { Result } from "../types.ts";

export type QdpxUnpacker = {
  entries: Entry[];
  readProjectQde: () => Promise<string>;
  extractAll: () => AsyncGenerator<ArrayBuffer>;
  close: () => Promise<void>;
};

export type UnpackQdpxOptions = {
  password?: string;
  signal?: AbortSignal;
  contentEncoding?: string;
  filenameEncoding?: string;
};

function getZip(input: Blob, opts: UnpackQdpxOptions = {}): ZipReader<Blob> {
  const zipFileReader = new BlobReader(input);
  return new ZipReader(zipFileReader, opts);
}

async function getProject(entries: Entry[]): Promise<string> {
  const resultStream = new TransformStream();
  const resultStreamPromise = new Response(resultStream.readable).text();
  const qdeEntry: Entry | undefined = entries.find((entry) => entry.filename === "project.qde");
  if (!qdeEntry) throw new Error("project.qde not found");
  if (!qdeEntry.getData) throw new Error("Entry does not support getData");
  await qdeEntry.getData(resultStream.writable);
  return resultStreamPromise;
}

async function* extractAll(entries: Entry[]): AsyncGenerator<ArrayBuffer> {
  for (const entry of entries) {
    if (!entry.getData) continue;
    const resultStream = new TransformStream();
    const resultStreamPromise = new Response(resultStream.readable).arrayBuffer();
    await entry.getData(resultStream.writable);
    const arrayBuffer = await resultStreamPromise;
    yield arrayBuffer;
  }
}

/**
 * Unpack QDPX archive file and provide access to contents
 *
 * Creates a QdpxUnpacker instance for accessing QDPX archive contents including
 * project.qde file and source files. Handles ZIP file reading with proper error
 * handling and resource management.
 *
 * @param blob - QDPX file as Blob (from file input or fetch)
 * @param opts - Optional unpacking configuration (password, encoding, abort signal)
 * @returns Result tuple: [true, QdpxUnpacker] on success, [false, Error] on failure
 *
 * @example
 * ```typescript
 * // Unpack from file input
 * const file = event.target.files[0];
 * const [success, unpacker] = await unpack(file);
 *
 * if (success) {
 *   // Read project QDE
 *   const projectXml = await unpacker.readProjectQde();
 *
 *   // Extract all files
 *   for await (const fileData of unpacker.extractAll()) {
 *     console.log('Extracted file:', fileData.byteLength);
 *   }
 *
 *   // Clean up resources
 *   await unpacker.close();
 * }
 * ```
 */
export async function unpack(blob: Blob, opts: UnpackQdpxOptions = {}): Promise<Result<QdpxUnpacker>> {
  try {
    const zipReader = getZip(blob, opts);
    const entries = await zipReader.getEntries(opts);
    const unpacker: QdpxUnpacker = {
      get entries() {
        return entries;
      },
      readProjectQde: () => getProject(entries),
      extractAll: () => extractAll(entries),
      close: async () => {
        await terminateWorkers();
        await zipReader.close();
      },
    };
    return [true, unpacker];
  } catch (error) {
    return [false, error as Error];
  }
}

export default unpack;
