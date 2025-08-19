import type { PackQdpxOptions, SourceFile, ValidationResult } from "./pack.ts";
import { pack } from "./pack.ts";
import type { QdpxUnpacker, UnpackQdpxOptions } from "./unpack.ts";
import { unpack } from "./unpack.ts";

export {
  /**
   * Pack QDE project and source files into QDPX archive
   * @param options - Packing configuration with project data and files
   * @returns Result tuple: [success, validation] or [false, error]
   */
  pack,
  /**
   * Unpack QDPX archive file and provide access to contents
   * @param input - File path or Uint8Array of QDPX archive
   * @param options - Optional unpacking configuration
   * @returns QdpxUnpacker instance for accessing archive contents
   */
  unpack,
};

export type { PackQdpxOptions, QdpxUnpacker, SourceFile, UnpackQdpxOptions, ValidationResult };
