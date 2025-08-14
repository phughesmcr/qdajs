# QDAJS

A library for working with QDE and QDXP files.

## Usage

```ts
import { qde, qdpx, refi } from "@phughesmcr/qdajs";

// Unpack a QDXP file
const input: Blob = Deno.readFileSync("example.qdpx");
const [unpackedOk, unpacked] = await qdpx.unpack(input);
if (!unpackedOk) throw unpacked;

// Read the project QDE
const projectQde: string = await unpacked.readProjectQde();

// Extract sources using async generator
const sources = [];
for await (const sourceData of unpacked.extractAll()) {
  // sourceData is ArrayBuffer, entries provide filenames
  // See unpacked.entries for file metadata
  sources.push({ content: sourceData });
}

// Convert the project QDE to JSON
const [jsonOk, json] = qde.toJson(projectQde);
if (!jsonOk) throw json;
console.log(json);

// Convert the project QDE to a Javascript class
const [projectSuccess, project] = refi.project.fromJson(json);
if (projectSuccess) {
  console.log("Project:", project);
}

// TODO: functionality to perform CRUD operations on the project

// Convert the JSON back to QDE (XML string)
const [qdeOk, qdeXml] = qde.fromJson(json);
if (!qdeOk) throw qdeXml;
console.log(qdeXml.qde);

// Pack the QDE back into a QDXP file (Blob)
const sourceFiles = [{ path: "example.txt", content: "Sample content" }];
const packedBlob = await qdpx.pack(json.qde, sourceFiles, { validateProjectQde: true });
console.log(packedBlob);
```
