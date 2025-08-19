/// <reference lib="deno.ns" />

import { assert } from "@std/assert";
import { qde } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

Deno.test("Sets membership variants round-trip", () => {
  const proj: ProjectJson = {
    _attributes: { name: "Sets" },
    Sets: {
      Set: [
        { _attributes: { guid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Empty" } } as unknown as any,
        {
          _attributes: { guid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "Codes" },
          MemberCode: [{ targetGUID: "cccccccc-cccc-cccc-cccc-cccccccccccc" }],
        } as unknown as any,
        {
          _attributes: { guid: "dddddddd-dddd-dddd-dddd-dddddddddddd", name: "Sources" },
          MemberSource: [{ targetGUID: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee" }],
        } as unknown as any,
        {
          _attributes: { guid: "ffffffff-ffff-ffff-ffff-ffffffffffff", name: "Notes" },
          MemberNote: [{ targetGUID: "11111111-1111-1111-1111-111111111111" }],
        } as unknown as ProjectJson["Sets"],
      ] as unknown as any[],
    },
  } as ProjectJson;

  const [xok, xres] = qde.fromJson({ qde: proj });
  assert(xok, "JSON to XML should succeed");
  const [jok] = qde.toJson((xres as { qde: string }).qde);
  assert(jok, "XML to JSON should succeed");
});
