/// <reference lib="deno.ns" />

import { assert } from "@std/assert";
import { qde, qdpx } from "../../mod.ts";

Deno.test("Invalid inputs: bad GUID and non-ISO datetime should fail validation", async () => {
  const badGuid = {
    _attributes: { name: "Bad", creatingUserGUID: "not-a-guid" },
  };
  const [valid] = qde.validate(badGuid);
  assert(!valid, "Bad GUID must fail validation");

  const badDate = {
    _attributes: { name: "Bad", creationDateTime: "yesterday" },
  };
  const [valid2] = qde.validate(badDate);
  assert(!valid2, "Non-ISO datetime must fail validation");
});

Deno.test("QDPX path rules: nested path should be rejected", async () => {
  const proj = { _attributes: { name: "Paths" } };
  let failed = false;
  try {
    await qdpx.pack(proj, [
      { path: "nested/file.txt", content: "x", mimeType: "text/plain" },
    ]);
  } catch {
    failed = true;
  }
  assert(failed, "Nested source path should be rejected by pack()");
});
