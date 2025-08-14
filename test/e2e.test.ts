/// <reference lib="deno.ns" />

import { assert, assertEquals, assertExists } from "@std/assert";
import { configure } from "@zip-js/zip-js";
import { qde, qdpx } from "../mod.ts";
import type { ProjectJson } from "../src/qde/types.ts";

const EXAMPLE_QDPX_FILE = "./docs/example.qdpx";
const TEST_OUTPUT_DIR = "./test/temp_e2e";

configure({ useWebWorkers: false });

/**
 * End-to-end test that performs the complete cycle:
 * 1. Unpack QDPX to directory
 * 2. Convert project.qde to JSON
 * 3. Convert JSON back to QDE XML
 * 4. Repack directory to QDPX
 */

Deno.test("End-to-End QDPX Processing", async (t) => {
  await t.step("should complete full unpack → convert → repack cycle", async () => {
    // Clean up any previous test artifacts
    try {
      await Deno.remove(TEST_OUTPUT_DIR, { recursive: true });
    } catch {
      // Directory might not exist, that's fine
    }

    await Deno.mkdir(TEST_OUTPUT_DIR, { recursive: true });

    try {
      // Step 1: Load and unpack the example QDPX file
      const qdpxBlob = await Deno.readFile(EXAMPLE_QDPX_FILE).then((data) => new Blob([data]));
      const [unpackOk, unpacker] = await qdpx.unpack(qdpxBlob);

      assert(unpackOk, `Failed to unpack QDPX: ${unpacker}`);
      assertExists((unpacker as any).entries, "Should have entries after unpacking");

      console.log(`✓ Unpacked QDPX with ${(unpacker as any).entries.length} entries`);

      // Step 2: Extract all files to disk using extractAll() generator
      let fileCount = 0;
      let originalQdeXml = "";

      // First get project.qde using the dedicated method (more reliable)
      originalQdeXml = await (unpacker as any).readProjectQde();
      await Deno.writeTextFile(`${TEST_OUTPUT_DIR}/project.qde`, originalQdeXml);
      fileCount++;

      // Then use extractAll() for the remaining source files
      const dataGenerator = (unpacker as any).extractAll();
      const entriesArray = (unpacker as any).entries;
      let entryIndex = 0;

      for await (const fileData of dataGenerator) {
        const entry = entriesArray[entryIndex];

        // Skip project.qde since we already handled it
        if (entry.filename !== "project.qde") {
          const filePath = `${TEST_OUTPUT_DIR}/${entry.filename}`;

          // Create subdirectory if needed (for sources/)
          const dir = filePath.substring(0, filePath.lastIndexOf("/"));
          if (dir !== TEST_OUTPUT_DIR) {
            await Deno.mkdir(dir, { recursive: true });
          }

          await Deno.writeFile(filePath, new Uint8Array(fileData));
          fileCount++;
        }
        entryIndex++;
      }

      assertExists(originalQdeXml, "Should have extracted project.qde");
      assert(originalQdeXml.includes("<?xml"), "Project QDE should be valid XML");
      console.log(`✓ Extracted ${fileCount} files to ${TEST_OUTPUT_DIR}/`);

      // Step 2.5: Diff verification against source of truth
      const TRUTH_DIR = "./docs/example_qdpx_unpacked";
      const TRUTH_SOURCES_DIR = `${TRUTH_DIR}/sources`;
      let diffResults = { identical: 0, different: 0, missing: 0, extra: 0 };

      // Compare project.qde with source of truth
      // Note: We compare the ORIGINAL extracted QDE (before conversion) with truth
      try {
        const truthProjectQde = await Deno.readTextFile(`${TRUTH_DIR}/project.qde`);
        if (originalQdeXml === truthProjectQde) {
          console.log(`✓ project.qde matches source of truth exactly`);
          diffResults.identical++;
        } else {
          // For project.qde, we expect differences due to XML formatting during extraction
          // Let's check if they're semantically equivalent by converting both to JSON
          const [truthOk, truthJson] = qde.toJson(truthProjectQde);
          const [extractedOk, extractedJson] = qde.toJson(originalQdeXml);

          if (
            truthOk && extractedOk &&
            JSON.stringify(truthJson.qde) === JSON.stringify(extractedJson.qde)
          ) {
            console.log(`✓ project.qde is semantically identical to source of truth`);
            console.log(
              `  Truth: ${truthProjectQde.length} chars, Extracted: ${originalQdeXml.length} chars (formatting differences expected)`,
            );
            diffResults.identical++;
          } else {
            console.log(`❌ project.qde differs semantically from source of truth`);
            console.log(`  Truth: ${truthProjectQde.length} chars, Extracted: ${originalQdeXml.length} chars`);
            console.log(`  Truth JSON OK: ${truthOk}, Extracted JSON OK: ${extractedOk}`);
            diffResults.different++;
          }
        }
      } catch (error) {
        console.log(`❌ Could not read source of truth project.qde: ${error}`);
        diffResults.missing++;
      }

      // Compare all source files with source of truth
      try {
        const truthSourceFiles = [];
        for await (const entry of Deno.readDir(TRUTH_SOURCES_DIR)) {
          if (entry.isFile) {
            truthSourceFiles.push(entry.name);
          }
        }

        const extractedSourceFiles = [];
        for await (const entry of Deno.readDir(`${TEST_OUTPUT_DIR}/sources`)) {
          if (entry.isFile) {
            extractedSourceFiles.push(entry.name);
          }
        }

        // Check each truth file exists in extracted
        for (const truthFile of truthSourceFiles) {
          if (extractedSourceFiles.includes(truthFile)) {
            const truthContent = await Deno.readTextFile(`${TRUTH_SOURCES_DIR}/${truthFile}`);
            const extractedContent = await Deno.readTextFile(`${TEST_OUTPUT_DIR}/sources/${truthFile}`);

            if (truthContent === extractedContent) {
              diffResults.identical++;
            } else {
              console.log(`⚠ ${truthFile} differs from source of truth`);
              console.log(`  Extracted: ${extractedContent.length} chars, Truth: ${truthContent.length} chars`);
              diffResults.different++;
            }
          } else {
            console.log(`❌ Missing file: ${truthFile}`);
            diffResults.missing++;
          }
        }

        // Check for extra files in extracted
        for (const extractedFile of extractedSourceFiles) {
          if (!truthSourceFiles.includes(extractedFile)) {
            console.log(`⚠ Extra file: ${extractedFile}`);
            diffResults.extra++;
          }
        }

        console.log(
          `✓ Diff verification: ${diffResults.identical} identical, ${diffResults.different} different, ${diffResults.missing} missing, ${diffResults.extra} extra`,
        );

        // Assert perfect match
        assertEquals(diffResults.different, 0, "All files should match source of truth exactly");
        assertEquals(diffResults.missing, 0, "No files should be missing");
        assertEquals(diffResults.extra, 0, "No extra files should be present");
        assertEquals(diffResults.identical, 52, "All 52 files (1 project + 51 sources) should match exactly");
      } catch (error) {
        console.log(`❌ Could not perform source file diff: ${error}`);
        throw error;
      }

      // Step 3: Convert QDE XML to JSON
      const [qdeToJsonOk, qdeJsonResult] = qde.toJson(originalQdeXml);
      assert(qdeToJsonOk, `Failed to convert QDE to JSON: ${qdeJsonResult}`);
      assertExists(qdeJsonResult.qde, "Should have QDE JSON data");

      console.log("✓ Converted QDE XML to JSON");

      // Step 4: Convert JSON back to QDE XML
      const [jsonToQdeOk, qdeXmlResult] = qde.fromJson(qdeJsonResult);
      assert(jsonToQdeOk, `Failed to convert JSON to QDE: ${qdeXmlResult}`);
      assertExists(qdeXmlResult.qde, "Should have regenerated QDE XML");

      console.log(`✓ Converted JSON back to QDE XML (${qdeXmlResult.qde.length} characters)`);

      // Write the converted QDE back to disk
      await Deno.writeTextFile(`${TEST_OUTPUT_DIR}/project.qde`, qdeXmlResult.qde);
      console.log("✓ Wrote converted project.qde back to disk");

      // Step 5: Read source files from disk for repacking
      const sourceFiles = [];

      try {
        const sourcesDir = `${TEST_OUTPUT_DIR}/sources`;
        const sourceEntries = Deno.readDir(sourcesDir);

        for await (const entry of sourceEntries) {
          if (entry.isFile) {
            const content = await Deno.readTextFile(`${sourcesDir}/${entry.name}`);
            sourceFiles.push({
              path: entry.name, // Already flat filename from disk
              content: content,
              mimeType: entry.name.endsWith(".txt") ? "text/plain" : undefined,
            });
          }
        }
      } catch {
        // No sources directory or empty - that's fine for some QDPX files
      }

      console.log(`✓ Read ${sourceFiles.length} source files from disk`);

      // Step 6: Repack with the converted QDE and original source files
      const repackedBlob = await qdpx.pack(qdeJsonResult.qde, sourceFiles);
      assertExists(repackedBlob, "Should successfully repack QDPX");
      assert(repackedBlob instanceof Blob, "Repacked result should be a Blob");
      assert(repackedBlob.size > 0, "Repacked QDPX should have content");

      console.log(`✓ Repacked QDPX (${repackedBlob.size} bytes)`);

      // Step 7: Verify the repacked QDPX by unpacking it again
      const [verifyUnpackOk, verifyUnpacker] = await qdpx.unpack(repackedBlob);
      assert(verifyUnpackOk, `Failed to unpack repacked QDPX: ${verifyUnpacker}`);

      const verifyProjectQde = await (verifyUnpacker as any).readProjectQde();
      assertExists(verifyProjectQde, "Should be able to read project from repacked QDPX");

      console.log(`✓ Verified repacked QDPX contains valid project.qde`);

      // Step 8: Semantic comparison of original vs final QDE
      const [originalJsonOk, originalJsonResult] = qde.toJson(originalQdeXml);
      const [finalJsonOk, finalJsonResult] = qde.toJson(verifyProjectQde);

      assert(originalJsonOk && finalJsonOk, "Both original and final QDE should parse to JSON");

      // Deep comparison - the JSON structures should be identical
      assertEquals(
        JSON.stringify(originalJsonResult.qde, null, 0),
        JSON.stringify(finalJsonResult.qde, null, 0),
        "QDE content should be semantically preserved through the complete cycle",
      );

      // Verify file count is preserved
      assertEquals(
        (unpacker as any).entries.length,
        (verifyUnpacker as any).entries.length,
        "File count should be preserved through the cycle",
      );

      console.log("✓ End-to-end cycle completed successfully with data integrity preserved");

      // Verify the extracted directory structure
      const extractedFiles = [];
      for await (const entry of Deno.readDir(TEST_OUTPUT_DIR)) {
        if (entry.isFile) {
          extractedFiles.push(entry.name);
        } else if (entry.isDirectory) {
          for await (const subEntry of Deno.readDir(`${TEST_OUTPUT_DIR}/${entry.name}`)) {
            extractedFiles.push(`${entry.name}/${subEntry.name}`);
          }
        }
      }

      console.log(`✓ Directory structure verified: ${extractedFiles.length} files extracted to ${TEST_OUTPUT_DIR}/`);
      console.log(`  Files: project.qde, sources/ with ${sourceFiles.length} source files`);

      // Clean up
      await (unpacker as any).close();
      await (verifyUnpacker as any).close();
    } finally {
      // Keep temp directory for inspection - uncomment next line to clean up
      // await Deno.remove(TEST_OUTPUT_DIR, { recursive: true }).catch(() => {});
    }
  });

  await t.step("should handle QDPX with multiple file types in complete cycle", async () => {
    // This test verifies that different source file types survive the complete cycle

    // Load the example QDE for the project structure
    const qdpxBlob = await Deno.readFile(EXAMPLE_QDPX_FILE).then((data) => new Blob([data]));
    const [unpackOk, unpacker] = await qdpx.unpack(qdpxBlob);
    assert(unpackOk, "Should unpack example QDPX");

    const projectQde = await (unpacker as any).readProjectQde();
    const [parseOk, qdeJson] = qde.toJson(projectQde);
    assert(parseOk, "Should parse project QDE");

    // Create test files with various types commonly used in QDA research
    const testFiles = [
      { path: "interview_01.txt", content: "Participant A: I believe accessibility means...", mimeType: "text/plain" },
      { path: "notes.txt", content: "Field observations from site visit..." },
      { path: "document.pdf", content: new ArrayBuffer(400), mimeType: "application/pdf" },
      { path: "photo.jpg", content: new ArrayBuffer(300), mimeType: "image/jpeg" },
      { path: "audio.m4a", content: new ArrayBuffer(500), mimeType: "audio/mp4" },
    ];

    // Pack with mixed file types
    const mixedQdpx = await qdpx.pack(qdeJson.qde, testFiles);

    // Unpack the mixed QDPX
    const [mixedUnpackOk, mixedUnpacker] = await qdpx.unpack(mixedQdpx);
    assert(mixedUnpackOk, "Should unpack mixed file type QDPX");

    // Convert project through JSON cycle
    const originalQde = await (mixedUnpacker as any).readProjectQde();
    const [toJsonOk, jsonResult] = qde.toJson(originalQde);
    assert(toJsonOk, "Should convert QDE to JSON");
    const [toQdeOk, _qdeResult] = qde.fromJson((jsonResult as { qde: ProjectJson }).qde as ProjectJson);
    assert(toQdeOk, "Should convert JSON back to QDE");

    // Extract source files for repacking using extractAll()
    const extractedFiles = [];
    const mixedDataGenerator = (mixedUnpacker as any).extractAll();
    const mixedEntriesArray = (mixedUnpacker as any).entries;
    let mixedEntryIndex = 0;

    for await (const fileData of mixedDataGenerator) {
      const entry = mixedEntriesArray[mixedEntryIndex];

      if (entry.filename !== "project.qde") {
        const originalFile = testFiles.find((f) => f.path === entry.filename);

        // Strip "sources/" prefix for repacking (pack expects flat filenames)
        const flatFilename = entry.filename.startsWith("sources/")
          ? entry.filename.substring("sources/".length)
          : entry.filename;

        if (originalFile?.mimeType?.startsWith("text/")) {
          // Text files - decode as string
          const content = new TextDecoder().decode(fileData);
          extractedFiles.push({
            path: flatFilename,
            content: content,
            mimeType: originalFile.mimeType,
          });
        } else {
          // Binary files - keep as ArrayBuffer
          extractedFiles.push({
            path: flatFilename,
            content: fileData,
            mimeType: originalFile?.mimeType,
          });
        }
      }
      mixedEntryIndex++;
    }

    // Repack with converted QDE
    const finalQdpx = await qdpx.pack(jsonResult.qde, extractedFiles);

    // Final verification
    const [finalUnpackOk, finalUnpacker] = await qdpx.unpack(finalQdpx);
    assert(finalUnpackOk, "Should unpack final QDPX");

    assertEquals(
      (finalUnpacker as any).entries.length,
      testFiles.length + 1, // +1 for project.qde
      "Should preserve all file types through complete cycle",
    );

    console.log(`✓ Mixed file type cycle completed: ${testFiles.length} files + project`);

    await (unpacker as any).close();
    await (mixedUnpacker as any).close();
    await (finalUnpacker as any).close();
  });
});
