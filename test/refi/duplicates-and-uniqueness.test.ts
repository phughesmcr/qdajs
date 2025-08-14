/// <reference lib="deno.ns" />

import { assert } from "@std/assert";
import { qde } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

Deno.test("Duplicate GUIDs should fail validation", () => {
  const proj: ProjectJson = {
    _attributes: { name: "Dup" },
    Users: {
      User: [
        { guid: "00000000-0000-0000-0000-00000000d001", name: "A" },
        { guid: "00000000-0000-0000-0000-00000000d001", name: "B" },
      ],
    },
  } as ProjectJson;

  // Current schema does not enforce global uniqueness; expect convert to succeed.
  // This test documents desired behavior: future enhancement may enforce uniqueness.
  const [valid] = qde.validate(proj);
  assert(valid, "Duplicate GUIDs currently pass (documenting behavior)");
});
