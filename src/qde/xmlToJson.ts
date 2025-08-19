/**
 * QDE XML to JSON Conversion
 *
 * @module
 */

import { DOMParser, type Element } from "@xmldom/xmldom";

import {
  ALWAYS_ARRAYS,
  EMPTY_OBJECT,
  FLOAT_REGEX,
  INT_REGEX,
  REF_ELEMENTS,
  VALUE_CACHE,
  VALUE_CHOICE_ELEMENTS,
} from "../constants.ts";
import type { ProjectJson, QdeToJsonResult } from "./types.ts";
import { validateQdeJson } from "./validate.ts";

class XmlToJsonParser {
  // Singleton parser instance for reuse
  static #parser: DOMParser | null = null;

  /** Get or create the singleton DOMParser instance */
  static #getParser(): DOMParser {
    if (!XmlToJsonParser.#parser) {
      XmlToJsonParser.#parser = new DOMParser({
        onError: (level, message, context) => {
          throw new Error(`[${level}] QDE XML parsing error: ${message}`, { cause: context });
        },
      });
    }
    return XmlToJsonParser.#parser;
  }

  /** Parse XML string to JSON object */
  static parse(xmlString: string): ProjectJson {
    const parser = XmlToJsonParser.#getParser();
    const doc = parser.parseFromString(xmlString, "text/xml");
    // Check for parsing errors
    const errorNode = doc.getElementsByTagName("parsererror")[0];
    if (errorNode) throw new Error(`Parsing error: ${errorNode.textContent}`);
    // Convert root element
    if (!doc.documentElement) throw new Error("No root element found in QDE document");
    return XmlToJsonParser.#elementToJson(doc.documentElement) as ProjectJson;
  }

  static #isSimpleTextElement(element: Element): boolean {
    return !element.attributes?.length && element.childNodes.length === 1 && element.firstChild?.nodeType === 3;
  }

  static #getTargetGUID(element: Element): { targetGUID: string } | undefined {
    const targetGUID = element.getAttribute("targetGUID");
    return targetGUID ? { targetGUID } : undefined;
  }

  static #getValue(element: Element): string | boolean | number | Date | undefined {
    const { firstChild, tagName } = element;
    const rawText = firstChild?.textContent || "";
    if (VALUE_CHOICE_ELEMENTS.has(tagName)) {
      if (tagName === "BooleanValue") return rawText === "true" ? true : rawText === "false" ? false : rawText;
      if (tagName === "IntegerValue") return INT_REGEX.test(rawText) ? parseInt(rawText, 10) : rawText;
      if (tagName === "FloatValue") return FLOAT_REGEX.test(rawText) ? parseFloat(rawText) : rawText;
      // TextValue, DateValue, DateTimeValue remain strings
      return rawText;
    }
    return rawText;
  }

  static #isEmptyElement(element: Element): boolean {
    return !element.attributes?.length && element.childNodes.length === 0;
  }

  static #handleChildNodes(element: Element): {
    children: { [key: string]: unknown[] };
    hasTextContent: boolean;
    textContent: string;
    childElementCount: number;
  } {
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
        const childJson = XmlToJsonParser.#elementToJson(childElement);
        children[tagName].push(childJson);
      } else if (child?.nodeType === 3) {
        // Text node
        const text = child.textContent;
        if (text && text.trim()) {
          hasTextContent = true;
          textContent += text;
        }
      }
    }

    return { children, hasTextContent, textContent, childElementCount };
  }

  /** Convert XML element to JSON object */
  static #elementToJson(element: Element): unknown {
    const { tagName } = element;

    // Fast path for reference elements - very common in QDA files
    if (REF_ELEMENTS.has(tagName)) {
      return XmlToJsonParser.#getTargetGUID(element) ?? "";
    }

    // Early exit optimization for simple text-only elements (preserve exact text)
    if (XmlToJsonParser.#isSimpleTextElement(element)) {
      return XmlToJsonParser.#getValue(element);
    }

    // Early exit for completely empty elements
    if (XmlToJsonParser.#isEmptyElement(element)) {
      return "";
    }

    const result: Record<string, unknown> = {};

    // Handle attributes
    const processedAttrs = XmlToJsonParser.#processAttributes(element);
    const hasAttributes = processedAttrs !== EMPTY_OBJECT;
    if (hasAttributes) {
      result["_attributes"] = processedAttrs;
    }

    // Handle child nodes
    const { children, hasTextContent, textContent, childElementCount } = XmlToJsonParser.#handleChildNodes(element);

    // Add text content if present and no child elements
    if (hasTextContent && childElementCount === 0) {
      return textContent;
    }

    // Convert child arrays to single items or arrays based on schema requirements
    // Context-aware array enforcement for specific parent/child pairs
    const contextArrayChildren: Record<string, Set<string>> = {
      // In schema: Case.CodeRef is an array, while Coding.CodeRef is a single object
      Case: new Set(["CodeRef"]),
    };
    for (const childTagName in children) {
      const childArray = children[childTagName];
      const childCount = childArray?.length ?? 0;
      const parentForcingArray = contextArrayChildren[tagName]?.has(childTagName) === true;
      if (ALWAYS_ARRAYS.has(childTagName) || parentForcingArray || childCount > 1) {
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

  /** Handle XML element attributes */
  static #processAttributes(element: Element): Record<string, unknown> {
    const attrs = element.attributes;
    if (!attrs || attrs.length === 0) return EMPTY_OBJECT;
    const result: Record<string, unknown> = {};
    for (let i = 0, len = attrs.length; i < len; i++) {
      const attr = attrs[i]!;
      const value = attr.value;
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
      result[attr.name] = convertedValue;
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
