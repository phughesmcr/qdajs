/// <reference lib="deno.ns" />

import { assert, assertEquals, assertExists } from "@std/assert";
import { qde, refi } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

const QDE_FILE = "./docs/example.qde";

// Canonicalize JSON by sorting object keys and treating arrays as unordered multisets.
// Also normalize well-known datetime fields to ISO strings for stable comparison.
function canonicalize(value: unknown, keyHint: string | null = null): unknown {
  // Normalize specific datetime fields to ISO
  if (typeof value === "string" && (keyHint === "creationDateTime" || keyHint === "modifiedDateTime")) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  if (Array.isArray(value)) {
    const items = value.map((v) => canonicalize(v));
    const keyed = items.map((v) => JSON.stringify(v));
    const order = [...keyed].map((s, i) => ({ s, i })).sort((a, b) => (a.s < b.s ? -1 : a.s > b.s ? 1 : 0));
    return order.map(({ i }) => items[i]);
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const entries = Object.keys(obj)
      .sort()
      .map((k) => [k, canonicalize(obj[k], k)] as const);
    const out: Record<string, unknown> = {};
    for (const [k, v] of entries) out[k] = v;
    return out;
  }

  return value;
}

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

    assertEquals(
      canonicalize((jsonA as { qde: ProjectJson }).qde as ProjectJson),
      canonicalize((jsonB as { qde: ProjectJson }).qde as ProjectJson),
      "Semantics should be preserved through REFI class round-trip (all keys, order-insensitive)",
    );
  });

  await t.step("should perform XML -> JSON -> REFI.Project -> XML pipeline with semantic equivalence", async () => {
    const qdeXml = await Deno.readTextFile(QDE_FILE);
    const [ok, result] = qde.toJson(qdeXml);
    assert(ok, "XML to JSON should succeed");

    const initialProjectJson = (result as { qde: ProjectJson }).qde as ProjectJson;

    // JSON -> REFI.Project
    const project = (refi as any).Project.fromJson(initialProjectJson);
    // REFI.Project -> JSON -> XML
    const classJson: ProjectJson = project.toJson();
    const [xmlOk, xmlRes] = qde.fromJson({ qde: classJson });
    assert(xmlOk, "Class JSON to XML should succeed");

    // Parse back to JSON for semantic comparison (order-insensitive, keep all keys)
    const [roundOk, roundRes] = qde.toJson((xmlRes as { qde: string }).qde);
    assert(roundOk, "Round-tripped XML to JSON should succeed");

    assertEquals(
      canonicalize(initialProjectJson),
      canonicalize((roundRes as { qde: ProjectJson }).qde as ProjectJson),
      "Pipeline XML -> JSON -> REFI.Project -> XML should preserve semantics (all keys, order-insensitive)",
    );
  });
});
