import { edgeSchema } from "../../qde/schema.ts";
import type { EdgeJson, GuidString, RGBString } from "../../qde/types.ts";
import type { LineStyle, LinkDirection } from "../../types.ts";

export type EdgeSpec = {
  guid: GuidString;
  representedGUID?: GuidString;
  name?: string;
  sourceVertex: GuidString;
  targetVertex: GuidString;
  color?: RGBString;
  direction?: LinkDirection;
  lineStyle?: LineStyle;
};

export class Edge {
  readonly guid: GuidString;
  readonly representedGUID?: GuidString;
  readonly name?: string;
  readonly sourceVertex: GuidString;
  readonly targetVertex: GuidString;
  readonly color?: RGBString;
  readonly direction?: LinkDirection;
  readonly lineStyle?: LineStyle;

  static fromJson(json: EdgeJson): Edge {
    const result = edgeSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as EdgeJson;
    return new Edge({
      guid: data.guid,
      representedGUID: data.representedGUID,
      name: data.name,
      sourceVertex: data.sourceVertex,
      targetVertex: data.targetVertex,
      color: data.color,
      direction: data.direction,
      lineStyle: data.lineStyle,
    });
  }

  constructor(spec: EdgeSpec) {
    this.guid = spec.guid;
    this.representedGUID = spec.representedGUID;
    this.name = spec.name;
    this.sourceVertex = spec.sourceVertex;
    this.targetVertex = spec.targetVertex;
    this.color = spec.color;
    this.direction = spec.direction;
    this.lineStyle = spec.lineStyle;
  }

  toJson(): EdgeJson {
    return {
      guid: this.guid,
      representedGUID: this.representedGUID,
      name: this.name,
      sourceVertex: this.sourceVertex,
      targetVertex: this.targetVertex,
      color: this.color,
      direction: this.direction,
      lineStyle: this.lineStyle,
    };
  }
}
