/// <reference lib="deno.ns" />

import { assert, assertEquals } from "@std/assert";
import { qde, refi } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

Deno.test("REFI minimal project: JSON <-> XML <-> JSON and class round-trip", async () => {
  const minimal: ProjectJson = {
    _attributes: { name: "Minimal" },
  } as ProjectJson;

  const [valid, vres] = qde.validate(minimal);
  assert(valid, `Minimal project should validate: ${String((vres as Error)?.message)}`);

  const [xmlOk, xres] = qde.fromJson({ qde: minimal });
  assert(xmlOk, "JSON to XML should succeed");

  const [jsonOk, jres] = qde.toJson((xres as { qde: string }).qde);
  assert(jsonOk, "XML to JSON should succeed");

  // Minimal semantics preserved
  assertEquals((jres as { qde: ProjectJson }).qde._attributes.name, "Minimal");

  // Class round-trip
  const project = (refi as any).Project.fromJson(minimal);
  const classJson: ProjectJson = project.toJson();
  const [xmlOk2, xres2] = qde.fromJson({ qde: classJson });
  assert(xmlOk2, "Class JSON to XML should succeed");
  const [jsonOk2, jres2] = qde.toJson((xres2 as { qde: string }).qde);
  assert(jsonOk2, "Class XML to JSON should succeed");
  // Compare only project name to avoid optional origin/namespace differences
  assertEquals((jres2 as { qde: ProjectJson }).qde._attributes.name, "Minimal");
});
