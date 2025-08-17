/// <reference lib="deno.ns" />

import { assert, assertThrows } from "@std/assert";
import { qde, refi } from "../../mod.ts";
import type { ProjectJson } from "../../src/qde/types.ts";

Deno.test("Schema XOR: TextSource must have exactly one of PlainTextContent or plainTextPath", () => {
  // both present -> invalid
  const both: ProjectJson = {
    _attributes: { name: "XOR Text both" },
    Sources: {
      TextSource: [
        {
          guid: "00000000-0000-0000-0000-0000000000a1",
          name: "t",
          PlainTextContent: "content",
          plainTextPath: "file.txt",
        },
      ],
    },
  } as unknown as ProjectJson;
  const [validBoth] = qde.validate(both);
  assert(!validBoth, "Validation should fail when both are present");

  // neither present -> invalid
  const neither: ProjectJson = {
    _attributes: { name: "XOR Text neither" },
    Sources: {
      TextSource: [
        {
          guid: "00000000-0000-0000-0000-0000000000a2",
          name: "t",
        },
      ],
    },
  } as unknown as ProjectJson;
  const [validNeither] = qde.validate(neither);
  assert(!validNeither, "Validation should fail when neither is present");
});

Deno.test("Schema XOR: Transcript must have exactly one of PlainTextContent or plainTextPath", () => {
  // Place Transcript inside an AudioSource (as per schema)
  const both: ProjectJson = {
    _attributes: { name: "XOR Transcript both" },
    Sources: {
      AudioSource: [
        {
          guid: "00000000-0000-0000-0000-0000000000b1",
          name: "a",
          Transcript: [
            {
              guid: "00000000-0000-0000-0000-0000000000b2",
              name: "tr",
              PlainTextContent: "content",
              plainTextPath: "tr.txt",
            },
          ],
        },
      ],
    },
  } as unknown as ProjectJson;
  const [validBoth] = qde.validate(both);
  assert(!validBoth, "Validation should fail when both transcript fields are present");
});

Deno.test("Constructor XOR: TextSource and Transcript constructors assert exactly-one", () => {
  const TextSource = (refi as any).TextSource as typeof import("../../src/class/source/text-source.ts").TextSource;
  const Transcript = (refi as any).Transcript as typeof import("../../src/class/source/transcript.ts").Transcript;
  // TextSource constructor with both present should throw
  assertThrows(() =>
    new TextSource({
      guid: "00000000-0000-0000-0000-0000000000c1",
      name: "t",
      plainTextPath: "a.txt",
      plainTextContent: "content",
    } as any)
  );
  // Transcript constructor with neither present should throw
  assertThrows(() =>
    new Transcript({
      guid: "00000000-0000-0000-0000-0000000000c2",
      name: "tr",
      noteRefs: new Set(),
      syncPoints: new Set(),
      selections: new Set(),
    } as any)
  );
});

Deno.test("Runtime RGB validator: invalid color rejected by toJson()", () => {
  const Code = (refi as any).Code as typeof import("../../src/class/codebook/code.ts").Code;
  const bad = new Code({
    guid: "00000000-0000-0000-0000-0000000000d1",
    name: "c",
    isCodable: true,
    color: "#GGGGGG" as any,
  });
  assertThrows(() => bad.toJson(), "Invalid RGB color should throw");
});

Deno.test("Runtime date/datetime validators: invalid values rejected by VariableValue.toJson()", () => {
  const TextSource = (refi as any).TextSource as typeof import("../../src/class/source/text-source.ts").TextSource;
  const Ref = (refi as any).Ref as typeof import("../../src/class/ref/ref.ts").Ref;
  const VariableValue = (refi as any)
    .VariableValue as typeof import("../../src/class/case/variableValue.ts").VariableValue;

  const invalidDate = new VariableValue({
    variableRef: new Ref({ targetGUID: "00000000-0000-0000-0000-0000000000e1" }),
    type: "Date",
    value: "2024-13-01", // invalid month
  } as any);

  const invalidDateTime = new VariableValue({
    variableRef: new Ref({ targetGUID: "00000000-0000-0000-0000-0000000000e2" }),
    type: "DateTime",
    value: "not-iso",
  } as any);

  // Attach to a minimal TextSource (use path to satisfy XOR)
  const ts = new TextSource({
    guid: "00000000-0000-0000-0000-0000000000e3",
    name: "ts",
    plainTextPath: "t.txt",
    variableValues: new Set([invalidDate, invalidDateTime]),
  } as any);

  assertThrows(() => ts.toJson(), "Invalid ISO date/datetime should throw");
});
