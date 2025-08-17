/// <reference lib="deno.ns" />

import { assert, assertEquals } from "@std/assert";
import { qde } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

Deno.test("VariableValue choice: each type and invalid multi-choice", () => {
  const base: ProjectJson = {
    _attributes: { name: "Vars" },
    Variables: {
      Variable: [
        { guid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "v-text", typeOfVariable: "Text" },
        { guid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "v-bool", typeOfVariable: "Boolean" },
        { guid: "cccccccc-cccc-cccc-cccc-cccccccccccc", name: "v-int", typeOfVariable: "Integer" },
        { guid: "dddddddd-dddd-dddd-dddd-dddddddddddd", name: "v-float", typeOfVariable: "Float" },
        { guid: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", name: "v-date", typeOfVariable: "Date" },
        { guid: "ffffffff-ffff-ffff-ffff-ffffffffffff", name: "v-datetime", typeOfVariable: "DateTime" },
      ],
    },
    Sources: {
      TextSource: [
        {
          guid: "11111111-1111-1111-1111-111111111111",
          name: "src",
          plainTextPath: "src.txt",
          VariableValue: [
            { VariableRef: { targetGUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }, TextValue: "hello" },
            { VariableRef: { targetGUID: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" }, BooleanValue: true },
            { VariableRef: { targetGUID: "cccccccc-cccc-cccc-cccc-cccccccccccc" }, IntegerValue: 42 },
            { VariableRef: { targetGUID: "dddddddd-dddd-dddd-dddd-dddddddddddd" }, FloatValue: 3.14 },
            { VariableRef: { targetGUID: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee" }, DateValue: "2024-01-05" },
            {
              VariableRef: { targetGUID: "ffffffff-ffff-ffff-ffff-ffffffffffff" },
              DateTimeValue: "2024-01-05T15:04:05Z",
            },
          ],
        },
      ],
    },
  } as ProjectJson;

  const [valid, vres] = qde.validate(base);
  assert(valid, `Valid variable value variants should pass: ${(vres as Error)?.message}`);
  const [xok, xres] = qde.fromJson({ qde: base });
  assert(xok, "JSON to XML should succeed");
  const [jok, jres] = qde.toJson((xres as { qde: string }).qde);
  assert(jok, "XML to JSON should succeed");
  assertEquals(((jres as { qde: ProjectJson }).qde.Variables?.Variable?.length) ?? 0, 6);

  // invalid: two values in one VariableValue (choice violation)
  const bad: ProjectJson = {
    _attributes: { name: "BadVars" },
    Sources: {
      TextSource: [
        {
          guid: "00000000-0000-0000-0000-000000000201",
          name: "src",
          VariableValue: [
            {
              VariableRef: { targetGUID: "00000000-0000-0000-0000-000000000001" },
              TextValue: "a",
              // @ts-ignore: Construct invalid case intentionally
              BooleanValue: true,
            } as unknown as any,
          ],
        },
      ],
    },
  } as unknown as ProjectJson;

  const [validBad] = qde.validate(bad);
  assert(!validBad, "VariableValue with multiple values should fail validation");
});
