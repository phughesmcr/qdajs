import { jsonToQde } from "./src/convert/jsonToXml.ts";
import { qdeToJson } from "./src/convert/xmlToJson.ts";

export const convert = {
  qdeToJson,
  jsonToQde,
};

export default { convert };
