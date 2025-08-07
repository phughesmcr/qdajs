import { jsonToQde } from "./src/qde/jsonToXml.ts";
import { validateQdeJson } from "./src/qde/validate.ts";
import { qdeToJson } from "./src/qde/xmlToJson.ts";
import { pack, type PackQdpxOptions, type SourceFile, type ValidationResult } from "./src/qdpx/pack.ts";
import { type Entry, type QdpxUnpacker, unpack, type UnpackQdpxOptions } from "./src/qdpx/unpack.ts";
import type { JsonToQdeResult, QdeToJsonResult, Result } from "./src/types.ts";

export const qde = {
  toJson: qdeToJson,
  fromJson: jsonToQde,
  validate: validateQdeJson,
};

export const qdpx = {
  unpack,
  pack,
};

export default { qde, qdpx };

export type {
  Entry,
  JsonToQdeResult,
  PackQdpxOptions,
  QdeToJsonResult,
  QdpxUnpacker,
  Result,
  SourceFile,
  UnpackQdpxOptions,
  ValidationResult,
};
