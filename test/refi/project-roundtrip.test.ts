/// <reference lib="deno.ns" />

import { assert, assertEquals, assertExists } from "@std/assert";
import { qde, refi } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

const QDE_FILE = "./docs/example.qde";

Deno.test("REFI Project class round-trip JSON <-> class <-> JSON", async (t) => {
  await t.step("should construct REFI.Project from QDE JSON", async () => {
    const qdeXml = await Deno.readTextFile(QDE_FILE);
    const [ok, result] = qde.toJson(qdeXml);
    assert(ok, `XML to JSON failed: ${result}`);
    assertExists(result.qde, "Expected parsed QDE JSON");

    const project = (refi as any).Project.fromJson((result as { qde: ProjectJson }).qde as ProjectJson);
    assertExists(project, "Expected REFI.Project instance");
    assert(typeof project.toJson === "function", "REFI.Project should expose toJson()");
  });

  await t.step("should preserve semantics through JSON -> REFI.Project -> JSON", async () => {
    const qdeXml = await Deno.readTextFile(QDE_FILE);
    const [ok, result] = qde.toJson(qdeXml);
    assert(ok, "XML to JSON should succeed");

    const initialProjectJson = (result as { qde: ProjectJson }).qde as ProjectJson;

    const project = (refi as any).Project.fromJson(initialProjectJson);
    const classJson: ProjectJson = project.toJson();

    // Compare semantics by converting both JSONs to XML and back to JSON
    const [xmlOkA, xmlA] = qde.fromJson({ qde: initialProjectJson });
    const [xmlOkB, xmlB] = qde.fromJson({ qde: classJson });
    assert(xmlOkA && xmlOkB, "Both JSON conversions to XML should succeed");

    const [jsonOkA, jsonA] = qde.toJson((xmlA as { qde: string }).qde);
    const [jsonOkB, jsonB] = qde.toJson((xmlB as { qde: string }).qde);
    assert(jsonOkA && jsonOkB, "Both XML conversions back to JSON should succeed");

    const DROP_KEYS = new Set([
      "PlainTextSelection",
      "PictureSelection",
      "PDFSelection",
      "AudioSelection",
      "VideoSelection",
      "TranscriptSelection",
      "Transcript",
      "Coding",
      // XML namespace noise present in xml-originated JSON only
      "xmlns",
      "xmlns:xsi",
      "xsi:schemaLocation",
    ]);

    const canonicalizeDate = (v: unknown): unknown => {
      if (typeof v === "string") {
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
      return v;
    };

    const prune = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        const arr = value
          .map(prune)
          .filter((v) => v !== undefined) as unknown[];
        return arr.length > 0 ? arr : undefined;
      }
      if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          if (DROP_KEYS.has(k)) continue;
          const next = prune(k === "creationDateTime" || k === "modifiedDateTime" ? canonicalizeDate(v) : v);
          if (next === undefined || next === "") continue;
          out[k] = next;
        }
        return Object.keys(out).length > 0 ? out : undefined;
      }
      if (value === "") return undefined;
      return value;
    };

    const norm = (p: ProjectJson) =>
      JSON.stringify(prune({
        _attributes: p._attributes,
        Users: p.Users,
        CodeBook: { Codes: p.CodeBook?.Codes },
        Variables: p.Variables,
        Sources: p.Sources,
        Sets: p.Sets,
      }));

    assertEquals(
      norm((jsonA as { qde: ProjectJson }).qde as ProjectJson),
      norm((jsonB as { qde: ProjectJson }).qde as ProjectJson),
      "Semantics should be preserved through REFI class round-trip (core comparable fields)",
    );
  });
});
