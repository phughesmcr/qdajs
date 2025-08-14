import { vertexSchema } from "../../qde/schema.ts";
import type { VertexJson } from "../../qde/types.ts";
import type { Shape } from "../../types.ts";

export type VertexSpec = {
  guid: string;
  representedGUID?: string;
  name?: string;
  firstX: number;
  firstY: number;
  secondX?: number;
  secondY?: number;
  shape?: Shape;
  color?: string;
};

export class Vertex {
  readonly guid: string;
  readonly representedGUID?: string;
  readonly name?: string;
  readonly firstX: number;
  readonly firstY: number;
  readonly secondX?: number;
  readonly secondY?: number;
  readonly shape?: Shape;
  readonly color?: string;

  static fromJson(json: VertexJson): Vertex {
    const result = vertexSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as VertexJson;
    return new Vertex({
      guid: data.guid,
      representedGUID: data.representedGUID,
      name: data.name,
      firstX: data.firstX,
      firstY: data.firstY,
      secondX: data.secondX,
      secondY: data.secondY,
      shape: data.shape,
      color: data.color,
    });
  }

  constructor(spec: VertexSpec) {
    this.guid = spec.guid;
    this.representedGUID = spec.representedGUID;
    this.name = spec.name;
    this.firstX = spec.firstX;
    this.firstY = spec.firstY;
    this.secondX = spec.secondX;
    this.secondY = spec.secondY;
    this.shape = spec.shape;
    this.color = spec.color;
  }

  toJson(): VertexJson {
    return {
      guid: this.guid,
      representedGUID: this.representedGUID,
      name: this.name,
      firstX: this.firstX,
      firstY: this.firstY,
      secondX: this.secondX,
      secondY: this.secondY,
      shape: this.shape,
      color: this.color,
    };
  }
}
