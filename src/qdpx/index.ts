import type { PackQdpxOptions, SourceFile, ValidationResult } from "./pack.ts";
import { pack } from "./pack.ts";
import type { QdpxUnpacker, UnpackQdpxOptions } from "./unpack.ts";
import { unpack } from "./unpack.ts";

export {
  /**
   * Pack QDE project and source files into QDPX archive
   * @param options - Packing configuration with project data and files
   * @returns Result tuple: [success, Blob] or [false, error]
   */
  pack,
  /**
   * Unpack QDPX archive file and provide access to contents
   * @param blob - Blob of QDPX archive
   * @param options - Optional unpacking configuration for the zip reader
   * @returns Result tuple: [success, QdpxUnpacker] or [false, error]
   */
  unpack,
};

export type { PackQdpxOptions, QdpxUnpacker, SourceFile, UnpackQdpxOptions, ValidationResult };
