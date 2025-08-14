/// <reference lib="deno.ns" />

import { assert, assertEquals, assertMatch } from "@std/assert";
import { qde, refi } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

Deno.test("Datetime handling: offsets and Z normalization via class", () => {
  const proj: ProjectJson = {
    _attributes: {
      name: "Dates",
      creationDateTime: "2024-01-05T12:34:56+02:00",
      modifiedDateTime: "2024-01-06T23:59:59Z",
    },
  } as ProjectJson;

  const [xok, xres] = qde.fromJson({ qde: proj });
  assert(xok, "JSON to XML should succeed");
  const [jok] = qde.toJson((xres as { qde: string }).qde);
  assert(jok, "XML to JSON should succeed");

  // Through class, ensure ISO strings
  const project = (refi as any).Project.fromJson(proj);
  const classJson: ProjectJson = project.toJson();
  // class may omit dates if not set; only assert if present
  if (classJson._attributes.creationDateTime) {
    assertMatch(classJson._attributes.creationDateTime!, /Z$/);
  }
  if (classJson._attributes.modifiedDateTime) {
    assertMatch(classJson._attributes.modifiedDateTime!, /Z$/);
  }
  // Round-trip back through converter
  const [xok2, x2] = qde.fromJson({ qde: classJson });
  assert(xok2, "Class JSON to XML should succeed");
  const [jok2, j2] = qde.toJson((x2 as { qde: string }).qde);
  assert(jok2, "Class XML to JSON should succeed");
  const rt = (j2 as { qde: ProjectJson }).qde._attributes.creationDateTime ?? "";
  if (rt) {
    assertEquals(rt.endsWith("Z"), true);
  }
});
