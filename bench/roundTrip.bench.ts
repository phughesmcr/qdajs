/// <reference lib="deno.ns" />

/**
 * Round-trip benchmarks for XML ↔ JSON conversion performance
 * Tests data consistency and performance of full conversion cycles
 */

import { qdeToJson } from "../src/convert/xmlToJson.ts";
import { jsonToQde } from "../src/convert/jsonToXml.ts";

// Load test data
const fullXmlData = await Deno.readTextFile("docs/example.qde");
const fullJsonData = JSON.parse(await Deno.readTextFile("docs/example.json"));

// Create test data of different sizes
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

// Benchmark: Small XML → JSON → XML round trip
Deno.bench("Round-trip - Small file (XML → JSON → XML)", () => {
  // XML to JSON
  const jsonResult = qdeToJson(smallXml);
  if (jsonResult[1]) throw jsonResult[1];

  // JSON back to XML
  const xmlResult = jsonToQde(jsonResult[0]!);
  if (xmlResult[1]) throw xmlResult[1];
});

// Benchmark: Medium XML → JSON → XML round trip
Deno.bench("Round-trip - Medium file (XML → JSON → XML)", () => {
  // XML to JSON
  const jsonResult = qdeToJson(mediumXML);
  if (jsonResult[1]) throw jsonResult[1];

  // JSON back to XML
  const xmlResult = jsonToQde(jsonResult[0]!);
  if (xmlResult[1]) throw xmlResult[1];
});

// Benchmark: Full XML → JSON → XML round trip (primary integration test)
Deno.bench("Round-trip - Full file (XML → JSON → XML)", () => {
  // XML to JSON
  const jsonResult = qdeToJson(fullXmlData);
  if (jsonResult[1]) throw jsonResult[1];

  // JSON back to XML
  const xmlResult = jsonToQde(jsonResult[0]!);
  if (xmlResult[1]) throw xmlResult[1];
});

// Benchmark: JSON → XML → JSON round trip
Deno.bench("Round-trip - Full file (JSON → XML → JSON)", () => {
  // JSON to XML
  const xmlResult = jsonToQde(fullJsonData);
  if (xmlResult[1]) throw xmlResult[1];

  // XML back to JSON
  const jsonResult = qdeToJson(xmlResult[0]!.qde);
  if (jsonResult[1]) throw jsonResult[1];
});

// Benchmark: Multiple round trips (stress test)
Deno.bench("Round-trip - Multiple cycles (5x small file)", () => {
  let currentXml = smallXml;

  for (let i = 0; i < 5; i++) {
    // XML to JSON
    const jsonResult = qdeToJson(currentXml);
    if (jsonResult[1]) throw jsonResult[1];

    // JSON back to XML
    const xmlResult = jsonToQde(jsonResult[0]!);
    if (xmlResult[1]) throw xmlResult[1];

    currentXml = xmlResult[0]!.qde;
  }
});

// Benchmark: Conversion with data validation
Deno.bench("Round-trip - With data consistency check", () => {
  // XML to JSON
  const jsonResult = qdeToJson(fullXmlData);
  if (jsonResult[1]) throw jsonResult[1];

  // JSON back to XML
  const xmlResult = jsonToQde(jsonResult[0]!);
  if (xmlResult[1]) throw xmlResult[1];

  // Verify round-trip by converting back to JSON
  const verifyResult = qdeToJson(xmlResult[0]!.qde);
  if (verifyResult[1]) throw verifyResult[1];

  // Basic consistency check (structure should be similar)
  const original = jsonResult[0]!.qde["_attributes"];
  const roundTrip = verifyResult[0]!.qde["_attributes"];

  if (!original || !roundTrip) {
    throw new Error("Missing project attributes after round-trip");
  }

  if (original.name !== roundTrip.name) {
    throw new Error("Project name changed during round-trip");
  }
});

// Benchmark: Memory efficiency (multiple conversions without accumulation)
Deno.bench("Round-trip - Memory efficiency (10x medium file)", () => {
  for (let i = 0; i < 10; i++) {
    // XML to JSON
    const jsonResult = qdeToJson(mediumXML);
    if (jsonResult[1]) throw jsonResult[1];

    // JSON back to XML
    const xmlResult = jsonToQde(jsonResult[0]!);
    if (xmlResult[1]) throw xmlResult[1];

    // Don't accumulate results to test garbage collection
  }
});

// Benchmark: Error recovery in round-trip
Deno.bench("Round-trip - Error handling", () => {
  const invalidXml = smallXml.replace("</Project>", ""); // Missing closing tag

  // First conversion should fail
  const jsonResult = qdeToJson(invalidXml);
  if (!jsonResult[1]) throw new Error("Expected XML parsing error");

  // Try with valid data after error
  const validJsonResult = qdeToJson(smallXml);
  if (validJsonResult[1]) throw validJsonResult[1];

  const xmlResult = jsonToQde(validJsonResult[0]!);
  if (xmlResult[1]) throw xmlResult[1];
});
