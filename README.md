# QDAJS

A library for converting between QDA XML and JSON.

## Usage

```ts
import { convert } from "@phughesmcr/qdajs";

const xml = Deno.readTextFileSync("example.qde");
const json = convert.qdeToJson(xml);
console.log(json);

const qde = convert.jsonToQde(json);
console.log(qde);
```
