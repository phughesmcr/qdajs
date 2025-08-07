/**
 * Unzip a QDPX file
 * @module
 */
import { BlobReader, type Entry, ZipReader } from "@zip-js/zip-js";

import type { Result } from "../types.ts";

export type { Entry };

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

export async function unpack(input: Blob, opts: UnpackQdpxOptions = {}): Promise<Result<QdpxUnpacker>> {
  try {
    const zipReader = getZip(input, opts);
    const entries = await zipReader.getEntries(opts);
    const unpacker: QdpxUnpacker = {
      get entries() {
        return entries;
      },
      readProjectQde: () => getProject(entries),
      extractAll: () => extractAll(entries),
      close: async () => await zipReader.close(),
    };
    return [true, unpacker];
  } catch (error) {
    return [false, error as Error];
  }
}

export default unpack;
