/// <reference lib="deno.ns" />

import { assert, assertEquals, assertExists, assertThrows } from "@std/assert";
import { refi } from "../../mod.ts";

// Access classes via public API
const {
  Ref,
  Variable,
  VariableValue,
  Code,
  Codebook,
  Coding,
  PlainTextSelection,
  PictureSelection,
  PDFSelection,
  AudioSelection,
  VideoSelection,
  TranscriptSelection,
  TextSource,
  PictureSource,
  PDFSource,
  AudioSource,
  VideoSource,
  Note,
  Vertex,
  Edge,
  Graph,
  Link,
  CodeSet,
  Case,
  User,
  Project,
  SyncPoint,
} = refi as any;

Deno.test("REFI classes: core functionality and edge cases", async (t) => {
  await t.step("Ref", () => {
    const r = new Ref({ targetGUID: "00000000-0000-0000-0000-000000000001" });
    assertEquals(r.toJson(), { targetGUID: "00000000-0000-0000-0000-000000000001" });
    const r2 = Ref.fromJson({ targetGUID: "00000000-0000-0000-0000-000000000001" });
    assertEquals(r2.targetGUID, r.targetGUID);
  });

  await t.step("Variable and VariableValue (all types)", () => {
    const variable = new Variable({
      guid: "00000000-0000-0000-0000-000000000010",
      name: "age",
      type: "Integer",
      description: "Age in years",
    });
    const vj = variable.toJson();
    assertEquals(vj.name, "age");
    assertEquals(vj.typeOfVariable, "Integer");
    assertEquals(vj.Description, "Age in years");
    const variable2 = Variable.fromJson(vj);
    assertEquals(variable2.type, "Integer");

    const mkVV = (type: string, value: unknown) =>
      new VariableValue({ variableRef: new Ref({ targetGUID: variable.guid }), type, value } as any);

    const vvText = mkVV("Text", "hello");
    assertEquals(vvText.toJson(), {
      VariableRef: { targetGUID: variable.guid },
      TextValue: "hello",
    });

    const vvBool = mkVV("Boolean", true);
    assertEquals(vvBool.toJson().BooleanValue, true);

    const vvInt = mkVV("Integer", 42);
    assertEquals(vvInt.toJson().IntegerValue, 42);
    // integer must be whole
    assertThrows(() => mkVV("Integer", 3.14).toJson());

    const vvFloat = mkVV("Float", 3.14);
    assertEquals(vvFloat.toJson().FloatValue, 3.14);
    // float must be finite
    assertThrows(() => mkVV("Float", Number.POSITIVE_INFINITY).toJson());

    const vvDate = mkVV("Date", "2024-01-05");
    assertEquals(vvDate.toJson().DateValue, "2024-01-05");
    assertThrows(() => mkVV("Date", "2024-13-01").toJson());

    const vvDateTime = mkVV("DateTime", "2024-01-05T12:00:00Z");
    assertEquals(vvDateTime.toJson().DateTimeValue, "2024-01-05T12:00:00Z");
    assertThrows(() => mkVV("DateTime", "not-iso").toJson());

    // fromJson discriminates properly
    const vvFromJson = VariableValue.fromJson({
      VariableRef: { targetGUID: variable.guid },
      IntegerValue: 7,
    });
    assertEquals(vvFromJson.type, "Integer");
    assertEquals(vvFromJson.value, 7);
  });

  await t.step("Code and Codebook (nesting, colors, refs)", () => {
    const child = new Code({
      guid: "00000000-0000-0000-0000-00000000c002",
      name: "Child",
      isCodable: true,
      noteRefs: new Set([new Ref({ targetGUID: "00000000-0000-0000-0000-0000000000a1" })]),
    });
    const root = new Code({
      guid: "00000000-0000-0000-0000-00000000c001",
      name: "Root",
      isCodable: true,
      color: "#abcdef",
      description: "desc",
      children: new Set([child]),
    });
    const rootJson = root.toJson();
    assertEquals(rootJson._attributes.name, "Root");
    assertEquals(rootJson._attributes.color, "#abcdef");
    assertExists(rootJson.Code);
    const parsedRoot = Code.fromJson(rootJson);
    assertEquals(parsedRoot.children.size, 1);
    // invalid RGB should throw at toJson
    const bad = new Code({ guid: root.guid, name: "x", isCodable: true, color: "#GGGGGG" as any });
    assertThrows(() => bad.toJson());

    const cb = new Codebook({ codes: new Set([root]) });
    const cbJson = cb.toJson();
    assertEquals(cbJson.Codes.Code.length, 1);
    const cb2 = Codebook.fromJson(cbJson);
    assertEquals(cb2.codes.size, 1);
  });

  await t.step("Coding (dates, refs)", () => {
    const when = new Date("2024-01-05T15:04:05Z");
    const coding = new Coding({
      guid: "00000000-0000-0000-0000-00000000cd01",
      codeRef: new Ref({ targetGUID: "00000000-0000-0000-0000-00000000c001" }),
      noteRefs: new Set([new Ref({ targetGUID: "00000000-0000-0000-0000-0000000000a2" })]),
      creatingUser: "00000000-0000-0000-0000-0000000000b1",
      creationDateTime: when,
    });
    const cjson = coding.toJson();
    assertEquals(cjson.creationDateTime, when.toISOString());
    const c2 = Coding.fromJson(cjson);
    assertEquals(c2.creationDateTime?.toISOString(), when.toISOString());
  });

  await t.step("Selections (all types) and validators", () => {
    // PlainTextSelection
    const pts = new PlainTextSelection({
      guid: "00000000-0000-0000-0000-0000000000a3",
      name: "pts",
      startPosition: 1,
      endPosition: 5,
      codings: new Set(),
      noteRefs: new Set(),
    });
    const ptsJson = pts.toJson();
    assertEquals(ptsJson.startPosition, 1);
    assertEquals(ptsJson.endPosition, 5);

    // PictureSelection
    const pics = new PictureSelection({
      guid: "00000000-0000-0000-0000-0000000000a4",
      firstX: 1,
      firstY: 2,
      secondX: 3,
      secondY: 4,
    });
    assertEquals(pics.toJson().secondY, 4);

    // PDFSelection with representation
    const rep = new TextSource({ guid: "00000000-0000-0000-0000-0000000000a5", name: "rep", plainTextPath: "r.txt" });
    const pdfs = new PDFSelection({
      guid: "00000000-0000-0000-0000-0000000000a6",
      page: 2,
      firstX: 10,
      firstY: 20,
      secondX: 30,
      secondY: 40,
      representation: rep,
    });
    const pdfsJson = pdfs.toJson();
    assertEquals(pdfsJson.page, 2);
    assertExists(pdfsJson.Representation);

    // AudioSelection integer validator
    const ausGood = new AudioSelection({ guid: "00000000-0000-0000-0000-0000000000a7", begin: 0, end: 10 });
    assertEquals(ausGood.toJson().end, 10);
    const ausBad = new AudioSelection({ guid: "00000000-0000-0000-0000-0000000000a8", begin: 0.5 as any, end: 10 });
    assertThrows(() => ausBad.toJson());

    // VideoSelection integer validator
    const vidsBad = new VideoSelection({ guid: "00000000-0000-0000-0000-0000000000a9", begin: 1, end: 2.7 as any });
    assertThrows(() => vidsBad.toJson());

    // TranscriptSelection with sync points refs
    const ts = new TranscriptSelection({
      guid: "00000000-0000-0000-0000-0000000000aa",
      fromSyncPoint: "00000000-0000-0000-0000-0000000000ab",
      toSyncPoint: "00000000-0000-0000-0000-0000000000ac",
    });
    const tsJson = ts.toJson();
    assertEquals(tsJson.fromSyncPoint, "00000000-0000-0000-0000-0000000000ab");

    // SyncPoint integer validators (via Transcript emission using plain object)
    const trBad = new (refi as any).Transcript({
      guid: "00000000-0000-0000-0000-0000000000ad",
      noteRefs: new Set(),
      syncPoints: new Set([{ guid: "00000000-0000-0000-0000-0000000000ae", timeStamp: 1.2 }]),
      selections: new Set(),
      plainTextPath: "bd.txt",
    });
    assertThrows(() => trBad.toJson());
  });

  await t.step("Sources (Text, Picture, PDF, Audio, Video)", () => {
    // TextSource XOR: use path form
    const ts = new TextSource({ guid: "00000000-0000-0000-0000-0000000000b1", name: "t", plainTextPath: "t.txt" });
    const tsJson = ts.toJson();
    assertEquals(tsJson.plainTextPath, "t.txt");
    // content form
    const ts2 = new TextSource({ guid: "00000000-0000-0000-0000-0000000000b2", name: "t2", plainTextContent: "hi" });
    assertEquals(ts2.toJson().PlainTextContent, "hi");

    // PictureSource with selection and nested TextDescription
    const ps = new PictureSource({
      guid: "00000000-0000-0000-0000-0000000000b3",
      name: "pic",
      path: "a.jpg",
      currentPath: "b.jpg",
      pictureSelections: new Set([
        new PictureSelection({
          guid: "00000000-0000-0000-0000-0000000000b4",
          firstX: 1,
          firstY: 2,
          secondX: 3,
          secondY: 4,
        }),
      ]),
      textDescription: new TextSource({
        guid: "00000000-0000-0000-0000-0000000000b5",
        name: "d",
        plainTextPath: "d.txt",
      }),
    });
    const psJson = ps.toJson();
    assertEquals(psJson.path, "a.jpg");
    assertExists(psJson.PictureSelection);
    assertExists(psJson.TextDescription);

    // PDFSource with selection and representation
    const pds = new PDFSource({
      guid: "00000000-0000-0000-0000-0000000000b6",
      name: "pdf",
      path: "a.pdf",
      currentPath: "b.pdf",
      pdfSelections: new Set([
        new PDFSelection({
          guid: "00000000-0000-0000-0000-0000000000b7",
          page: 1,
          firstX: 1,
          firstY: 2,
          secondX: 3,
          secondY: 4,
        }),
      ]),
      representation: new TextSource({
        guid: "00000000-0000-0000-0000-0000000000b8",
        name: "r",
        plainTextPath: "r.txt",
      }),
    });
    const pdsJson = pds.toJson();
    assertEquals(pdsJson.path, "a.pdf");
    assertExists(pdsJson.PDFSelection);
    assertExists(pdsJson.Representation);

    // AudioSource with transcripts and selections
    const tr = new TranscriptSelection({ guid: "00000000-0000-0000-0000-0000000000b9" });
    const transcript = (refi as any).Transcript.fromJson({
      guid: "00000000-0000-0000-0000-0000000000ba",
      name: "tr",
      plainTextPath: "tr.txt",
      SyncPoint: [{ guid: "00000000-0000-0000-0000-0000000000bb", timeStamp: 1 }],
      TranscriptSelection: [tr.toJson()],
    });
    const as = new AudioSource({
      guid: "00000000-0000-0000-0000-0000000000bc",
      name: "audio",
      path: "a.m4a",
      currentPath: "b.m4a",
      transcripts: new Set([transcript]),
      audioSelections: new Set([
        new AudioSelection({ guid: "00000000-0000-0000-0000-0000000000bd", begin: 0, end: 1 }),
      ]),
    });
    const asJson = as.toJson();
    assertExists(asJson.Transcript);
    assertExists(asJson.AudioSelection);

    // VideoSource
    const vs = new VideoSource({
      guid: "00000000-0000-0000-0000-0000000000be",
      name: "video",
      path: "a.mp4",
      currentPath: "b.mp4",
      transcripts: new Set([transcript]),
      videoSelections: new Set([
        new VideoSelection({ guid: "00000000-0000-0000-0000-0000000000bf", begin: 2, end: 3 }),
      ]),
    });
    const vsJson = vs.toJson();
    assertExists(vsJson.Transcript);
    assertExists(vsJson.VideoSelection);
  });

  await t.step("Note extends TextSource", () => {
    const noteJson = {
      guid: "00000000-0000-0000-0000-0000000000c1",
      name: "note-1",
      PlainTextContent: "note",
    };
    const note = Note.fromJson(noteJson);
    assert(note instanceof Note);
    const emitted = note.toJson();
    assertEquals(emitted.PlainTextContent, "note");
  });

  await t.step("Graph, Vertex, Edge and Link", () => {
    const v1 = new Vertex({
      guid: "00000000-0000-0000-0000-0000000000d1",
      name: "A",
      firstX: 1,
      firstY: 2,
      color: "#ff00ff",
      shape: "Rectangle",
    });
    const v2 = new Vertex({ guid: "00000000-0000-0000-0000-0000000000d2", name: "B", firstX: 3, firstY: 4 });
    const e = new Edge({
      guid: "00000000-0000-0000-0000-0000000000d3",
      name: "E",
      sourceVertex: v1.guid,
      targetVertex: v2.guid,
      color: "#00ff00",
      direction: "OneWay",
      lineStyle: "dashed",
    });
    const g = new Graph({
      guid: "00000000-0000-0000-0000-0000000000d4",
      name: "G",
      vertices: new Set([v1, v2]),
      edges: new Set([e]),
    });
    const gj = g.toJson();
    assertEquals(gj.Vertex?.length ?? 0, 2);
    assertEquals(gj.Edge?.length ?? 0, 1);
    const g2 = Graph.fromJson(gj);
    assertEquals(g2.vertices.size, 2);
    assertEquals(g2.edges.size, 1);

    // Vertex secondX/secondY must be integers when present
    const vbad = new Vertex({
      guid: "00000000-0000-0000-0000-0000000000d5",
      firstX: 1,
      firstY: 1,
      secondX: 1.1 as any,
    });
    assertThrows(() => vbad.toJson());

    // Link
    const link = new Link({
      guid: "00000000-0000-0000-0000-0000000000d6",
      name: "L",
      direction: "Associative",
      originGUID: v1.guid,
      targetGUID: v2.guid,
    });
    const lj = link.toJson();
    assertEquals(lj.direction, "Associative");
    const l2 = Link.fromJson(lj);
    assertEquals(l2.originGUID, v1.guid);
  });

  await t.step("Case and User", () => {
    const u = new User({ guid: "00000000-0000-0000-0000-0000000000e1", name: "Alice", id: "alice" });
    const uj = u.toJson();
    assertEquals(uj.name, "Alice");
    const u2 = User.fromJson(uj);
    assertEquals(u2.id, "alice");

    const caseObj = new Case({
      guid: "00000000-0000-0000-0000-0000000000e2",
      name: "C1",
      description: "desc",
      codeRefs: new Set([new Ref({ targetGUID: "00000000-0000-0000-0000-00000000c001" })]),
      variableValues: new Set([
        new VariableValue({
          variableRef: new Ref({ targetGUID: "00000000-0000-0000-0000-0000000000e3" }),
          type: "Text",
          value: "hello",
        } as any),
      ]),
      sourceRefs: new Set([new Ref({ targetGUID: "00000000-0000-0000-0000-0000000000e4" })]),
      selectionRefs: new Set([new Ref({ targetGUID: "00000000-0000-0000-0000-0000000000e5" })]),
    });
    const cj = caseObj.toJson();
    assertEquals(cj.name, "C1");
    assertExists(cj.VariableValue);
    const c2 = Case.fromJson(cj);
    assertEquals(c2.codeRefs.size, 1);
    assertEquals(c2.variableValues.size, 1);
    assertEquals(c2.sourceRefs.size, 1);
    assertEquals(c2.selectionRefs.size, 1);
  });

  await t.step("Sets (CodeSet)", () => {
    const set = new CodeSet({
      guid: "00000000-0000-0000-0000-0000000000f1",
      name: "S",
      memberCodes: new Set([new Ref({ targetGUID: "00000000-0000-0000-0000-00000000c001" })]),
      memberSources: new Set([new Ref({ targetGUID: "00000000-0000-0000-0000-0000000000f2" })]),
      memberNotes: new Set([new Ref({ targetGUID: "00000000-0000-0000-0000-0000000000f3" })]),
    });
    const sj = set.toJson();
    assertEquals(sj.name, "S");
    assertExists(sj.MemberCode);
    assertExists(sj.MemberSource);
    assertExists(sj.MemberNote);
    const s2 = CodeSet.fromJson(sj);
    assertEquals(s2.memberCodes.size, 1);
  });

  await t.step("Project (attributes, sources aggregation, optional omissions)", () => {
    // Empty codebook should be omitted from emission
    const proj = new Project({
      name: "P",
      users: new Set([
        new (refi as any).User({ guid: "00000000-0000-0000-0000-0000000000a1", name: "U" }),
      ]),
      sources: new Set([
        // Use content form to avoid XOR with path in Project emissions ordering
        new TextSource({ guid: "00000000-0000-0000-0000-0000000000a2", name: "t", plainTextContent: "inline" }),
        new PictureSource({ guid: "00000000-0000-0000-0000-0000000000a3", name: "p", path: "p.jpg" }),
        new PDFSource({ guid: "00000000-0000-0000-0000-0000000000a4", name: "d", path: "d.pdf" }),
        new AudioSource({ guid: "00000000-0000-0000-0000-0000000000a5", name: "a" }),
        new VideoSource({ guid: "00000000-0000-0000-0000-0000000000a6", name: "v" }),
      ] as any),
      // empty Codebook by default
    });
    const pj = proj.toJson();
    assertEquals(pj._attributes.name, "P");
    // Sources sections should be grouped by type
    assertExists(pj.Sources?.TextSource);
    assertExists(pj.Sources?.PictureSource);
    assertExists(pj.Sources?.PDFSource);
    assertExists(pj.Sources?.AudioSource);
    assertExists(pj.Sources?.VideoSource);
    // CodeBook should be omitted when empty
    assertEquals("CodeBook" in pj, false);

    // From JSON back to class and emission stable
    const proj2 = Project.fromJson(pj);
    const pj2 = proj2.toJson();
    assertEquals(pj2._attributes.name, "P");
  });

  await t.step("Vertex/Edge representedGUID round-trip", () => {
    const vx = new Vertex({
      guid: "11111111-1111-1111-1111-111111111111",
      representedGUID: "22222222-2222-2222-2222-222222222222",
      name: "VX",
      firstX: 0,
      firstY: 0,
    });
    const vy = new Vertex({ guid: "33333333-3333-3333-3333-333333333333", firstX: 1, firstY: 1 });
    const ed = new Edge({
      guid: "44444444-4444-4444-4444-444444444444",
      representedGUID: "55555555-5555-5555-5555-555555555555",
      sourceVertex: vx.guid,
      targetVertex: vy.guid,
    });
    const g = new Graph({
      guid: "66666666-6666-6666-6666-666666666666",
      vertices: new Set([vx, vy]),
      edges: new Set([ed]),
    });
    const gj = g.toJson();
    const g2 = Graph.fromJson(gj);
    const [px] = [...g2.vertices];
    const [pe] = [...g2.edges];
    assertEquals(px.representedGUID, "22222222-2222-2222-2222-222222222222");
    assertEquals(pe.representedGUID, "55555555-5555-5555-5555-555555555555");
  });

  await t.step("Link color validation", () => {
    const v1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const v2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const good = new Link({
      guid: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      originGUID: v1,
      targetGUID: v2,
      color: "#123abc",
    });
    const lj = good.toJson();
    assertEquals(lj.color, "#123abc");
    const bad = new Link({
      guid: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      originGUID: v1,
      targetGUID: v2,
      color: "#12GGGG" as any,
    });
    assertThrows(() => bad.toJson());
  });

  await t.step("Set description presence/omission", () => {
    const withDesc = new CodeSet({ guid: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", name: "S", description: "desc" });
    const wj = withDesc.toJson();
    assertEquals(wj.Description, "desc");
    const noDesc = new CodeSet({ guid: "ffffffff-ffff-ffff-ffff-ffffffffffff", name: "S" });
    const nj = noDesc.toJson();
    assertEquals("Description" in nj, false);
  });

  await t.step("Project attributes and namespaces", () => {
    const created = new Date("2024-01-02T03:04:05Z");
    const modified = new Date("2024-02-03T04:05:06Z");
    const pj = new Project({
      name: "Meta",
      origin: "origin-system",
      basePath: "/base",
      creatingUserGUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      modifyingUserGUID: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      creationDateTime: created,
      modifiedDateTime: modified,
      xmlns: "urn:QDA-XML:project:1.0",
      xmlnsXsi: "http://www.w3.org/2001/XMLSchema-instance",
      xsiSchemaLocation: "urn:QDA-XML:project:1.0 schema.xsd",
    });
    const j = pj.toJson();
    const attrs = j._attributes;
    assertEquals(attrs.origin, "origin-system");
    assertEquals(attrs.basePath, "/base");
    assertEquals(attrs.creatingUserGUID, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    assertEquals(attrs.modifyingUserGUID, "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    assertEquals(attrs.creationDateTime, created.toISOString());
    assertEquals(attrs.modifiedDateTime, modified.toISOString());
    assertEquals((attrs as any)["xmlns"], "urn:QDA-XML:project:1.0");
    assertEquals((attrs as any)["xmlns:xsi"], "http://www.w3.org/2001/XMLSchema-instance");
    assertEquals((attrs as any)["xsi:schemaLocation"], "urn:QDA-XML:project:1.0 schema.xsd");
    // Round-trip through fromJson
    const p2 = Project.fromJson(j);
    const j2 = p2.toJson();
    assertEquals(j2._attributes.name, "Meta");
  });

  await t.step("SyncPoint direct fromJson/toJson and validators", () => {
    const sp = SyncPoint.fromJson({ guid: "12121212-1212-1212-1212-121212121212", timeStamp: 10, position: 2 });
    const sj = sp.toJson();
    assertEquals(sj.timeStamp, 10);
    assertEquals(sj.position, 2);
    const bad = new SyncPoint({ guid: "34343434-3434-3434-3434-343434343434", timeStamp: 1.5 as any });
    assertThrows(() => bad.toJson());
  });

  await t.step("Code deep hierarchy (grandchild)", () => {
    const grand = new Code({ guid: "abababab-abab-abab-abab-abababababab", name: "Grand", isCodable: true });
    const child = new Code({
      guid: "cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd",
      name: "Child",
      isCodable: true,
      children: new Set([grand]),
    });
    const root = new Code({
      guid: "efefefef-efef-efef-efef-efefefefefef",
      name: "Root",
      isCodable: true,
      children: new Set([child]),
    });
    const cb = new Codebook({ codes: new Set([root]) });
    const j = cb.toJson();
    const cb2 = Codebook.fromJson(j);
    const root2 = [...cb2.codes][0];
    const child2 = [...root2.children][0];
    const grand2 = [...child2.children][0];
    assertEquals(root2.name, "Root");
    assertEquals(child2.name, "Child");
    assertEquals(grand2.name, "Grand");
  });

  await t.step("Enum validation: Shape/Direction/LineStyle via fromJson", () => {
    // Invalid shape on Vertex
    assertThrows(() =>
      Vertex.fromJson({
        guid: "01010101-0101-0101-0101-010101010101",
        name: "bad",
        firstX: 0,
        firstY: 0,
        shape: "NotAShape" as any,
      } as any)
    );

    // Invalid direction on Edge
    assertThrows(() =>
      Edge.fromJson({
        guid: "02020202-0202-0202-0202-020202020202",
        sourceVertex: "03030303-0303-0303-0303-030303030303",
        targetVertex: "04040404-0404-0404-0404-040404040404",
        direction: "NotADir" as any,
      } as any)
    );

    // Invalid lineStyle on Edge
    assertThrows(() =>
      Edge.fromJson({
        guid: "05050505-0505-0505-0505-050505050505",
        sourceVertex: "06060606-0606-0606-0606-060606060606",
        targetVertex: "07070707-0707-0707-0707-070707070707",
        lineStyle: "wavy" as any,
      } as any)
    );

    // Invalid direction on Link
    assertThrows(() =>
      Link.fromJson({
        guid: "08080808-0808-0808-0808-080808080808",
        originGUID: "09090909-0909-0909-0909-090909090909",
        targetGUID: "0a0a0a0a-0a0a-0a0a-0a0a-0a0a0a0a0a0a",
        direction: "Sideways" as any,
      } as any)
    );
  });

  await t.step("Omit optional keys when undefined/empty", () => {
    // Code without optional fields omits Description, NoteRef, Code
    const minimalCode = new Code({ guid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", name: "x", isCodable: true });
    const mcj = minimalCode.toJson();
    assertEquals("Description" in mcj, false);
    assertEquals("NoteRef" in mcj, false);
    assertEquals("Code" in mcj, false);

    // Link without optional fields only has guid
    const minimalLink = new Link({ guid: "11111111-2222-3333-4444-555555555555" });
    const mlj = minimalLink.toJson();
    assertEquals(Object.keys(mlj).length, 1);
    assertEquals("NoteRef" in mlj, false);

    // PlainTextSelection with empty noteRefs/codings should omit those arrays
    const pts = new PlainTextSelection({
      guid: "66666666-7777-8888-9999-000000000000",
      startPosition: 0,
      endPosition: 1,
    });
    const psj = pts.toJson();
    assertEquals("NoteRef" in psj, false);
    assertEquals("Coding" in psj, false);
  });

  await t.step("Variable invalid typeOfVariable via fromJson", () => {
    assertThrows(() =>
      Variable.fromJson({
        guid: "99999999-9999-9999-9999-999999999999",
        name: "bad",
        typeOfVariable: "NotAType" as any,
      } as any)
    );
  });

  await t.step("Project omits empty top-level sections when empty", () => {
    const p = new Project({ name: "Empty" });
    const j = p.toJson();
    const keys = Object.keys(j);
    assertEquals(keys.length, 1);
    assertEquals("_attributes" in j, true);
    assertEquals("Users" in j, false);
    assertEquals("CodeBook" in j, false);
    assertEquals("Variables" in j, false);
    assertEquals("Cases" in j, false);
    assertEquals("Sources" in j, false);
    assertEquals("Notes" in j, false);
    assertEquals("Sets" in j, false);
    assertEquals("Graphs" in j, false);
    assertEquals("Links" in j, false);
    assertEquals("Description" in j, false);
    assertEquals("NoteRef" in j, false);
  });

  await t.step("Malformed GUIDs in constructors throw at toJson()", () => {
    // Ref
    const badRef = new Ref({ targetGUID: "not-a-guid" as any });
    assertThrows(() => badRef.toJson());

    // User
    const badUser = new User({ guid: "not-a-guid" as any, name: "u" });
    assertThrows(() => badUser.toJson());

    // Vertex GUID
    const badVertex = new Vertex({ guid: "not-a-guid" as any, firstX: 0, firstY: 0 });
    assertThrows(() => badVertex.toJson());

    // Edge fields
    const good = "00000000-0000-0000-0000-000000000001";
    const badEdgeSrc = new Edge({ guid: good, sourceVertex: "not-a-guid" as any, targetVertex: good });
    assertThrows(() => badEdgeSrc.toJson());
    const badEdgeRep = new Edge({
      guid: good,
      representedGUID: "not-a-guid" as any,
      sourceVertex: good,
      targetVertex: good,
    });
    assertThrows(() => badEdgeRep.toJson());

    // Link fields
    const badLink = new Link({ guid: good, originGUID: "not-a-guid" as any, targetGUID: good });
    assertThrows(() => badLink.toJson());

    // Project attributes
    const badProject = new Project({ name: "P", creatingUserGUID: "not-a-guid" as any });
    assertThrows(() => badProject.toJson());
  });

  await t.step("Invalid RGB on Vertex and Edge", () => {
    const g = "00000000-0000-0000-0000-000000000002";
    const v = new Vertex({ guid: g, firstX: 0, firstY: 0, color: "#GGGGGG" as any });
    assertThrows(() => v.toJson());
    const e = new Edge({ guid: g, sourceVertex: g, targetVertex: g, color: "#12zzzz" as any });
    assertThrows(() => e.toJson());
  });

  await t.step("Project invalid ISO datetimes throw at toJson()", () => {
    const pBadCreated = new Project({ name: "BadDateCreated", creationDateTime: new Date("not-iso") as any });
    assertThrows(() => pBadCreated.toJson());
    const pBadModified = new Project({ name: "BadDateModified", modifiedDateTime: new Date("still-not-iso") as any });
    assertThrows(() => pBadModified.toJson());
  });

  await t.step("PDFSource omits empty optional sections", () => {
    const pdf = new PDFSource({ guid: "10101010-1010-1010-1010-101010101010", name: "pdf" });
    const j = pdf.toJson();
    // Should not include these when empty/absent
    assertEquals("PDFSelection" in j, false);
    assertEquals("Representation" in j, false);
    assertEquals("Coding" in j, false);
    assertEquals("NoteRef" in j, false);
    assertEquals("VariableValue" in j, false);
  });

  await t.step("Symmetry: other sources omit empty optional sections", () => {
    // TextSource (must satisfy XOR with content)
    const ts = new TextSource({ guid: "20202020-2020-2020-2020-202020202020", name: "t", plainTextContent: "x" });
    const tsj = ts.toJson();
    assertEquals("PlainTextSelection" in tsj, false);
    assertEquals("Coding" in tsj, false);
    assertEquals("NoteRef" in tsj, false);
    assertEquals("VariableValue" in tsj, false);

    // PictureSource
    const ps = new PictureSource({ guid: "30303030-3030-3030-3030-303030303030", name: "p" });
    const psj = ps.toJson();
    assertEquals("PictureSelection" in psj, false);
    assertEquals("TextDescription" in psj, false);
    assertEquals("Coding" in psj, false);
    assertEquals("NoteRef" in psj, false);
    assertEquals("VariableValue" in psj, false);

    // AudioSource
    const as = new AudioSource({ guid: "40404040-4040-4040-4040-404040404040", name: "a" });
    const asj = as.toJson();
    assertEquals("Transcript" in asj, false);
    assertEquals("AudioSelection" in asj, false);
    assertEquals("Coding" in asj, false);
    assertEquals("NoteRef" in asj, false);
    assertEquals("VariableValue" in asj, false);

    // VideoSource
    const vs = new VideoSource({ guid: "50505050-5050-5050-5050-505050505050", name: "v" });
    const vsj = vs.toJson();
    assertEquals("Transcript" in vsj, false);
    assertEquals("VideoSelection" in vsj, false);
    assertEquals("Coding" in vsj, false);
    assertEquals("NoteRef" in vsj, false);
    assertEquals("VariableValue" in vsj, false);
  });
});
