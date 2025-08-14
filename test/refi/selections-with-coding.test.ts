/// <reference lib="deno.ns" />

import { assert } from "@std/assert";
import { qde } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

Deno.test("Selections with coding round-trip (structure only)", () => {
  const proj: ProjectJson = {
    _attributes: { name: "Selections" },
    Sources: {
      TextSource: [
        {
          guid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          name: "text",
          PlainTextSelection: [
            {
              guid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              startPosition: 1,
              endPosition: 5,
              Coding: [
                {
                  guid: "cccccccc-cccc-cccc-cccc-cccccccccccc",
                  CodeRef: { targetGUID: "dddddddd-dddd-dddd-dddd-dddddddddddd" },
                },
              ],
            },
          ],
        } as unknown as any,
      ] as unknown as any,
    },
  } as ProjectJson;

  const [xok, xres] = qde.fromJson({ qde: proj });
  assert(xok, "JSON to XML should succeed");
  const [jok] = qde.toJson((xres as { qde: string }).qde);
  assert(jok, "XML to JSON should succeed");
});
