import { jsonToQde } from "./jsonToXml.ts";
import { validateQdeJson } from "./validate.ts";
import { qdeToJson } from "./xmlToJson.ts";

export * from "./schema.ts";
export type * from "./types.ts";

/**
 * Convert QDE XML string to validated JSON object
 * @param xmlString - QDE XML content to parse
 * @returns Result tuple: [success, data] or [false, error]
 */
export const toJson = qdeToJson;

/**
 * Convert JSON object to QDE XML string with validation
 * @param json - JSON data to convert (normalized or raw format)
 * @returns Result tuple: [success, {qde: xmlString}] or [false, error]
 */
export const fromJson = jsonToQde;

/**
 * Validate JSON data against QDE schema
 * @param json - JSON data to validate
 * @returns Result tuple: [valid, data] or [false, error]
 */
export const validate = validateQdeJson;
