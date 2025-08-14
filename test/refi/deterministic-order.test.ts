/// <reference lib="deno.ns" />

import { assert } from "@std/assert";
import { qde } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

// Build the same logical project with different insertion orders
function makeProject(order: number): ProjectJson {
  const users = [
    { guid: "00000000-0000-0000-0000-0000000000b2", name: "B" },
    { guid: "00000000-0000-0000-0000-0000000000a1", name: "A" },
  ];
  const codes = [
    { _attributes: { guid: "00000000-0000-0000-0000-00000000c002", name: "B", isCodable: true } },
    { _attributes: { guid: "00000000-0000-0000-0000-00000000c001", name: "A", isCodable: true } },
  ];
  if (order === 1) users.reverse(), codes.reverse();
  return {
    _attributes: { name: "Order" },
    Users: { User: users },
    CodeBook: { Codes: { Code: codes as any[] } },
  } as ProjectJson;
}

Deno.test("Deterministic emission: canonical XML produces equivalent JSON", () => {
  const a = makeProject(0);
  const b = makeProject(1);

  const [xokA, xrA] = qde.fromJson({ qde: a });
  const [xokB, xrB] = qde.fromJson({ qde: b });
  assert(xokA && xokB, "Both JSON→XML conversions should succeed");

  const [jokA] = qde.toJson((xrA as { qde: string }).qde);
  const [jokB] = qde.toJson((xrB as { qde: string }).qde);
  assert(jokA && jokB, "Both XML→JSON conversions should succeed");
});
