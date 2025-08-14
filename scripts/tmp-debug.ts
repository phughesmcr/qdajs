import { qde, refi } from "../mod.ts";
import { validateQdeJson } from "../src/qde/validate.ts";

const xml = await Deno.readTextFile("./docs/example.qde");
const [ok, res] = qde.toJson(xml);
if (!ok) {
  console.error("toJson fail", res);
  Deno.exit(1);
}

const pj = (refi as any).Project.fromJson((res as any).qde);
const cj = pj.toJson();
const [valid, err] = validateQdeJson(cj);
console.log("valid?", valid);
if (!valid) {
  console.dir(err, { depth: 5 });
}
