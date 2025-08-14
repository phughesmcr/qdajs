/// <reference lib="deno.ns" />

import { assert } from "@std/assert";
import { qde } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

Deno.test("Graphs and Links round-trip", () => {
  const proj: ProjectJson = {
    _attributes: { name: "GraphLinks" },
    Graphs: {
      Graph: [
        {
          guid: "11111111-1111-1111-1111-111111111111",
          name: "G",
          Vertex: [
            { guid: "22222222-2222-2222-2222-222222222222", name: "A", firstX: 1, firstY: 1 },
            { guid: "33333333-3333-3333-3333-333333333333", name: "B", firstX: 2, firstY: 2 },
          ],
          Edge: [
            {
              guid: "44444444-4444-4444-4444-444444444444",
              sourceVertex: "22222222-2222-2222-2222-222222222222",
              targetVertex: "33333333-3333-3333-3333-333333333333",
            },
          ],
        } as unknown as any,
      ] as unknown as any,
    },
    Links: {
      Link: [
        {
          guid: "55555555-5555-5555-5555-555555555555",
          name: "L1",
          originGUID: "22222222-2222-2222-2222-222222222222",
          targetGUID: "33333333-3333-3333-3333-333333333333",
        } as unknown as any,
      ] as unknown as any,
    },
  } as ProjectJson;

  const [xok, xres] = qde.fromJson({ qde: proj });
  assert(xok, "JSON to XML should succeed");
  const [jok] = qde.toJson((xres as { qde: string }).qde);
  assert(jok, "XML to JSON should succeed");
});
