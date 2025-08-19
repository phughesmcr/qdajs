/**
 * Main entry point for QDAJS library
 *
 * QDAJS is a Deno library for working with QDE (Qualitative Data Exchange) and QDPX (QDA Project Exchange) files.
 * The library provides bidirectional conversion between QDE XML format and JSON, plus functionality to pack/unpack
 * QDPX archive files containing QDE projects and source files.
 *
 * @module
 */

import * as refi from "./src/class/index.ts";
import * as qde from "./src/qde/index.ts";
import * as qdpx from "./src/qdpx/index.ts";

export {
  /**
   * QDE (Qualitative Data Exchange) module for XML/JSON conversion and validation
   *
   * @example
   * ```typescript
   * // Convert QDE XML to JSON
   * const [jsonSuccess, jsonResult] = qde.toJson(xmlString);
   * if (jsonSuccess) console.log("Converted:", jsonResult.qde);
   *
   * // Convert JSON to QDE XML
   * const [xmlSuccess, xmlResult] = qde.fromJson(jsonData);
   * if (xmlSuccess) console.log("XML:", xmlResult.qde);
   *
   * // Validate JSON data
   * const [isValid, projectJson] = qde.validate(jsonData);
   * ```
   */
  qde,
  /**
   * QDPX (QDA Project Exchange) module for archive operations
   *
   * @example
   * ```typescript
   * // Unpack QDPX archive
   * const [unpackSuccess, unpacker] = await qdpx.unpack(qdpxBlob);
   * if (unpackSuccess) {
   *   // get project QDE XML
   *   const projectQde = await unpacker.getProjectQde();
   *   console.log("Project QDE:", projectQde);
   *
   *   // get source files
   *   for await (const source of unpacker.extractAll()) {
   *     const blob = new Blob([source]);
   *     // ... save to file
   *   }
   *
   *   // ⚠️ remember to close the unpacker!
   *   await unpacker.close();
   * }
   *
   * // Pack new QDPX archive
   * const [packSuccess, packResult] = await qdpx.pack({
   *   outputPath: "new-project.qdpx",
   *   projectQde: xmlString,
   *   sourceFiles: files
   * });
   *
   * // packResult is a Blob
   * ```
   */
  qdpx,
  /**
   * Classes for working with QDE data.
   *
   * @example
   * ```typescript
   * // Convert JSON to a Javascript class
   * const project = refi.Project.fromJson(jsonData);
   * console.log("Project:", project);
   * ```
   */
  refi,
};

export type * from "./src/class/index.ts";
export type * from "./src/qde/index.ts";
export type * from "./src/qdpx/index.ts";
export type { Result } from "./src/types.ts";
