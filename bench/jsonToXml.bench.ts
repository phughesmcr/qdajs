/// <reference lib="deno.ns" />

/**
 * Benchmarks for JSON to XML conversion performance
 * Tests various scenarios including data sizes, DOM construction, and serialization patterns
 */

import { jsonToQde } from "../src/qde/jsonToXml.ts";
import type { ProjectJson } from "../src/qde/types.ts";

// Load test data
const fullJsonData = JSON.parse(await Deno.readTextFile("docs/example.json"));
const fullQdeData = fullJsonData.qde as Record<string, unknown>;

// Create test data of different sizes and structures
const smallJsonData: Record<string, unknown> = {
  "_attributes": {
    "name": "Small Test",
    "xmlns": "urn:QDA-XML:project:1.0",
  },
  "Users": {
    "User": [{
      "name": "Test User",
      "guid": "12345678-1234-5678-9012-123456789012",
    }],
  },
  "CodeBook": {
    "Codes": {
      "Code": [{
        "_attributes": {
          "name": "Test Code",
          "color": "#FF0000",
          "guid": "87654321-4321-8765-2109-876543210987",
          "isCodable": true,
        },
        "Description": "Simple test code",
      }],
    },
  },
};

// Create medium-sized data by taking subset of full data
// Build medium data using safe stepwise property access to avoid implicit any
const codeBookObj = fullQdeData["CodeBook"] as Record<string, unknown> | undefined;
const codesContainer = codeBookObj?.["Codes"] as Record<string, unknown> | undefined;
const codesArray = codesContainer?.["Code"] as unknown[] | undefined;

const mediumJsonData: Record<string, unknown> = {
  "_attributes": fullQdeData["_attributes"] as Record<string, unknown>,
  "Users": fullQdeData["Users"] as Record<string, unknown>,
  "CodeBook": {
    "Codes": {
      "Code": Array.isArray(codesArray) ? codesArray.slice(0, 10) as unknown[] : [],
    },
  },
};

// Test data with various structural patterns
const attributeHeavyData: Record<string, unknown> = {
  "_attributes": {
    "name": "Attribute Heavy",
    "origin": "Test",
    "modifiedDateTime": "2024-01-01T00:00:00Z",
    "xmlns": "urn:QDA-XML:project:1.0",
  },
  "Users": {
    "User": Array.from({ length: 100 }, (_, i) => ({
      "name": `User${i}`,
      "guid": `${String(i).padStart(8, "0")}-1234-5678-9012-123456789012`,
    })),
  },
};

const textHeavyData: Record<string, unknown> = {
  "_attributes": {
    "name": "Text Heavy",
    "xmlns": "urn:QDA-XML:project:1.0",
  },
  "CodeBook": {
    "Codes": {
      "Code": Array.from({ length: 50 }, (_, i) => ({
        "_attributes": {
          "name": `Code${i}`,
          "guid": `${String(i).padStart(8, "0")}-1234-5678-9012-123456789012`,
          "isCodable": true,
        },
        "Description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(10),
      })),
    },
  },
};

const deeplyNestedData: Record<string, unknown> = {
  "_attributes": {
    "name": "Deeply Nested",
    "xmlns": "urn:QDA-XML:project:1.0",
  },
  "CodeBook": {
    "Codes": {
      "Code": [{
        "_attributes": {
          "name": "Level1",
          "guid": "11111111-1111-1111-1111-111111111111",
          "isCodable": true,
        },
        "Code": [{
          "_attributes": {
            "name": "Level2",
            "guid": "22222222-2222-2222-2222-222222222222",
            "isCodable": true,
          },
          "Code": [{
            "_attributes": {
              "name": "Level3",
              "guid": "33333333-3333-3333-3333-333333333333",
              "isCodable": true,
            },
            "Code": [{
              "_attributes": {
                "name": "Level4",
                "guid": "44444444-4444-4444-4444-444444444444",
                "isCodable": true,
              },
              "Code": [{
                "_attributes": {
                  "name": "Level5",
                  "guid": "55555555-5555-5555-5555-555555555555",
                  "isCodable": true,
                },
                "Description": "Deep nesting test",
              }],
            }],
          }],
        }],
      }],
    },
  },
};

// Array-heavy data for testing array processing performance
const arrayHeavyData: Record<string, unknown> = {
  "_attributes": {
    "name": "Array Heavy",
    "xmlns": "urn:QDA-XML:project:1.0",
  },
  "Users": {
    "User": Array.from({ length: 500 }, (_, i) => ({
      "name": `User${i}`,
      "guid": `${String(i).padStart(8, "0")}-1234-5678-9012-123456789012`,
    })),
  },
  "CodeBook": {
    "Codes": {
      "Code": Array.from({ length: 200 }, (_, i) => ({
        "_attributes": {
          "name": `Code${i}`,
          "guid": `${String(i).padStart(8, "0")}-1234-5678-9012-123456789012`,
          "isCodable": true,
        },
      })),
    },
  },
};

// Mixed content data (elements with both text and child elements)
const mixedContentData: Record<string, unknown> = {
  "_attributes": {
    "name": "Mixed Content",
    "xmlns": "urn:QDA-XML:project:1.0",
  },
  "CodeBook": {
    "Codes": {
      "Code": Array.from({ length: 20 }, (_, i) => ({
        "_attributes": {
          "name": `Code${i}`,
          "guid": `${String(i).padStart(8, "0")}-1234-5678-9012-123456789012`,
          "isCodable": true,
        },
        "_text": `Mixed content text for code ${i}`,
        "Description": `Description for code ${i}`,
        "Code": [{
          "_attributes": {
            "name": `SubCode${i}`,
            "guid": `${String(i + 1000).padStart(8, "0")}-1234-5678-9012-123456789012`,
            "isCodable": true,
          },
        }],
      })),
    },
  },
};

// Benchmark: Small JSON to XML conversion
Deno.bench("JSON to XML - Small data (< 1KB)", () => {
  const result = jsonToQde(smallJsonData as unknown as ProjectJson);
  if (!result[0]) throw result[1];
});

// Benchmark: Medium JSON to XML conversion
Deno.bench("JSON to XML - Medium data (~50KB)", () => {
  const result = jsonToQde(mediumJsonData as unknown as ProjectJson);
  if (!result[0]) throw result[1];
});

// Benchmark: Full JSON to XML conversion (primary performance test)
Deno.bench("JSON to XML - Full data (~1.1MB)", () => {
  const result = jsonToQde(fullQdeData as unknown as ProjectJson);
  if (!result[0]) throw result[1];
});

// Benchmark: Normalized format (with qde wrapper)
Deno.bench("JSON to XML - Normalized format", () => {
  const result = jsonToQde({ qde: fullQdeData as unknown as ProjectJson });
  if (!result[0]) throw result[1];
});

// Benchmark: Attribute-heavy structure (DOM attribute processing)
Deno.bench("JSON to XML - Attribute heavy (100 users)", () => {
  const result = jsonToQde(attributeHeavyData as unknown as ProjectJson);
  if (!result[0]) throw result[1];
});

// Benchmark: Text-heavy structure (text node creation)
Deno.bench("JSON to XML - Text heavy (large descriptions)", () => {
  const result = jsonToQde(textHeavyData as unknown as ProjectJson);
  if (!result[0]) throw result[1];
});

// Benchmark: Deeply nested structure (DOM tree depth)
Deno.bench("JSON to XML - Deeply nested (5 levels)", () => {
  const result = jsonToQde(deeplyNestedData as unknown as ProjectJson);
  if (!result[0]) throw result[1];
});

// Benchmark: Array-heavy structure (array processing)
Deno.bench("JSON to XML - Array heavy (500 users, 200 codes)", () => {
  const result = jsonToQde(arrayHeavyData as unknown as ProjectJson);
  if (!result[0]) throw result[1];
});

// Benchmark: Mixed content structure (text + elements)
Deno.bench("JSON to XML - Mixed content", () => {
  const result = jsonToQde(mixedContentData as unknown as ProjectJson);
  if (!result[0]) throw result[1];
});

// Benchmark: DOM implementation reuse (testing singleton efficiency)
Deno.bench("JSON to XML - DOM reuse (10 small conversions)", () => {
  for (let i = 0; i < 10; i++) {
    const result = jsonToQde(smallJsonData as unknown as ProjectJson);
    if (!result[0]) throw result[1];
  }
});

// Benchmark: Schema validation overhead
Deno.bench("JSON to XML - With schema validation", () => {
  const result = jsonToQde(fullQdeData as unknown as ProjectJson);
  if (!result[0]) throw result[1];
});

// Benchmark: Memory pressure test (multiple large conversions)
Deno.bench("JSON to XML - Memory pressure (3x full data)", () => {
  for (let i = 0; i < 3; i++) {
    const result = jsonToQde(fullQdeData as unknown as ProjectJson);
    if (!result[0]) throw result[1];
  }
});

// Benchmark: Error handling performance (invalid data)
const invalidData = { invalid: true }; // Missing required fields

Deno.bench("JSON to XML - Error handling (invalid data)", () => {
  const result = jsonToQde(invalidData as unknown as ProjectJson);
  // Expect error, measure error handling performance
  if (result[0]) throw new Error("Expected validation error");
});

// Benchmark: Serialization performance (DOM to string)
Deno.bench("JSON to XML - Serialization heavy (wide structure)", () => {
  const wideData: Record<string, unknown> = {
    "_attributes": {
      "name": "Wide Structure",
      "xmlns": "urn:QDA-XML:project:1.0",
    },
    ...Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [
        `Section${i}`,
        { [`Field${i}`]: `Value${i}` },
      ]),
    ),
  };

  const result = jsonToQde(wideData as unknown as ProjectJson);
  if (!result[0]) throw result[1];
});
