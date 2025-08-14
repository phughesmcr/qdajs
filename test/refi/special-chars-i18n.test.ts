/// <reference lib="deno.ns" />

import { assert, assertEquals } from "@std/assert";
import { qde } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

Deno.test("Special characters and i18n preserved through round-trip", () => {
  const text = `Ampersand & less < greater > quotes " ' emoji 😀 العربية עברית`;
  const proj: ProjectJson = {
    _attributes: { name: "I18N" },
    CodeBook: {
      Codes: {
        Code: [
          {
            _attributes: { guid: "00000000-0000-0000-0000-00000000c001", name: "c", isCodable: true },
            Description: text,
          },
        ],
      },
    },
    Notes: undefined as unknown as any,
  } as ProjectJson;

  const [xok, xres] = qde.fromJson({ qde: proj });
  assert(xok, "JSON to XML should succeed");
  const [jok, jres] = qde.toJson((xres as { qde: string }).qde);
  assert(jok, "XML to JSON should succeed");

  const round = (jres as { qde: ProjectJson }).qde;
  assertEquals(round.CodeBook?.Codes?.Code?.[0]?.Description, text);
});
