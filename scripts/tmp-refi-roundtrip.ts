import { qde, refi } from "../mod.ts";
import type { ProjectJson } from "../src/qde/types.ts";

const xml = await Deno.readTextFile("./docs/example.qde");
const [ok, res] = qde.toJson(xml);
if (!ok) throw res;
const initial: ProjectJson = (res as any).qde;
const project = (refi as any).Project.fromJson(initial);
const classJson: ProjectJson = project.toJson();

const [xokA, xA] = qde.fromJson({ qde: initial });
const [xokB, xB] = qde.fromJson({ qde: classJson });
console.log("xml ok", xokA, xokB);
if (!xokA) console.dir(xA, { depth: 5 });
if (!xokB) console.dir(xB, { depth: 5 });

if (xokA && xokB) {
  const [jokA, jA] = qde.toJson((xA as any).qde);
  const [jokB, jB] = qde.toJson((xB as any).qde);
  console.log("json ok", jokA, jokB);
  if (!jokA) console.dir(jA, { depth: 5 });
  if (!jokB) console.dir(jB, { depth: 5 });
}
