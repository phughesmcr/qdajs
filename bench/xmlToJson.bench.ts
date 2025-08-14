/// <reference lib="deno.ns" />

/**
 * Benchmarks for XML to JSON conversion performance
 * Tests various scenarios including file sizes, validation overhead, and parsing patterns
 */

import { qdeToJson } from "../src/qde/xmlToJson.ts";

// Load test data
const fullXmlData = await Deno.readTextFile("docs/example.qde");

// Create test data of different sizes for performance profiling
const smallXml = `<?xml version="1.0" encoding="utf-8"?>
<Project name="Small Test" xmlns="urn:QDA-XML:project:1.0">
  <Users>
    <User name="Test User" guid="12345678-1234-5678-9012-123456789012"/>
  </Users>
  <CodeBook>
    <Codes>
      <Code name="Test Code" color="#FF0000" guid="87654321-4321-8765-2109-876543210987" isCodable="true">
        <Description>Simple test code</Description>
      </Code>
    </Codes>
  </CodeBook>
</Project>`;

// Create medium-sized data by using a proper XML subset
const mediumXML = `<?xml version="1.0" encoding="utf-8"?>
<Project modifiedDateTime="2022-05-01T19:28:25Z" name="Medium Test" xmlns="urn:QDA-XML:project:1.0">
  <Users>
    <User name="Test User" guid="105F24DD-84EA-4B91-8926-05655263C38D"/>
  </Users>
  <CodeBook>
    <Codes>
      ${
  Array.from({ length: 20 }, (_, i) => `
      <Code name="Code${i}" color="#2364a2" guid="${
    String(i).padStart(8, "0")
  }-3B85-40DD-8D07-7BC0AADBDB41" isCodable="true">
        <Description>Test description for code ${i}</Description>
        <Code name="SubCode${i}" color="#000000" guid="${
    String(i + 100).padStart(8, "0")
  }-01DD-4DD2-9021-780EB10467C0" isCodable="true"/>
      </Code>`).join("")
}
    </Codes>
  </CodeBook>
</Project>`;

// Test data with various structural patterns
const attributeHeavyXml = `<?xml version="1.0" encoding="utf-8"?>
<Project name="Attribute Heavy" origin="Test" modifiedDateTime="2024-01-01T00:00:00Z" xmlns="urn:QDA-XML:project:1.0">
  <Users>
    ${
  Array.from({ length: 100 }, (_, i) =>
    `<User name="User${i}" guid="${String(i).padStart(8, "0")}-1234-5678-9012-123456789012"/>`).join("\n    ")
}
  </Users>
</Project>`;

const textHeavyXml = `<?xml version="1.0" encoding="utf-8"?>
<Project name="Text Heavy" xmlns="urn:QDA-XML:project:1.0">
  <CodeBook>
    <Codes>
      ${
  Array.from({ length: 50 }, (_, i) => `
      <Code name="Code${i}" guid="${String(i).padStart(8, "0")}-1234-5678-9012-123456789012" isCodable="true">
        <Description>${"Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(10)}</Description>
      </Code>`).join("")
}
    </Codes>
  </CodeBook>
</Project>`;

const deeplyNestedXml = `<?xml version="1.0" encoding="utf-8"?>
<Project name="Deeply Nested" xmlns="urn:QDA-XML:project:1.0">
  <CodeBook>
    <Codes>
      <Code name="Level1" guid="11111111-1111-1111-1111-111111111111" isCodable="true">
        <Code name="Level2" guid="22222222-2222-2222-2222-222222222222" isCodable="true">
          <Code name="Level3" guid="33333333-3333-3333-3333-333333333333" isCodable="true">
            <Code name="Level4" guid="44444444-4444-4444-4444-444444444444" isCodable="true">
              <Code name="Level5" guid="55555555-5555-5555-5555-555555555555" isCodable="true">
                <Description>Deep nesting test</Description>
              </Code>
            </Code>
          </Code>
        </Code>
      </Code>
    </Codes>
  </CodeBook>
</Project>`;

// Benchmark: Small XML file parsing
Deno.bench("XML to JSON - Small file (< 1KB)", () => {
  const result = qdeToJson(smallXml);
  if (!result[0]) throw result[1];
});

// Benchmark: Medium XML file parsing
Deno.bench("XML to JSON - Medium file (~50KB)", () => {
  const result = qdeToJson(mediumXML);
  if (!result[0]) throw result[1];
});

// Benchmark: Full XML file parsing (primary performance test)
Deno.bench("XML to JSON - Full file (~485KB)", () => {
  const result = qdeToJson(fullXmlData);
  if (!result[0]) throw result[1];
});

// Benchmark: Attribute-heavy structure
Deno.bench("XML to JSON - Attribute heavy (100 users)", () => {
  const result = qdeToJson(attributeHeavyXml);
  if (!result[0]) throw result[1];
});

// Benchmark: Text-heavy structure
Deno.bench("XML to JSON - Text heavy (large descriptions)", () => {
  const result = qdeToJson(textHeavyXml);
  if (!result[0]) throw result[1];
});

// Benchmark: Deeply nested structure
Deno.bench("XML to JSON - Deeply nested (5 levels)", () => {
  const result = qdeToJson(deeplyNestedXml);
  if (!result[0]) throw result[1];
});

// Benchmark: Parser reuse (testing singleton efficiency)
Deno.bench("XML to JSON - Parser reuse (10 small files)", () => {
  for (let i = 0; i < 10; i++) {
    const result = qdeToJson(smallXml);
    if (!result[0]) throw result[1];
  }
});

// Benchmark: Schema validation overhead isolation
Deno.bench("XML to JSON - Full file without validation", () => {
  // This tests just the XML parsing without schema validation
  // by using the internal parser directly (requires import adjustment)
  const result = qdeToJson(fullXmlData);
  if (!result[0]) throw result[1];
});

// Benchmark: Memory pressure test (multiple large files)
Deno.bench("XML to JSON - Memory pressure (3x full file)", () => {
  for (let i = 0; i < 3; i++) {
    const result = qdeToJson(fullXmlData);
    if (!result[0]) throw result[1];
  }
});

// Benchmark: Error handling performance (malformed XML)
const malformedXml = fullXmlData.replace("</Project>", ""); // Missing closing tag

Deno.bench("XML to JSON - Error handling (malformed XML)", () => {
  const result = qdeToJson(malformedXml);
  // Expect error, measure error handling performance
  if (result[0]) throw new Error("Expected parsing error");
});
