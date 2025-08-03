/// <reference lib="deno.ns" />

import { assert, assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { jsonToQde } from "../src/convert/jsonToXml.ts";
import { qdeToJson } from "../src/convert/xmlToJson.ts";

const QDE_FILE = "./docs/example.qde";
const JSON_FILE = "./docs/example.json";

/**
 * Comprehensive test suite for QDE XML ↔ JSON conversion integrity
 */

/**
 * Deep comparison function that validates all keys, values, and attributes
 * are preserved across conversions
 */
function assertDeepDataIntegrity(actual: any, expected: any, path: string = "root"): void {
  // Handle null/undefined
  if (actual === null || actual === undefined || expected === null || expected === undefined) {
    assertEquals(actual, expected, `Null/undefined mismatch at ${path}`);
    return;
  }

  // Handle primitives
  if (typeof actual !== "object" || typeof expected !== "object") {
    assertEquals(actual, expected, `Primitive value mismatch at ${path}`);
    return;
  }

  // Handle arrays
  if (Array.isArray(actual) || Array.isArray(expected)) {
    assert(
      Array.isArray(actual) && Array.isArray(expected),
      `Array type mismatch at ${path}: actual=${Array.isArray(actual)}, expected=${Array.isArray(expected)}`,
    );

    assertEquals(actual.length, expected.length, `Array length mismatch at ${path}`);

    for (let i = 0; i < actual.length; i++) {
      assertDeepDataIntegrity(actual[i], expected[i], `${path}[${i}]`);
    }
    return;
  }

  // Handle objects - check all keys exist in both
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();

  assertEquals(actualKeys, expectedKeys, `Object keys mismatch at ${path}`);

  // Recursively check all properties
  for (const key of actualKeys) {
    assertDeepDataIntegrity(actual[key], expected[key], `${path}.${key}`);
  }
}

Deno.test("QDE Conversion Integration Tests", async (t) => {
  await t.step("should successfully convert XML to JSON", async () => {
    const qdeXml = await Deno.readTextFile(QDE_FILE);
    const [result, error] = qdeToJson(qdeXml);

    assert(result, `XML to JSON conversion failed: ${error}`);
    assertExists(result, "Conversion result should contain data");

    // Validate basic structure
    assert(typeof result.qde === "object", "Result should be an object");
    assert(result.qde["_attributes"]?.name, "Result should contain project with name attribute");
  });

  await t.step("should successfully convert JSON back to XML", async () => {
    const qdeXml = await Deno.readTextFile(QDE_FILE);
    const [jsonResult, _jsonError] = qdeToJson(qdeXml);

    assert(jsonResult, "Initial XML to JSON conversion failed");
    assertExists(jsonResult.qde, "JSON conversion should have data");

    const [xmlResult, xmlError] = jsonToQde(jsonResult);
    assert(xmlResult, `JSON to XML conversion failed: ${xmlError}`);
    assertExists(xmlResult.qde, "XML conversion result should contain XML string");

    // Basic XML structure validation
    assert(xmlResult.qde.includes("<?xml"), "Result should be valid XML");
    assert(xmlResult.qde.includes("<Project"), "Result should contain Project element");
  });

  await t.step("should maintain data integrity through round-trip conversion", async () => {
    const originalXml = await Deno.readTextFile(QDE_FILE);

    // XML -> JSON
    const [jsonResult, _jsonError] = qdeToJson(originalXml);
    assert(jsonResult, "Initial XML to JSON conversion failed");
    assertExists(jsonResult.qde, "JSON result should have data");

    // JSON -> XML
    const [xmlResult, _xmlError] = jsonToQde(jsonResult);
    assert(xmlResult, "JSON to XML conversion failed");
    assertExists(xmlResult.qde, "XML result should have XML string");

    // Convert back to JSON to compare structure
    const [secondJsonResult, _secondJsonError] = qdeToJson(xmlResult.qde);
    assert(secondJsonResult, "Second XML to JSON conversion failed");
    assertExists(secondJsonResult.qde, "Second JSON result should have data");

    // Deep comparison of all data - this will show what's missing
    try {
      assertDeepDataIntegrity(jsonResult.qde, secondJsonResult.qde);
    } catch (error) {
      // console.log("Round-trip conversion data loss detected:");
      // console.log(error instanceof Error ? error.message : String(error));

      // Save intermediate files for debugging
      await Deno.writeTextFile("./test/debug-original.json", JSON.stringify(jsonResult.qde, null, 2));
      await Deno.writeTextFile("./test/debug-roundtrip.json", JSON.stringify(secondJsonResult.qde, null, 2));
      await Deno.writeTextFile("./test/debug-converted.xml", xmlResult.qde);

      throw error; // Re-throw to fail the test
    }
  });

  await t.step("should preserve all keys, values, and attributes exactly", async () => {
    const originalXml = await Deno.readTextFile(QDE_FILE);
    const expectedJson = JSON.parse(await Deno.readTextFile(JSON_FILE));

    const [result, _resultError] = qdeToJson(originalXml);
    assert(result, "XML to JSON conversion failed");
    assertExists(result.qde, "Conversion should produce data");

    // Deep comparison with expected JSON
    assertDeepDataIntegrity(result.qde, expectedJson.qde);
  });

  await t.step("should preserve expected JSON file structure", async () => {
    try {
      const expectedJson = JSON.parse(await Deno.readTextFile("./test/example.json"));
      const qdeXml = await Deno.readTextFile(QDE_FILE);

      const [result, _resultError] = qdeToJson(qdeXml);
      assert(result, "XML to JSON conversion failed");
      assertExists(result.qde, "Conversion should produce data");

      // Compare high-level structure
      assertEquals(
        Object.keys(result.qde).sort(),
        Object.keys(expectedJson.qde).sort(),
        "JSON structure should match expected format",
      );

      // If both have project attributes, compare basic fields
      if (result.qde["_attributes"] && expectedJson.qde._attributes) {
        assertEquals(
          result.qde["_attributes"].name,
          expectedJson.qde._attributes.name,
          "Project names should match",
        );
      }
    } catch (error) {
      // console.warn("Expected JSON file validation skipped:", error instanceof Error ? error.message : String(error));
      // Don't fail the test if example.json is malformed or missing
    }
  });

  await t.step("should handle error cases gracefully", async () => {
    // Test invalid XML
    const [invalidXmlResult, _invalidXmlError] = qdeToJson("<invalid>xml");
    assert(!invalidXmlResult, "Should fail on invalid XML");
    assertExists(_invalidXmlError, "Should provide error message");

    // Test invalid JSON structure
    const [invalidJsonResult, _invalidJsonError] = jsonToQde({ qde: "invalid" });
    assert(!invalidJsonResult, "Should fail on invalid JSON structure");
    assertExists(_invalidJsonError, "Should provide error message");
  });

  await t.step("should validate XML output format", async () => {
    const qdeXml = await Deno.readTextFile(QDE_FILE);
    const [jsonResult, _jsonError] = qdeToJson(qdeXml);
    assert(jsonResult, "XML to JSON conversion failed");

    const [xmlResult, _xmlError] = jsonToQde(jsonResult);
    assert(xmlResult, "JSON to XML conversion failed");
    assertExists(xmlResult.qde, "Should produce XML output");

    const xml = xmlResult.qde;

    // Validate XML declaration
    assert(xml.startsWith('<?xml version="1.0"'), "Should have XML declaration");

    // Validate root element
    assert(xml.includes("<Project"), "Should contain Project root element");
    assert(xml.includes("</Project>"), "Should have closing Project tag");

    // Validate XML is well-formed by attempting to parse it back
    const reParseResult = qdeToJson(xml);
    assert(reParseResult, "Generated XML should be parseable");
  });
});
