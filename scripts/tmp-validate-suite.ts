import { qde } from "../mod.ts";
import type { ProjectJson } from "../src/qde/types.ts";

function log(title: string, ok: boolean) {
  console.log(title, ok);
}

// graphs and links
const graphs: ProjectJson = {
  _attributes: { name: "GraphLinks" },
  Graphs: {
    Graph: [
      {
        guid: "00000000-0000-0000-0000-00000000g001",
        name: "G",
        Vertex: [
          { guid: "00000000-0000-0000-0000-00000000v001", name: "A", firstX: 1, firstY: 1 },
          { guid: "00000000-0000-0000-0000-00000000v002", name: "B", firstX: 2, firstY: 2 },
        ],
        Edge: [
          {
            guid: "00000000-0000-0000-0000-00000000e001",
            sourceVertex: "00000000-0000-0000-0000-00000000v001",
            targetVertex: "00000000-0000-0000-0000-00000000v002",
          },
        ],
      },
    ],
  },
  Links: {
    Link: [
      {
        guid: "00000000-0000-0000-0000-00000000l001",
        name: "L1",
        originGUID: "00000000-0000-0000-0000-00000000v001",
        targetGUID: "00000000-0000-0000-0000-00000000v002",
      },
    ],
  },
} as unknown as ProjectJson;

const [vG, rG] = qde.validate(graphs);
log("graphs validate", vG);
if (!vG) console.dir(rG, { depth: 6 });
const [xG, xrG] = qde.fromJson({ qde: graphs });
log("graphs fromJson", xG);
if (!xG) console.dir(xrG, { depth: 6 });

// selections
const selections: ProjectJson = {
  _attributes: { name: "Selections" },
  Sources: {
    TextSource: [
      {
        guid: "00000000-0000-0000-0000-00000000t001",
        name: "text",
        PlainTextSelection: [
          {
            guid: "00000000-0000-0000-0000-00000000p001",
            startPosition: 1,
            endPosition: 5,
            Coding: [
              {
                guid: "00000000-0000-0000-0000-00000000d001",
                CodeRef: { targetGUID: "00000000-0000-0000-0000-00000000c001" },
              },
            ],
          },
        ],
      },
    ],
  },
} as unknown as ProjectJson;
const [vS, rS] = qde.validate(selections);
log("selections validate", vS);
if (!vS) console.dir(rS, { depth: 6 });
const [xS, xrS] = qde.fromJson({ qde: selections });
log("selections fromJson", xS);
if (!xS) console.dir(xrS, { depth: 6 });

// sets
const setsProj: ProjectJson = {
  _attributes: { name: "Sets" },
  Sets: {
    Set: [
      { guid: "00000000-0000-0000-0000-00000000s001", name: "Empty" },
      {
        guid: "00000000-0000-0000-0000-00000000s002",
        name: "Codes",
        MemberCode: [{ targetGUID: "00000000-0000-0000-0000-00000000c001" }],
      },
      {
        guid: "00000000-0000-0000-0000-00000000s003",
        name: "Sources",
        MemberSource: [{ targetGUID: "00000000-0000-0000-0000-00000000x001" }],
      },
      {
        guid: "00000000-0000-0000-0000-00000000s004",
        name: "Notes",
        MemberNote: [{ targetGUID: "00000000-0000-0000-0000-00000000n001" }],
      },
    ],
  },
} as unknown as ProjectJson;
const [vT, rT] = qde.validate(setsProj);
log("sets validate", vT);
if (!vT) console.dir(rT, { depth: 6 });
const [xT, xrT] = qde.fromJson({ qde: setsProj });
log("sets fromJson", xT);
if (!xT) console.dir(xrT, { depth: 6 });

// variables choices
const vars: ProjectJson = {
  _attributes: { name: "Vars" },
  Variables: {
    Variable: [
      { guid: "00000000-0000-0000-0000-000000000001", name: "v-text", typeOfVariable: "Text" },
    ],
  },
  Sources: {
    TextSource: [
      {
        guid: "00000000-0000-0000-0000-000000000101",
        name: "src",
        VariableValue: [
          { VariableRef: { targetGUID: "00000000-0000-0000-0000-000000000001" }, TextValue: "hello" },
        ],
      },
    ],
  },
} as unknown as ProjectJson;
const [vV, rV] = qde.validate(vars);
log("vars validate", vV);
if (!vV) console.dir(rV, { depth: 6 });
const [xV, xrV] = qde.fromJson({ qde: vars });
log("vars fromJson", xV);
if (!xV) console.dir(xrV, { depth: 6 });
