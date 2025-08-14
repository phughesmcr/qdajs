/// <reference lib="deno.ns" />

import { assert, assertEquals, assertExists, assertRejects } from "@std/assert";
import { configure } from "@zip-js/zip-js";
import { qde, qdpx } from "../mod.ts";
import type { SourceFile } from "../src/qdpx/pack.ts";

const { pack, unpack } = qdpx;
const EXAMPLE_QDE_FILE = "./docs/example.qde";
const EXAMPLE_QDPX_FILE = "./docs/example.qdpx";

configure({ useWebWorkers: false });

/**
 * Helper function to create test source files for QDA research
 */
function createResearchSourceFiles(): SourceFile[] {
  return [
    // Interview transcript (most common in QDA)
    {
      path: "participant_01.txt",
      content: "Interviewer: How do you define accessibility?\nParticipant: I think it's about...",
      mimeType: "text/plain",
    },
    // Field notes
    {
      path: "session_notes.txt",
      content: "Observation session 1: Key themes emerging around barriers to access.",
    },
    // Supporting image
    {
      path: "facility_entrance.jpg",
      content: new ArrayBuffer(200), // Mock JPEG data
      mimeType: "image/jpeg",
    },
  ];
}

/**
 * Semantic comparison of QDE content by parsing both
 */
async function assertQdeSemanticEquality(qde1: string, qde2: string, message: string): Promise<void> {
  const [ok1, json1] = qde.toJson(qde1);
  const [ok2, json2] = qde.toJson(qde2);

  assert(ok1 && ok2, "Both QDE should parse successfully");
  assertEquals(JSON.stringify(json1), JSON.stringify(json2), message);
}

Deno.test("QDPX Core Functionality Tests", async (t) => {
  await t.step("should pack QDE JSON with source files into QDPX", async () => {
    const qdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(qdeXml);
    assert(parseOk, "Should parse QDE XML");

    const sourceFiles = createResearchSourceFiles();
    const qdpxBlob = await pack(qdeJson.qde, sourceFiles);

    assertExists(qdpxBlob, "Pack should return a Blob");
    assert(qdpxBlob instanceof Blob, "Result should be a Blob");
    assert(qdpxBlob.size > 0, "QDPX file should have content");
  });

  await t.step("should unpack existing QDPX file", async () => {
    const qdpxBlob = await Deno.readFile(EXAMPLE_QDPX_FILE).then((data) => new Blob([data]));
    const [unpackOk, unpacker] = await unpack(qdpxBlob);

    assert(unpackOk, "Unpack should succeed");
    assertExists((unpacker as any).entries, "Should have entries");
    assert((unpacker as any).entries.length > 0, "Should contain files");

    // Should contain project.qde
    const hasProjectQde = (unpacker as any).entries.some((entry: any) => entry.filename === "project.qde");
    assert(hasProjectQde, "Should contain project.qde file");

    await (unpacker as any).close();
  });

  await t.step("should maintain data integrity in pack/unpack cycle", async () => {
    const originalQdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(originalQdeXml);
    assert(parseOk, "Should parse original QDE XML");

    const sourceFiles = createResearchSourceFiles();

    // Pack
    const qdpxBlob = await pack(qdeJson.qde, sourceFiles);

    // Unpack
    const [unpackOk, unpacker] = await unpack(qdpxBlob);
    assert(unpackOk, "Unpack should succeed");

    // Verify project content semantically
    const extractedQde = await (unpacker as any).readProjectQde();
    await assertQdeSemanticEquality(
      originalQdeXml,
      extractedQde,
      "QDE content should be semantically equivalent",
    );

    // Verify file count
    const expectedFileCount = sourceFiles.length + 1; // +1 for project.qde
    assertEquals((unpacker as any).entries.length, expectedFileCount, "Should contain all files");

    await (unpacker as any).close();
  });

  await t.step("should handle different source file types", async () => {
    const qdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(qdeXml);
    assert(parseOk, "Should parse QDE XML");

    // Test various file types QDA researchers use
    const diverseFiles: SourceFile[] = [
      { path: "interview.txt", content: "Interview transcript", mimeType: "text/plain" },
      { path: "consent.pdf", content: new ArrayBuffer(300), mimeType: "application/pdf" },
      { path: "site.png", content: new ArrayBuffer(250), mimeType: "image/png" },
      { path: "recording.m4a", content: new ArrayBuffer(500), mimeType: "audio/mp4" },
    ];

    const qdpxBlob = await pack(qdeJson.qde, diverseFiles);
    const [unpackOk, unpacker] = await unpack(qdpxBlob);

    assert(unpackOk, "Should handle diverse file types");
    assertEquals((unpacker as any).entries.length, diverseFiles.length + 1, "Should contain all files");

    await (unpacker as any).close();
  });

  await t.step("should handle empty QDPX (project only)", async () => {
    const qdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(qdeXml);
    assert(parseOk, "Should parse QDE XML");

    // Pack with no source files
    const qdpxBlob = await pack(qdeJson.qde, []);
    const [unpackOk, unpacker] = await unpack(qdpxBlob);

    assert(unpackOk, "Should handle project-only QDPX");
    assertEquals((unpacker as any).entries.length, 1, "Should contain only project.qde");
    assertEquals((unpacker as any).entries[0].filename, "project.qde", "Should be project.qde");

    await (unpacker as any).close();
  });
});

Deno.test("QDPX Error Handling Tests", async (t) => {
  await t.step("should reject invalid QDE JSON structure", async () => {
    const invalidQdeJson = { invalid: "structure" };
    const sourceFiles = createResearchSourceFiles().slice(0, 1);

    await assertRejects(
      () => pack(invalidQdeJson, sourceFiles),
      Error,
      "Invalid project.qde",
      "Should reject malformed QDE JSON",
    );
  });

  await t.step("should handle corrupted QDPX gracefully", async () => {
    const corruptedBlob = new Blob(["not a zip file"], { type: "application/zip" });

    const [unpackOk, error] = await unpack(corruptedBlob);
    assert(!unpackOk, "Should fail on corrupted QDPX");
    assertExists(error, "Should provide error information");
    assert(error instanceof Error, "Should return proper Error object");
  });

  await t.step("should validate source files against REFI-QDA standards", async () => {
    const qdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(qdeXml);
    assert(parseOk, "Should parse QDE XML");

    // File with wrong extension for MIME type
    const invalidFiles: SourceFile[] = [
      {
        path: "test.txt",
        content: new ArrayBuffer(50),
        mimeType: "image/png", // PNG data with .txt extension
      },
    ];

    await assertRejects(
      () => pack(qdeJson.qde, invalidFiles, { validateSources: true }),
      Error,
      "Invalid source file",
      "Should reject files violating REFI-QDA standards",
    );
  });

  await t.step("should reject source files with nested paths (QDPX spec violation)", async () => {
    const qdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(qdeXml);
    assert(parseOk, "Should parse QDE XML");

    // File with nested path violating QDPX flat structure requirement
    const nestedPathFiles: SourceFile[] = [
      {
        path: "interviews/participant.txt",
        content: "Interview content",
        mimeType: "text/plain",
      },
    ];

    await assertRejects(
      () => pack(qdeJson.qde, nestedPathFiles, { validateSources: true }),
      Error,
      "flat",
      "Should reject files with nested paths",
    );
  });
});

Deno.test("QDPX Real-world Usage Tests", async (t) => {
  await t.step("should support typical qualitative research project structure", async () => {
    const qdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(qdeXml);
    assert(parseOk, "Should parse QDE XML");

    // Realistic QDA project structure
    const researchProject: SourceFile[] = [
      // Interview data
      { path: "p001.txt", content: "Participant 001 interview transcript..." },
      { path: "p002.txt", content: "Participant 002 interview transcript..." },

      // Observational data
      { path: "site1.txt", content: "Field observation notes from site 1..." },

      // Supporting materials
      { path: "consent_forms.pdf", content: new ArrayBuffer(400), mimeType: "application/pdf" },
      { path: "focus_group.m4a", content: new ArrayBuffer(1500), mimeType: "audio/mp4" },
      { path: "facility_photo.jpg", content: new ArrayBuffer(300), mimeType: "image/jpeg" },
    ];

    const qdpxBlob = await pack(qdeJson.qde, researchProject);
    const [unpackOk, unpacker] = await unpack(qdpxBlob);

    assert(unpackOk, "Should handle realistic research project");
    assertEquals((unpacker as any).entries.length, researchProject.length + 1, "Should contain all research files");

    // Verify project QDE is accessible
    const projectQde = await (unpacker as any).readProjectQde();
    assertExists(projectQde, "Should be able to read project data");

    await (unpacker as any).close();
  });

  await t.step("should work with minimal QDE project", async () => {
    // Create minimal valid QDE for testing edge cases
    const minimalQdeXml = `<?xml version="1.0" encoding="utf-8"?>
<Project name="Test Project" xmlns="urn:QDA-XML:project:1.0">
  <Users>
    <User name="Test User" guid="12345678-1234-1234-1234-123456789012"/>
  </Users>
  <CodeBook>
    <Codes>
      <Code name="Test Code" guid="87654321-4321-4321-4321-210987654321" isCodable="true"/>
    </Codes>
  </CodeBook>
</Project>`;

    const [parseOk, qdeJson] = qde.toJson(minimalQdeXml);
    assert(parseOk, "Should parse minimal QDE XML");

    const sourceFiles: SourceFile[] = [
      { path: "sample.txt", content: "Minimal test data" },
    ];

    const qdpxBlob = await pack(qdeJson.qde, sourceFiles);
    const [unpackOk, unpacker] = await unpack(qdpxBlob);

    assert(unpackOk, "Should work with minimal QDE");

    const extractedQde = await (unpacker as any).readProjectQde();
    await assertQdeSemanticEquality(
      minimalQdeXml,
      extractedQde,
      "Minimal project should be preserved",
    );

    await (unpacker as any).close();
  });
});
