import { qde, qdpx, refi } from "../mod.ts";
import type { ProjectJson } from "../src/qde/types.ts";

const qdeXml = await Deno.readTextFile("./docs/example.qde");
const [ok, result] = qde.toJson(qdeXml);
if (!ok) throw result;
const projectJson: ProjectJson = (result as any).qde as ProjectJson;

const project = (refi as any).Project.fromJson(projectJson);
const jsonFromClass: ProjectJson = project.toJson();

const simplify = (p: ProjectJson) => ({
  _attributes: p._attributes,
  Users: p.Users,
  CodeBook: { Codes: p.CodeBook?.Codes },
  Variables: p.Variables,
  Sources: p.Sources,
  Sets: p.Sets,
});

const aObj = simplify(jsonFromClass);

const blob = await qdpx.pack(jsonFromClass, [
  { path: "note.txt", content: "Hello REFI", mimeType: "text/plain" },
]);
const [unpackOk, unpacker] = await qdpx.unpack(blob);
if (!unpackOk) throw unpacker;
const projectQde = await (unpacker as any).readProjectQde();
const [uok, ujson] = qde.toJson(projectQde);
if (!uok) throw ujson;
const bObj = simplify((ujson as any).qde as ProjectJson);

const sA = JSON.stringify(aObj);
const sB = JSON.stringify(bObj);
console.log("equal?", sA === sB);
if (sA !== sB) {
  const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
  for (const k of keys) {
    const va = JSON.stringify((aObj as any)[k]);
    const vb = JSON.stringify((bObj as any)[k]);
    if (va !== vb) {
      console.log("diff at key", k);
      console.log("A:", va?.slice(0, 500));
      console.log("B:", vb?.slice(0, 500));
    }
  }
  // Deep dive into first TextSource if Sources differ
  if (JSON.stringify((aObj as any).Sources) !== JSON.stringify((bObj as any).Sources)) {
    const aTs = (aObj as any).Sources?.TextSource?.[0];
    const bTs = (bObj as any).Sources?.TextSource?.[0];
    if (aTs && bTs) {
      console.log("-- First TextSource keys order A:", Object.keys(aTs));
      console.log("-- First TextSource keys order B:", Object.keys(bTs));
      const tsKeys = new Set([...Object.keys(aTs), ...Object.keys(bTs)]);
      for (const k of tsKeys) {
        const ava = JSON.stringify(aTs[k]);
        const bva = JSON.stringify(bTs[k]);
        if (ava !== bva) {
          console.log("TextSource field diff:", k);
          console.log("A:", ava?.slice(0, 500));
          console.log("B:", bva?.slice(0, 500));
        }
      }
    }
  }
}
await (unpacker as any).close();
