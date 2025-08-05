import { type Document, DOMImplementation, type Element, XMLSerializer } from "@xmldom/xmldom";
import { elementFields } from "../constants.ts";
import { projectSchema } from "../schema.ts";
import type { JsonToQdeResult, QdeToJsonResult } from "../types.ts";

// Pre-created error messages to avoid string operations during errors
const ERROR_INVALID_INPUT = "Invalid input: expected object with QDE data";
const ERROR_INVALID_QDE_FIELD = "Invalid QDE data: qde field must be an object";
const ERROR_ROOT_NOT_OBJECT = "Root data must be an object";
const ERROR_SCHEMA_VALIDATION = "Schema validation failed";

/**
 * High-performance JSON to XML converter using DOM construction and serializeToString
 * Optimized for large QDA-XML files with static methods and DOM caching
 * Supports both normalized and raw JSON data formats
 */
class JsonToXmlConverter {
  // Singleton DOM implementation for reuse
  static #domImpl: DOMImplementation | null = null;

  /** Get or create the singleton DOMImplementation instance */
  static #getDOMImpl(): DOMImplementation {
    if (!JsonToXmlConverter.#domImpl) {
      JsonToXmlConverter.#domImpl = new DOMImplementation();
    }
    return JsonToXmlConverter.#domImpl;
  }

  /**
   * Convert JSON object to XML string using DOM construction and serializeToString
   * @param data - The JSON data to convert
   * @param rootElementName - Name of the root XML element
   * @returns XML string with proper formatting and escaping
   * @throws Error if data is not a valid object
   */
  static toXml(data: Record<string, unknown>, rootElementName = "Project"): string {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      throw new Error(ERROR_ROOT_NOT_OBJECT);
    }

    const domImpl = JsonToXmlConverter.#getDOMImpl();
    const doc = domImpl.createDocument("", "", null);

    // Create root element and convert JSON to DOM
    const rootElement = JsonToXmlConverter.#objectToElement(doc, data as Record<string, unknown>, rootElementName);
    doc.appendChild(rootElement);

    // Use xmldom's serializeToString for optimal performance
    const serializer = new XMLSerializer();
    const xmlContent = serializer.serializeToString(doc);

    // Add XML declaration (serializeToString doesn't include it for Document nodes)
    return `<?xml version="1.0" encoding="utf-8"?>\n${xmlContent}`;
  }

  /**
   * Convert a JSON object to DOM Element with proper attribute handling
   * @param doc - The XML Document
   * @param obj - JSON object to convert
   * @param elementName - Name of the XML element
   * @returns DOM Element
   */
  static #objectToElement(doc: Document, obj: Record<string, unknown>, elementName: string): Element {
    const element = doc.createElement(elementName);

    // Efficient separation of attributes, text content, and child elements
    // Avoid Object.entries() for performance with large objects
    const children: Record<string, unknown> = {};
    let textContent = "";
    let hasTextContent = false;

    for (const key in obj) {
      if (!Object.hasOwn(obj, key)) continue;
      const value = obj[key];

      if (key === "_attributes") {
        if (typeof value === "object" && value !== null) {
          // Process _attributes object - DOM handles escaping automatically
          for (const attrName in value) {
            if (Object.hasOwn(value, attrName)) {
              element.setAttribute(attrName, String(value[attrName as keyof typeof value]));
            }
          }
        }
      } else if (key === "_text") {
        textContent = String(value);
        hasTextContent = true;
      } else if (JsonToXmlConverter.#isPrimitiveValue(value) && !elementFields.has(key)) {
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

    // Process child elements
    for (const childName in children) {
      if (Object.hasOwn(children, childName)) {
        JsonToXmlConverter.#addValueToElement(doc, element, children[childName], childName);
      }
    }

    return element;
  }

  /**
   * Add a JSON value to DOM element handling arrays, objects, and primitives
   * @param doc - The XML Document
   * @param parent - Parent DOM element
   * @param value - The JSON value to convert
   * @param elementName - Name of the XML element
   */
  static #addValueToElement(doc: Document, parent: Element, value: unknown, elementName: string): void {
    if (Array.isArray(value)) {
      // Handle arrays - each item becomes a separate element with the same name
      for (const item of value) {
        JsonToXmlConverter.#addValueToElement(doc, parent, item, elementName);
      }
    } else if (typeof value === "object" && value !== null) {
      // Handle objects
      const childElement = JsonToXmlConverter.#objectToElement(doc, value as Record<string, unknown>, elementName);
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

  /**
   * Check if a value should be treated as an attribute based on type
   * @param value - The JSON value to check
   * @returns True if the value should be an attribute
   */
  static #isPrimitiveValue(value: unknown): boolean {
    const type = typeof value;
    return type === "string" || type === "number" || type === "boolean";
  }
}

/**
 * Convert JSON data to QDE XML format with comprehensive validation
 * Supports both normalized data ({ qde: data }) and raw JSON objects
 * @param json - JSON data to convert (normalized or raw)
 * @returns Result tuple with XML string or detailed error information
 */
export function jsonToQde(json: Record<string, unknown> | QdeToJsonResult): JsonToQdeResult {
  try {
    // Input validation with specific error messages
    if (typeof json !== "object" || json === null) {
      return [false, new Error(ERROR_INVALID_INPUT)];
    }

    let rawData: Record<string, unknown>;

    // Handle normalized format { qde: {...} }
    if ("qde" in json) {
      if (typeof json["qde"] !== "object" || json["qde"] === null) {
        return [false, new Error(ERROR_INVALID_QDE_FIELD)];
      }
      rawData = json["qde"] as Record<string, unknown>;
    } else {
      // Use input directly as raw QDA data
      rawData = json as Record<string, unknown>;
    }

    const validationResult = projectSchema.safeParse(rawData);
    if (!validationResult.success) {
      return [
        false,
        new Error(ERROR_SCHEMA_VALIDATION, { cause: validationResult.error }),
      ];
    }

    const xmlString = JsonToXmlConverter.toXml(rawData, "Project");

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
