/**
 * @module Main entry point for QDAJS library
 *
 * QDAJS is a Deno library for working with QDE (Qualitative Data Exchange) and QDPX (QDA Project Exchange) files.
 * The library provides bidirectional conversion between QDE XML format and JSON, plus functionality to pack/unpack
 * QDPX archive files containing QDE projects and source files.
 *
 * @example
 * ```typescript
 * import { qde, qdpx } from "./mod.ts";
 *
 * // Convert QDE XML to JSON
 * const [success, result] = qde.toJson(xmlString);
 *
 * // Convert JSON back to QDE XML
 * const [valid, xml] = qde.fromJson(jsonData);
 *
 * // Unpack QDPX archive
 * const [unpackOk, unpacker] = await qdpx.unpack("project.qdpx");
 * ```
 */

import { jsonToQde } from "./src/qde/jsonToXml.ts";
import { validateQdeJson } from "./src/qde/validate.ts";
import { qdeToJson } from "./src/qde/xmlToJson.ts";
import { pack, type PackQdpxOptions, type SourceFile, type ValidationResult } from "./src/qdpx/pack.ts";
import { type Entry, type QdpxUnpacker, unpack, type UnpackQdpxOptions } from "./src/qdpx/unpack.ts";
import type { JsonToQdeResult, QdeToJsonResult, Result } from "./src/types.ts";

/**
 * QDE (Qualitative Data Exchange) module for XML/JSON conversion and validation
 *
 * @example
 * ```typescript
 * // Convert QDE XML to JSON
 * const [success, result] = qde.toJson(xmlString);
 * if (success) {
 *   console.log("Converted:", result.qde);
 * }
 *
 * // Convert JSON to QDE XML
 * const [valid, xml] = qde.fromJson(jsonData);
 * if (valid) {
 *   console.log("XML:", xml.qde);
 * }
 *
 * // Validate JSON data
 * const [isValid, error] = qde.validate(jsonData);
 * ```
 */
export const qde = {
  /**
   * Convert QDE XML string to validated JSON object
   * @param xmlString - QDE XML content to parse
   * @returns Result tuple: [success, data] or [false, error]
   */
  toJson: qdeToJson,

  /**
   * Convert JSON object to QDE XML string with validation
   * @param json - JSON data to convert (normalized or raw format)
   * @returns Result tuple: [success, {qde: xmlString}] or [false, error]
   */
  fromJson: jsonToQde,

  /**
   * Validate JSON data against QDE schema
   * @param json - JSON data to validate
   * @returns Result tuple: [valid, data] or [false, error]
   */
  validate: validateQdeJson,
};

/**
 * QDPX (QDA Project Exchange) module for archive operations
 *
 * @example
 * ```typescript
 * // Unpack QDPX archive
 * const [unpackOk, unpacker] = await qdpx.unpack("project.qdpx");
 * if (unpackOk) {
 *   const projectQde = await unpacker.getProjectQde();
 * }
 *
 * // Pack new QDPX archive
 * const result = await qdpx.pack({
 *   outputPath: "new-project.qdpx",
 *   projectQde: xmlString,
 *   sourceFiles: files
 * });
 * ```
 */
export const qdpx = {
  /**
   * Unpack QDPX archive file and provide access to contents
   * @param input - File path or Uint8Array of QDPX archive
   * @param options - Optional unpacking configuration
   * @returns QdpxUnpacker instance for accessing archive contents
   */
  unpack,

  /**
   * Pack QDE project and source files into QDPX archive
   * @param options - Packing configuration with project data and files
   * @returns Result tuple: [success, validation] or [false, error]
   */
  pack,
};

/**
 * Default export providing both QDE and QDPX functionality
 */
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
