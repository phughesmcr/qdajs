# QDAJS

A library for working with QDE and QDXP files.

## Usage

```ts
import { qde, qdpx } from "@phughesmcr/qdajs";

// Unpack a QDXP file
const input: Blob = Deno.readFileSync("example.qdpx");
const [unpackedOk, unpacked] = await qdpx.unpack(input);
if (!unpackedOk) throw unpacked;

// Read the project QDE
const projectQde: string = await unpacked.readProjectQde();

// Write sources to files
const sources = await unpacked.extractAll();
for (const source of sources) {
  const path = source.filename;
  const content = source.content;
  Deno.writeFileSync(path, content);
}

// Convert the project QDE to JSON
const [jsonOk, json] = qde.toJson(projectQde);
if (!jsonOk) throw json;
console.log(json);

// TODO: functionality to perform CRUD operations on the project

// Convert the JSON back to QDE (XML string)
const [qdeOk, qdeXml] = qde.fromJson(json);
if (!qdeOk) throw qde;
console.log(qdeXml);

// Pack the QDE back into a QDXP file (Blob)
const [packedOk, packedBlob] = qdpx.pack(qdeXml, sources, { validateProjectQde: true });
if (!packedOk) throw packed;
console.log(packedBlob);
```
