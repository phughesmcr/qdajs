/**
 * QDE JSON to XML Conversion
 * @module
 */

import { type Document, DOMImplementation, type Element, XMLSerializer } from "@xmldom/xmldom";

import { ELEMENT_FIELDS } from "../constants.ts";
import { sortedKeys } from "../utils.ts";
import type { JsonToQdeResult, ProjectJson } from "./types.ts";
import { validateQdeJson } from "./validate.ts";

function addValueToElement(doc: Document, parent: Element, value: unknown, elementName: string): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    // Handle arrays - each item becomes a separate element with the same name
    for (const item of value) {
      addValueToElement(doc, parent, item, elementName);
    }
  } else if (typeof value === "object" && value !== null) {
    // Handle objects
    const childElement = objectToElement(doc, value as Record<string, unknown>, elementName);
    parent.appendChild(childElement);
  } else {
    // Handle primitive values as element content - DOM handles escaping
    const element = doc.createElement(elementName);
    if (value !== "" && value !== null && value !== undefined) {
      const textNode = doc.createTextNode(String(value));
      element.appendChild(textNode);
    }
    parent.appendChild(element);
  }
}

function isPrimitiveValue(value: unknown): boolean {
  const type = typeof value;
  return type === "string" || type === "number" || type === "boolean";
}

function objectToElement(doc: Document, obj: Record<string, unknown>, elementName: string): Element {
  const element = doc.createElement(elementName);

  // Efficient separation of attributes, text content, and child elements
  // Avoid Object.entries() for performance with large objects
  const children: Record<string, unknown> = {};
  let textContent = "";
  let hasTextContent = false;

  for (const key in obj) {
    if (!Object.hasOwn(obj, key)) continue;
    const value = obj[key];
    // Skip null/undefined fields to avoid emitting empty elements
    if (value === undefined || value === null) continue;

    if (key === "_attributes") {
      if (typeof value === "object" && value !== null) {
        // Process _attributes object - emit attributes in deterministic order
        const attrObj = value as Record<string, unknown>;
        for (const attrName of sortedKeys(attrObj)) {
          if (Object.hasOwn(attrObj, attrName)) {
            element.setAttribute(attrName, String(attrObj[attrName]));
          }
        }
      }
    } else if (key === "_text") {
      textContent = String(value);
      hasTextContent = true;
    } else if (isPrimitiveValue(value) && !ELEMENT_FIELDS.has(key)) {
      // Schema-aware attribute vs element decision - DOM handles escaping
      element.setAttribute(key, String(value));
    } else {
      children[key] = value;
    }
  }

  // Add text content if present
  if (hasTextContent) {
    const textNode = doc.createTextNode(textContent);
    element.appendChild(textNode);
  }

  // Process child elements (deterministic order)
  for (const childName of sortedKeys(children)) {
    if (Object.hasOwn(children, childName)) {
      addValueToElement(doc, element, children[childName], childName);
    }
  }

  return element;
}

function toDoc(data: Record<string, unknown>, rootElementName = "Project"): Document {
  const dom = new DOMImplementation();
  const doc = dom.createDocument("", "", null);
  const rootElement = objectToElement(doc, data as Record<string, unknown>, rootElementName);
  doc.appendChild(rootElement);
  return doc;
}

function toXml(data: Record<string, unknown>, rootElementName = "Project"): string {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Root data must be an object");
  }
  const doc = toDoc(data, rootElementName);
  const serializer = new XMLSerializer();
  const xmlContent = serializer.serializeToString(doc);
  return `<?xml version="1.0" encoding="utf-8"?>\n${xmlContent}`;
}

/**
 * Convert JSON data to QDE XML format with comprehensive validation
 *
 * Converts validated JSON data to properly formatted QDE XML with comprehensive error handling.
 * Supports both normalized data ({ qde: data }) and raw JSON objects. Includes automatic
 * schema validation before conversion.
 *
 * @param json - JSON data to convert, either Project schema or normalized {qde: data} format
 * @returns Result tuple: [true, {qde: xmlString}] on success, [false, Error] on failure
 *
 * @example
 * ```typescript
 * // Using raw project data
 * const projectData = { Sources: [...], CodeBook: [...], ... };
 * const [success, result] = jsonToQde(projectData);
 *
 * if (success) {
 *   console.log('Generated XML:', result.qde);
 * }
 * ```
 */
export function jsonToQde(json: ProjectJson | { qde: ProjectJson }): JsonToQdeResult {
  try {
    if (typeof json !== "object" || json === null) {
      return [false, new Error("Invalid input: expected object with QDE data")];
    }

    let rawData: ProjectJson;

    // Handle normalized format { qde: {...} }
    if ("qde" in json) {
      const { qde } = json;
      if (typeof qde !== "object" || qde === null) {
        return [false, new Error("Invalid QDE data: qde field must be an object")];
      }
      rawData = qde;
    } else {
      rawData = json;
    }

    const [valid, error] = validateQdeJson(rawData);
    if (!valid) return [false, error];

    const xmlString = toXml(rawData as unknown as Record<string, unknown>, "Project");
    return [true, { qde: xmlString }];
  } catch (error) {
    return [
      false,
      new Error(
        `JSON to XML conversion error: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      ),
    ];
  }
}
