/// <reference lib="deno.ns" />

import { assert, assertEquals, assertExists } from "@std/assert";
import { configure } from "@zip-js/zip-js";
import { qde, qdpx } from "../mod.ts";
import type { SourceFile } from "../src/qdpx/pack.ts";

const { pack, unpack } = qdpx;
const EXAMPLE_QDE_FILE = "./docs/example.qde";

configure({ useWebWorkers: false });

Deno.test("QDPX Basic Functionality", async (t) => {
  await t.step("should pack and unpack QDE successfully", async () => {
    // Read and parse QDE
    const qdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(qdeXml);
    assert(parseOk, "Should parse QDE XML");

    // Create a simple source file
    const sourceFiles: SourceFile[] = [
      {
        path: "test.txt",
        content: "Test content",
        mimeType: "text/plain",
      },
    ];

    // Pack
    const qdpxBlob = await pack(qdeJson.qde, sourceFiles);
    assertExists(qdpxBlob, "Pack should return a Blob");
    assert(qdpxBlob.size > 0, "QDPX file should have content");

    // Unpack
    const [unpackOk, unpacker] = await unpack(qdpxBlob);
    assert(unpackOk, "Unpack should succeed");

    // Check entries
    const entries = (unpacker as any).entries;
    assertExists(entries, "Should have entries");
    assertEquals(entries.length, 2, "Should have project.qde + 1 source file");

    // Check project QDE content by parsing both and comparing structure
    const extractedQde = await (unpacker as any).readProjectQde();
    assertExists(extractedQde, "Should extract project QDE");

    // Parse both to verify semantic equivalence
    const [originalOk, originalJson] = qde.toJson(qdeXml);
    const [extractedOk, extractedJson] = qde.toJson(extractedQde);

    assert(originalOk && extractedOk, "Both QDE should parse successfully");

    // Compare the parsed JSON structures (semantic comparison)
    assertEquals(JSON.stringify(originalJson), JSON.stringify(extractedJson), "QDE semantic content should match");

    // Close
    await (unpacker as any).close();
  });

  await t.step("should handle QDE-only pack", async () => {
    const qdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(qdeXml);
    assert(parseOk, "Should parse QDE XML");

    // Pack with no source files
    const qdpxBlob = await pack(qdeJson.qde, []);

    // Unpack
    const [unpackOk, unpacker] = await unpack(qdpxBlob);
    assert(unpackOk, "Should unpack QDE-only");

    const entries = (unpacker as any).entries;
    assertEquals(entries.length, 1, "Should contain only project.qde");
    assertEquals(entries[0].filename, "project.qde", "Should be project.qde");

    await (unpacker as any).close();
  });
});
