import { vertexJsonSchema } from "../../qde/schema.ts";
import type { GuidString, RGBString, Shape, VertexJson } from "../../qde/types.ts";
import { ensureInteger, ensureValidGuid, ensureValidRgbColor } from "../../utils.ts";

export type VertexSpec = {
  guid: GuidString;
  representedGUID?: GuidString;
  name?: string;
  firstX: number;
  firstY: number;
  secondX?: number;
  secondY?: number;
  shape?: Shape;
  color?: RGBString;
};

export class Vertex {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="representedGUID" type="GUIDType"/> */
  readonly representedGUID?: GuidString;
  /** <xsd:attribute name="name" type="xsd:string"/> */
  readonly name?: string;
  /** <xsd:attribute name="firstX" type="xsd:integer" use="required"/> */
  readonly firstX: number;
  /** <xsd:attribute name="firstY" type="xsd:integer" use="required"/> */
  readonly firstY: number;
  /** <xsd:attribute name="secondX" type="xsd:integer"/> */
  readonly secondX?: number;
  /** <xsd:attribute name="secondY" type="xsd:integer"/> */
  readonly secondY?: number;
  /** <xsd:attribute name="shape" type="ShapeType"/> */
  shape?: Shape;
  /** <xsd:attribute name="color" type="RGBType"/> */
  color?: RGBString;

  /**
   * Create a Vertex from a JSON object.
   * @param json - The JSON object to create the Vertex from.
   * @returns The created Vertex.
   */
  static fromJson(json: VertexJson): Vertex {
    const result = vertexJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as VertexJson;
    const attrs = data._attributes as {
      guid: GuidString;
      representedGUID?: GuidString;
      name?: string;
      firstX: number;
      firstY: number;
      secondX?: number;
      secondY?: number;
      shape?: Shape;
      color?: RGBString;
    };
    return new Vertex({
      guid: attrs.guid,
      representedGUID: attrs.representedGUID,
      name: attrs.name,
      firstX: attrs.firstX,
      firstY: attrs.firstY,
      secondX: attrs.secondX,
      secondY: attrs.secondY,
      shape: attrs.shape,
      color: attrs.color,
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
    const guid = ensureValidGuid(this.guid, "Vertex.guid");
    const representedGUID = this.representedGUID
      ? ensureValidGuid(this.representedGUID, "Vertex.representedGUID")
      : undefined;
    const color = this.color ? ensureValidRgbColor(this.color) : undefined;
    const firstX = ensureInteger(this.firstX, "Vertex.firstX");
    const firstY = ensureInteger(this.firstY, "Vertex.firstY");
    const secondX = this.secondX ? ensureInteger(this.secondX, "Vertex.secondX") : undefined;
    const secondY = this.secondY ? ensureInteger(this.secondY, "Vertex.secondY") : undefined;

    return {
      _attributes: {
        guid,
        ...(representedGUID ? { representedGUID } : {}),
        ...(this.name ? { name: this.name } : {}),
        firstX,
        firstY,
        ...(secondX ? { secondX } : {}),
        ...(secondY ? { secondY } : {}),
        ...(this.shape ? { shape: this.shape } : {}),
        ...(color ? { color } : {}),
      },
    } as unknown as VertexJson;
  }
}
