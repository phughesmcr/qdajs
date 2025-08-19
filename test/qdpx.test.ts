/// <reference lib="deno.ns" />

import { assert, assertEquals, assertExists } from "@std/assert";
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
function createTestSourceFiles(): SourceFile[] {
  return [
    // Interview transcript (most common in QDA)
    {
      path: "participant_01.txt",
      content: "Interviewer: Tell me about your experience with accessibility.\nParticipant: I think it means...",
      mimeType: "text/plain",
    },
    // Field notes
    {
      path: "observation_notes.txt",
      content: "Session 1 observations: Key barriers identified include physical access issues.",
    },
    // Supporting document
    {
      path: "consent_form.pdf",
      content: new ArrayBuffer(300), // Mock PDF data
      mimeType: "application/pdf",
    },
    // Research photo
    {
      path: "site_entrance.jpg",
      content: new ArrayBuffer(250), // Mock JPEG data
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

Deno.test("QDPX Pack and Unpack Functionality", async (t) => {
  await t.step("should pack QDE JSON with source files into QDPX blob", async () => {
    const qdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(qdeXml);
    assert(parseOk, "Should parse QDE XML to JSON");

    const sourceFiles = createTestSourceFiles();
    const [packOk, qdpxBlob] = await pack(qdeJson.qde, sourceFiles);

    assert(packOk, "Pack should succeed");
    assert(qdpxBlob instanceof Blob, "Result should be a Blob");
    assert(qdpxBlob.size > 0, "QDPX file should have content");
    console.log(`✓ Packed QDPX size: ${qdpxBlob.size} bytes`);
  });

  await t.step("should unpack existing QDPX file successfully", async () => {
    const qdpxBlob = await Deno.readFile(EXAMPLE_QDPX_FILE).then((data) => new Blob([data]));
    const [unpackOk, unpacker] = await unpack(qdpxBlob);

    assert(unpackOk, `Unpack should succeed: ${unpacker}`);
    assertExists((unpacker as any).entries, "Should have entries");
    assert((unpacker as any).entries.length > 0, "Should contain files");

    // Should contain project.qde
    const hasProjectQde = (unpacker as any).entries.some((entry: any) => entry.filename === "project.qde");
    assert(hasProjectQde, "Should contain project.qde file");

    console.log(`✓ Unpacked QDPX with ${(unpacker as any).entries.length} entries`);
    await (unpacker as any).close();
  });

  await t.step("should read project QDE from unpacked QDPX", async () => {
    const qdpxBlob = await Deno.readFile(EXAMPLE_QDPX_FILE).then((data) => new Blob([data]));
    const [unpackOk, unpacker] = await unpack(qdpxBlob);
    assert(unpackOk, "Unpack should succeed");

    const projectQde = await (unpacker as any).readProjectQde();
    assertExists(projectQde, "Should be able to read project QDE");
    assert(projectQde.includes("<?xml"), "QDE should be valid XML");
    assert(projectQde.includes("<Project"), "QDE should contain Project element");

    console.log(`✓ Retrieved project QDE (${projectQde.length} chars)`);
    await (unpacker as any).close();
  });

  await t.step("should maintain QDE data integrity through pack/unpack cycle", async () => {
    const originalQdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(originalQdeXml);
    assert(parseOk, "Should parse original QDE XML");

    const sourceFiles = createTestSourceFiles();

    // Pack the QDE JSON and source files
    const [packOk, qdpxBlob] = await pack(qdeJson.qde, sourceFiles);
    assert(packOk, "Should pack QDE with source files");

    // Unpack and verify content
    const [unpackOk, unpacker] = await unpack(qdpxBlob as Blob);
    assert(unpackOk, "Unpack should succeed");

    // Verify project content semantically (avoids formatting differences)
    const extractedQde = await (unpacker as any).readProjectQde();
    await assertQdeSemanticEquality(
      originalQdeXml,
      extractedQde,
      "QDE content should be semantically preserved",
    );

    // Verify file count
    const expectedFileCount = sourceFiles.length + 1; // +1 for project.qde
    assertEquals((unpacker as any).entries.length, expectedFileCount, "Should contain all files");

    console.log(`✓ Round-trip integrity verified: ${expectedFileCount} files preserved`);
    await (unpacker as any).close();
  });

  await t.step("should handle different source file types used in QDA research", async () => {
    const qdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(qdeXml);
    assert(parseOk, "Should parse QDE XML");

    // Test file types commonly used in qualitative research
    const researchFiles: SourceFile[] = [
      // Text data (transcripts, notes)
      { path: "interview_01.txt", content: "Interview transcript content", mimeType: "text/plain" },
      { path: "fieldwork.txt", content: "Field observation notes" },

      // Documents
      { path: "consent.pdf", content: new ArrayBuffer(400), mimeType: "application/pdf" },
      {
        path: "survey.docx",
        content: new ArrayBuffer(350),
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },

      // Media files
      { path: "site_photo.png", content: new ArrayBuffer(300), mimeType: "image/png" },
      { path: "diagram.jpg", content: new ArrayBuffer(280), mimeType: "image/jpeg" },
      { path: "interview_recording.m4a", content: new ArrayBuffer(800), mimeType: "audio/mp4" },
      { path: "focus_group.mp4", content: new ArrayBuffer(1200), mimeType: "video/mp4" },
    ];

    const [packOk, qdpxBlob] = await pack(qdeJson.qde, researchFiles);
    assert(packOk, "Should pack QDE with research files");
    const [unpackOk, unpacker] = await unpack(qdpxBlob as Blob);

    assert(unpackOk, "Should handle diverse research file types");
    assertEquals((unpacker as any).entries.length, researchFiles.length + 1, "Should contain all research files");

    console.log(`✓ Handled ${researchFiles.length} different file types`);
    await (unpacker as any).close();
  });

  await t.step("should create QDPX with project only (no source files)", async () => {
    const qdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(qdeXml);
    assert(parseOk, "Should parse QDE XML");

    // Pack with no source files (common for sharing just the coding scheme)
    const [packOk, qdpxBlob] = await pack(qdeJson.qde, []);
    assert(packOk, "Should pack QDE with no source files");
    const [unpackOk, unpacker] = await unpack(qdpxBlob as Blob);

    assert(unpackOk, "Should handle project-only QDPX");
    assertEquals((unpacker as any).entries.length, 1, "Should contain only project.qde");
    assertEquals((unpacker as any).entries[0].filename, "project.qde", "Should be project.qde");

    // Verify project content is accessible
    const extractedQde = await (unpacker as any).readProjectQde();
    assertExists(extractedQde, "Should be able to read project data");

    console.log("✓ Project-only QDPX created and verified");
    await (unpacker as any).close();
  });
});

Deno.test("QDPX Real-world Usage Scenarios", async (t) => {
  await t.step("should support realistic qualitative research project structure", async () => {
    const qdeXml = await Deno.readTextFile(EXAMPLE_QDE_FILE);
    const [parseOk, qdeJson] = qde.toJson(qdeXml);
    assert(parseOk, "Should parse QDE XML");

    // Realistic QDA project structure
    const researchProject: SourceFile[] = [
      // Interview data
      { path: "participant_001.txt", content: "P001: I think accessibility means..." },
      { path: "participant_002.txt", content: "P002: From my experience..." },
      { path: "participant_003.txt", content: "P003: The main barriers are..." },

      // Observational data
      { path: "site1_observations.txt", content: "Site 1 field notes: Physical barriers observed..." },
      { path: "site2_observations.txt", content: "Site 2 field notes: Policy barriers noted..." },

      // Supporting materials
      { path: "consent_forms.pdf", content: new ArrayBuffer(500), mimeType: "application/pdf" },
      {
        path: "interview_guide.docx",
        content: new ArrayBuffer(300),
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },

      // Media
      { path: "focus_group_session1.m4a", content: new ArrayBuffer(2000), mimeType: "audio/mp4" },
      { path: "facility_entrance.jpg", content: new ArrayBuffer(400), mimeType: "image/jpeg" },
      { path: "accessibility_features.png", content: new ArrayBuffer(350), mimeType: "image/png" },
    ];

    const [packOk, qdpxBlob] = await pack(qdeJson.qde, researchProject);
    assert(packOk, "Should pack QDE with research project");
    const [unpackOk, unpacker] = await unpack(qdpxBlob as Blob);

    assert(unpackOk, "Should handle realistic research project structure");
    assertEquals((unpacker as any).entries.length, researchProject.length + 1, "Should contain all project files");

    // Verify project QDE is accessible
    const projectQde = await (unpacker as any).readProjectQde();
    assertExists(projectQde, "Should access project metadata and coding scheme");
    assert(projectQde.includes("Disability Data"), "Should contain project details");

    console.log(`✓ Realistic research project: ${researchProject.length} files + project data`);
    await (unpacker as any).close();
  });

  await t.step("should work with minimal QDE project for testing", async () => {
    // Create minimal valid QDE structure
    const minimalQdeXml = `<?xml version="1.0" encoding="utf-8"?>
<Project name="Test Project" xmlns="urn:QDA-XML:project:1.0">
  <Users>
    <User name="Test Researcher" guid="12345678-1234-1234-1234-123456789012"/>
  </Users>
  <CodeBook>
    <Codes>
      <Code name="Test Theme" guid="87654321-4321-4321-4321-210987654321" isCodable="true"/>
    </Codes>
  </CodeBook>
</Project>`;

    const [parseOk, qdeJson] = qde.toJson(minimalQdeXml);
    assert(parseOk, "Should parse minimal QDE XML");

    const testFiles: SourceFile[] = [
      { path: "sample_transcript.txt", content: "This is test interview data for QDA analysis." },
    ];

    const [packOk, qdpxBlob] = await pack(qdeJson.qde, testFiles);
    assert(packOk, "Should pack QDE with test files");

    const [unpackOk, unpacker] = await unpack(qdpxBlob);

    assert(unpackOk, "Should work with minimal QDE structure");

    const extractedQde = await (unpacker as any).readProjectQde();
    await assertQdeSemanticEquality(
      minimalQdeXml,
      extractedQde,
      "Minimal project structure should be preserved",
    );

    console.log("✓ Minimal QDE project structure verified");
    await (unpacker as any).close();
  });
});
