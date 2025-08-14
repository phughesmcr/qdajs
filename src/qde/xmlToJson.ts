/**
 * QDE XML to JSON Conversion
 *
 * High-performance XML parsing module for QDE (Qualitative Data Exchange) files.
 * Uses optimized DOM parsing with singleton patterns, value caching, and schema-aware conversion
 * for efficient processing of large QDA-XML files.
 *
 * @module
 */

import { DOMParser, type Element } from "@xmldom/xmldom";

import {
  ALWAYS_ARRAYS,
  ELEMENTS_WITH_ATTRIBUTES,
  EMPTY_OBJECT,
  FLOAT_REGEX,
  INT_REGEX,
  REF_ELEMENTS,
  VALUE_CACHE,
} from "../constants.ts";
import type { QdeToJsonResult } from "./types.ts";
import { validateQdeJson } from "./validate.ts";

const ERROR_NO_ROOT = "No root element found in QDE document";

class XmlToJsonParser {
  // Singleton parser instance for reuse
  static #parser: DOMParser | null = null;

  /** Get or create the singleton DOMParser instance */
  static #getParser(): DOMParser {
    if (!XmlToJsonParser.#parser) {
      XmlToJsonParser.#parser = new DOMParser({
        onError: (level, message, context) => {
          throw new Error(`[${level}] XML parsing error: ${message}`, { cause: context });
        },
      });
    }
    return XmlToJsonParser.#parser;
  }

  /** Parse XML string to JSON object */
  static parse(xmlString: string): unknown {
    const parser = XmlToJsonParser.#getParser();
    const doc = parser.parseFromString(xmlString, "text/xml");
    // Check for parsing errors
    const errorNode = doc.getElementsByTagName("parsererror")[0];
    if (errorNode) throw new Error(`Parsing error: ${errorNode.textContent}`);
    // Convert root element
    if (!doc.documentElement) throw new Error(ERROR_NO_ROOT);
    return XmlToJsonParser.#elementToJson(doc.documentElement);
  }

  /** Convert XML element to JSON object */
  static #elementToJson(element: Element): unknown {
    const tagName = element.tagName;

    // Fast path for reference elements - very common in QDA files
    if (REF_ELEMENTS.has(tagName)) {
      const targetGUID = element.getAttribute("targetGUID");
      return targetGUID ? { targetGUID } : "";
    }

    // Early exit optimization for simple text-only elements (preserve exact text)
    if (
      !element.attributes?.length &&
      element.childNodes.length === 1 &&
      element.firstChild?.nodeType === 3
    ) {
      return element.firstChild.textContent || "";
    }

    // Early exit for completely empty elements
    if (
      !element.attributes?.length &&
      element.childNodes.length === 0
    ) {
      return "";
    }

    const result: Record<string, unknown> = {};

    // Handle attributes - flatten for most elements, keep _attributes for specific ones
    const processedAttrs = XmlToJsonParser.#processAttributes(element);
    const hasAttributes = processedAttrs !== EMPTY_OBJECT;
    if (hasAttributes) {
      const shouldUseAttributesObject = ELEMENTS_WITH_ATTRIBUTES.has(element.tagName);
      if (shouldUseAttributesObject) {
        result["_attributes"] = processedAttrs;
      } else {
        // Flatten attributes to object level for schema compatibility
        Object.assign(result, processedAttrs);
      }
    }

    // Handle child nodes
    const children: { [key: string]: unknown[] } = {};
    let hasTextContent = false;
    let textContent = "";
    let childElementCount = 0;

    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child?.nodeType === 1) {
        // Element node
        const childElement = child as Element;
        const tagName = childElement.tagName;
        if (!children[tagName]) {
          children[tagName] = [];
          childElementCount++;
        }
        children[tagName].push(XmlToJsonParser.#elementToJson(childElement));
      } else if (child?.nodeType === 3) {
        // Text node
        const text = child.textContent;
        if (text && text.trim()) {
          hasTextContent = true;
          textContent += text;
        }
      }
    }

    // Add text content if present and no child elements
    if (hasTextContent && childElementCount === 0) {
      return textContent;
    }

    // Convert child arrays to single items or arrays based on schema requirements
    for (const childTagName in children) {
      const childArray = children[childTagName];
      const childCount = childArray?.length ?? 0;
      if (ALWAYS_ARRAYS.has(childTagName) || childCount > 1) {
        result[childTagName] = childArray ?? [];
      } else {
        result[childTagName] = childArray?.[0] ?? "";
      }
    }

    // Handle mixed content (text + elements)
    if (hasTextContent && childElementCount > 0) {
      result["_text"] = textContent;
    }

    // Handle empty elements (no text content, no child elements, no attributes) - return empty string
    if (!hasTextContent && childElementCount === 0 && !hasAttributes) {
      return "";
    }

    return result;
  }

  /** Efficient attribute processing with direct indexing and inlined conversion */
  static #processAttributes(element: Element): Record<string, unknown> {
    const attrs = element.attributes;
    if (!attrs || attrs.length === 0) return EMPTY_OBJECT;

    const result: Record<string, unknown> = {};
    for (let i = 0, len = attrs.length; i < len; i++) {
      const attr = attrs[i]; // Direct indexing instead of attrs.item(i)
      const value = attr!.value;

      // Inline value conversion to avoid function call overhead
      let convertedValue: unknown;
      const cached = VALUE_CACHE.get(value);
      if (cached !== undefined) {
        convertedValue = cached;
      } else if (FLOAT_REGEX.test(value)) {
        convertedValue = parseFloat(value);
      } else if (INT_REGEX.test(value)) {
        convertedValue = parseInt(value, 10);
      } else {
        convertedValue = value;
      }

      result[attr!.name] = convertedValue;
    }
    return result;
  }
}

/**
 * Parse and validate QDE project file using schema validation
 *
 * Converts QDE XML content to a validated JSON object with comprehensive error handling.
 * Uses optimized XML parsing and automatic schema validation.
 *
 * @param xmlString - QDE XML content as string
 * @returns Result tuple: [true, {qde: jsonData}] on success, [false, Error] on failure
 *
 * @example
 * ```typescript
 * const xmlContent = '<Project><Sources>...</Sources></Project>';
 * const [success, result] = qdeToJson(xmlContent);
 * if (success) {
 *   console.log('Project data:', result.qde);
 * } else {
 *   console.error('Parse error:', result.message);
 * }
 * ```
 */
export function qdeToJson(xmlString: string): QdeToJsonResult {
  try {
    const json = XmlToJsonParser.parse(xmlString);
    return validateQdeJson(json);
  } catch (error) {
    return [
      false,
      new Error(
        `Parsing error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    ];
  }
}
