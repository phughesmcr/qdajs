/// <reference lib="deno.ns" />

import { assert, assertEquals, assertExists } from "@std/assert";
import { configure } from "@zip-js/zip-js";
import { qde, qdpx, refi } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

configure({ useWebWorkers: false });

const QDE_FILE = "./docs/example.qde";

Deno.test("REFI integration with qdpx pack/unpack", async (t) => {
  await t.step("should pack QDE created from REFI.Project", async () => {
    const qdeXml = await Deno.readTextFile(QDE_FILE);
    const [ok, result] = qde.toJson(qdeXml);
    assert(ok, "XML to JSON should succeed");
    const projectJson: ProjectJson = (result as { qde: ProjectJson }).qde as ProjectJson;

    // Create REFI.Project and then back to JSON
    const project = (refi as any).Project.fromJson(projectJson);
    const jsonFromClass: ProjectJson = project.toJson();

    // Ensure we can pack with qdpx using class-derived JSON
    const blob = await qdpx.pack(jsonFromClass, [
      { path: "note.txt", content: "Hello REFI", mimeType: "text/plain" },
    ]);
    assertExists(blob, "Pack should return a Blob");

    // Unpack and verify project.qde is readable
    const [unpackOk, unpacker] = await qdpx.unpack(blob);
    assert(unpackOk, "Unpack should succeed");
    const projectQde = await (unpacker as any).readProjectQde();
    assertExists(projectQde, "Should read project.qde from archive");

    // Semantic equivalence: class JSON vs unpacked project.qde -> JSON
    const [unpackedOk, unpackedJson] = qde.toJson(projectQde);
    assert(unpackedOk, "Unpacked project.qde should parse to JSON");

    const simplify = (p: ProjectJson) => ({
      _attributes: p._attributes,
      Users: p.Users,
      CodeBook: { Codes: p.CodeBook?.Codes },
      Variables: p.Variables,
      Sources: p.Sources,
      Sets: p.Sets,
    });

    // Remove all undefined-valued properties recursively so that
    // optional fields that weren't present don't affect comparison
    const stripUndefined = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map(stripUndefined);
      }
      if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          if (v !== undefined) {
            out[k] = stripUndefined(v);
          }
        }
        return out;
      }
      return value;
    };

    assertEquals(
      stripUndefined(simplify((unpackedJson as { qde: ProjectJson }).qde as ProjectJson)),
      stripUndefined(simplify(jsonFromClass)),
      "Unpacked project should match class-derived JSON in core comparable fields",
    );

    await (unpacker as any).close();
  });
});
