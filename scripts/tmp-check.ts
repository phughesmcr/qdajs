import { qde, refi } from "../mod.ts";
import type { ProjectJson } from "../src/qde/types.ts";

const minimal: ProjectJson = { _attributes: { name: "Minimal" } } as ProjectJson;
const project = (refi as any).Project.fromJson(minimal);
const classJson: ProjectJson = project.toJson();
console.log("classJson:", JSON.stringify(classJson));
const [ok, res] = qde.fromJson({ qde: classJson });
console.log("fromJson ok:", ok);
if (!ok) console.dir(res, { depth: 6 });
if (ok) {
  const [jok, jres] = qde.toJson((res as any).qde);
  console.log("toJson ok:", jok);
  if (!jok) console.dir(jres, { depth: 6 });
}

const spec: ProjectJson = {
  _attributes: { name: "I18N" },
  CodeBook: {
    Codes: {
      Code: [{
        _attributes: { guid: "00000000-0000-0000-0000-00000000c001", name: "c", isCodable: true },
        Description: "&<>\"' 😀",
      }],
    },
  },
} as ProjectJson;
const [x1, xr1] = qde.fromJson({ qde: spec });
console.log("spec to xml:", x1);
if (!x1) console.dir(xr1, { depth: 6 });
