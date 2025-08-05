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

function isQdpxFile(input: string | Blob): boolean {
  if (typeof input === "string") {
    return input.endsWith(".qdpx");
  }
  return true; // For Blob input, assume it's valid
}

function getBlob(input: string | Blob): Promise<Blob> {
  if (input instanceof Blob) {
    return Promise.resolve(input);
  }
  // For file path string, this would need platform-specific implementation
  return Promise.reject(new Error("File path input requires platform-specific file reading implementation"));
}

async function getZip(input: string | Blob, opts: UnpackQdpxOptions = {}): Promise<ZipReader<Blob>> {
  const isValidFile = isQdpxFile(input);
  if (!isValidFile) throw new Error(`Input is not a '.qdpx' file`);
  const blob = await getBlob(input);
  const zipFileReader = new BlobReader(blob);
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

async function* extractAll(zipReader: ZipReader<Blob>, opts: UnpackQdpxOptions = {}): AsyncGenerator<ArrayBuffer> {
  const generator = zipReader.getEntriesGenerator(opts);
  for await (const entry of generator) {
    if (!entry.getData) continue;
    const resultStream = new TransformStream();
    await entry.getData(resultStream.writable);
    const arrayBuffer = await new Response(resultStream.readable).arrayBuffer();
    yield arrayBuffer;
  }
}

export async function unpack(input: string | Blob, opts: UnpackQdpxOptions = {}): Promise<Result<QdpxUnpacker>> {
  try {
    const zipReader = await getZip(input, opts);
    const entries = await zipReader.getEntries(opts);
    const unpacker: QdpxUnpacker = {
      get entries() {
        return entries;
      },
      readProjectQde: () => getProject(entries),
      extractAll: () => extractAll(zipReader, opts),
      close: async () => await zipReader.close(),
    };
    return [true, unpacker];
  } catch (error) {
    return [false, error as Error];
  }
}

export default unpack;
