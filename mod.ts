import { jsonToQde } from "./src/convert/jsonToXml.ts";
import { qdeToJson } from "./src/convert/xmlToJson.ts";
import { type Entry, type QdpxUnpacker, unpack, type UnpackQdpxOptions } from "./src/qdpx/unpack.ts";
import { pack, type PackQdpxOptions, type SourceFile } from "./src/qdpx/pack.ts";
import type { JsonToQdeResult, QdeToJsonResult } from "./src/types.ts";

export const convert = {
  qdeToJson,
  jsonToQde,
};

export const qdpx = {
  unpack,
  pack,
};

export default { convert, unpack };

export type { Entry, JsonToQdeResult, PackQdpxOptions, QdeToJsonResult, QdpxUnpacker, SourceFile, UnpackQdpxOptions };
