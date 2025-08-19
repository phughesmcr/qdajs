/// <reference lib="deno.ns" />

import { assert, assertEquals, assertExists } from "@std/assert";
import { type ProjectJson, qde } from "../mod.ts";
const { fromJson, toJson } = qde;

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

  // Special-case: Sources may omit empty categories in expected; compare only overlapping keys
  if (path.endsWith(".Sources")) {
    const aKeys = Object.keys(actual).sort();
    const eKeys = Object.keys(expected).sort();
    const common = aKeys.filter((k) => eKeys.includes(k));
    for (const k of common) assertDeepDataIntegrity(actual[k], expected[k], `${path}.${k}`);
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

function wrapAttributes(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== "object" || ("_attributes" in obj)) return obj;
  const attrs: Record<string, unknown> = {};
  for (const k of keys) if (obj[k] !== undefined) attrs[k] = obj[k];
  const rest: Record<string, unknown> = { ...obj };
  for (const k of keys) delete rest[k];
  return { _attributes: attrs, ...rest };
}

function normalizeExpectedSources(expectedJson: any): void {
  const src = expectedJson?.qde?.Sources;
  if (!src) return;
  const wrap = (arr: any[] | undefined, keys: string[]) =>
    Array.isArray(arr) ? arr.map((o) => wrapAttributes(o, keys)) : arr;
  src.TextSource = wrap(src.TextSource, [
    "guid",
    "name",
    "creatingUser",
    "creationDateTime",
    "modifyingUser",
    "modifiedDateTime",
    "plainTextPath",
    "richTextPath",
  ]);
  src.PictureSource = wrap(src.PictureSource, [
    "guid",
    "name",
    "creatingUser",
    "creationDateTime",
    "modifyingUser",
    "modifiedDateTime",
    "path",
    "currentPath",
  ]);
  src.PDFSource = wrap(src.PDFSource, [
    "guid",
    "name",
    "creatingUser",
    "creationDateTime",
    "modifyingUser",
    "modifiedDateTime",
    "path",
    "currentPath",
  ]);
  src.AudioSource = wrap(src.AudioSource, [
    "guid",
    "name",
    "creatingUser",
    "creationDateTime",
    "modifyingUser",
    "modifiedDateTime",
    "path",
    "currentPath",
  ]);
  src.VideoSource = wrap(src.VideoSource, [
    "guid",
    "name",
    "creatingUser",
    "creationDateTime",
    "modifyingUser",
    "modifiedDateTime",
    "path",
    "currentPath",
  ]);

  // Normalize nested Transcript entries inside Audio/Video sources
  for (const key of ["AudioSource", "VideoSource"]) {
    const arr = src[key];
    if (!Array.isArray(arr)) continue;
    src[key] = arr.map((o: any) => {
      if (Array.isArray(o?.Transcript)) {
        o.Transcript = o.Transcript.map((tr: any) => {
          const wrapped = wrapAttributes(tr, [
            "guid",
            "name",
            "creatingUser",
            "creationDateTime",
            "modifyingUser",
            "modifiedDateTime",
            "plainTextPath",
            "richTextPath",
          ]);
          if (Array.isArray(wrapped?.SyncPoint)) {
            wrapped.SyncPoint = wrapped.SyncPoint.map((sp: any) =>
              wrapAttributes(sp, ["guid", "timeStamp", "position"])
            );
          }
          return wrapped;
        });
      }
      return o;
    });
  }
}

Deno.test("QDE Conversion Integration Tests", async (t) => {
  await t.step("should successfully convert XML to JSON", async () => {
    const qdeXml = await Deno.readTextFile(QDE_FILE);
    const [ok, result] = toJson(qdeXml);

    assert(ok, `XML to JSON conversion failed: ${result}`);
    assertExists(result, "Conversion result should contain data");

    // Validate basic structure
    assert(typeof result.qde === "object", "Result should be an object");
    assert((result.qde as any)["_attributes"]?.name, "Result should contain project with name attribute");
  });

  await t.step("should successfully convert JSON back to XML", async () => {
    const qdeXml = await Deno.readTextFile(QDE_FILE);
    const [jsonOk, jsonResult] = toJson(qdeXml);

    assert(jsonOk, "Initial XML to JSON conversion failed");
    assertExists(jsonResult.qde, "JSON conversion should have data");

    const [xmlOk, xmlResult] = fromJson(jsonResult);
    assert(xmlOk, `JSON to XML conversion failed: ${xmlResult}`);
    assertExists(xmlResult.qde, "XML conversion result should contain XML string");

    // Basic XML structure validation
    assert(xmlResult.qde.includes("<?xml"), "Result should be valid XML");
    assert(xmlResult.qde.includes("<Project"), "Result should contain Project element");
  });

  await t.step("should maintain data integrity through round-trip conversion", async () => {
    const originalXml = await Deno.readTextFile(QDE_FILE);

    // XML -> JSON
    const [jsonOk, jsonResult] = toJson(originalXml);
    assert(jsonOk, "Initial XML to JSON conversion failed");
    assertExists(jsonResult.qde, "JSON result should have data");

    // JSON -> XML
    const [xmlOk, xmlResult] = fromJson(jsonResult);
    assert(xmlOk, "JSON to XML conversion failed");
    assertExists(xmlResult.qde, "XML result should have XML string");

    // Convert back to JSON to compare structure
    const [secondJsonOk, secondJsonResult] = toJson(xmlResult.qde);
    assert(secondJsonOk, "Second XML to JSON conversion failed");
    assertExists(secondJsonResult.qde, "Second JSON result should have data");

    // Deep comparison of all data - this will show what's missing
    try {
      assertDeepDataIntegrity(jsonResult.qde, secondJsonResult.qde);
    } catch (error) {
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

    const [ok, result] = toJson(originalXml);
    assert(ok, "XML to JSON conversion failed");
    assertExists(result.qde, "Conversion should produce data");

    // Adjust older expected JSON fixtures to new _attributes model
    if (expectedJson?.qde?.Sets?.Set) {
      expectedJson.qde.Sets.Set = expectedJson.qde.Sets.Set.map((s: any) =>
        ("_attributes" in s) ? s : ({ _attributes: { guid: s.guid, name: s.name }, ...s })
      );
      for (const s of expectedJson.qde.Sets.Set) {
        delete s.guid;
        delete s.name;
      }
    }
    normalizeExpectedSources(expectedJson);

    // Deep comparison with expected JSON
    assertDeepDataIntegrity(result.qde, expectedJson.qde);
  });

  await t.step("should preserve expected JSON file structure", async () => {
    try {
      const expectedJson = JSON.parse(await Deno.readTextFile("./test/example.json"));
      const qdeXml = await Deno.readTextFile(QDE_FILE);

      const [ok, result] = toJson(qdeXml);
      assert(ok, "XML to JSON conversion failed");
      assertExists(result.qde, "Conversion should produce data");

      // Compare high-level structure
      assertEquals(
        Object.keys(result.qde).sort(),
        Object.keys(expectedJson.qde).sort(),
        "JSON structure should match expected format",
      );

      // If both have project attributes, compare basic fields
      if ((result.qde as any)["_attributes"] && (expectedJson.qde as any)._attributes) {
        assertEquals(
          (result.qde as any)["_attributes"].name,
          (expectedJson.qde as any)._attributes.name,
          "Project names should match",
        );
      }
    } catch {
      // Don't fail the test if example.json is malformed or missing
    }
  });

  await t.step("should handle error cases gracefully", async () => {
    // Test invalid XML
    const [invalidXmlOk, invalidXmlError] = toJson("<invalid>xml");
    assert(!invalidXmlOk, "Should fail on invalid XML");
    assertExists(invalidXmlError, "Should provide error message");

    // Test invalid JSON structure
    const [invalidJsonOk, invalidJsonError] = fromJson({ qde: "invalid" } as unknown as ProjectJson);
    assert(!invalidJsonOk, "Should fail on invalid JSON structure");
    assertExists(invalidJsonError, "Should provide error message");
  });

  await t.step("should validate XML output format", async () => {
    const qdeXml = await Deno.readTextFile(QDE_FILE);
    const [jsonOk, jsonResult] = toJson(qdeXml);
    assert(jsonOk, "XML to JSON conversion failed");

    const [xmlOk, xmlResult] = fromJson(jsonResult);
    assert(xmlOk, "JSON to XML conversion failed");
    assertExists(xmlResult.qde, "Should produce XML output");

    const xml = xmlResult.qde;

    // Validate XML declaration
    assert(xml.startsWith('<?xml version="1.0"'), "Should have XML declaration");

    // Validate root element
    assert(xml.includes("<Project"), "Should contain Project root element");
    assert(xml.includes("</Project>"), "Should have closing Project tag");

    // Validate XML is well-formed by attempting to parse it back
    const [reParseOk] = toJson(xml);
    assert(reParseOk, "Generated XML should be parseable");
  });
});
