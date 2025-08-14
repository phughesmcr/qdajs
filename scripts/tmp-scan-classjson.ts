import { qde, refi } from "../mod.ts";
import type { ProjectJson } from "../src/qde/types.ts";

const xml = await Deno.readTextFile("./docs/example.qde");
const [ok, res] = qde.toJson(xml);
if (!ok) throw res;
const initial: ProjectJson = (res as any).qde;
const project = (refi as any).Project.fromJson(initial);
const classJson: ProjectJson = project.toJson();

let issues = 0;
function scan(value: unknown, path: string[] = []) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => scan(v, path.concat(String(i))));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "NoteRef" || k === "CodeRef" || k === "MemberCode" || k === "MemberNote" || k === "MemberSource") {
        if (Array.isArray(v)) {
          v.forEach((item, idx) => {
            if (!item || typeof item !== "object" || !("targetGUID" in (item as any))) {
              console.log("Invalid ref at", path.concat(k, String(idx)).join("."), JSON.stringify(item));
              issues++;
            }
          });
        }
      }
      scan(v, path.concat(k));
    }
  }
}

scan(classJson);
console.log("issues:", issues);
