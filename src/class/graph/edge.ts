import { edgeJsonSchema } from "../../qde/schema.ts";
import type { EdgeJson, GuidString, RGBString } from "../../qde/types.ts";
import type { Direction, LineStyle } from "../../types.ts";
import { ensureValidGuid, ensureValidRgbColor } from "../shared/utils.ts";

export type EdgeSpec = {
  guid: GuidString;
  representedGUID?: GuidString;
  name?: string;
  sourceVertex: GuidString;
  targetVertex: GuidString;
  color?: RGBString;
  direction?: Direction;
  lineStyle?: LineStyle;
};

export class Edge {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="representedGUID" type="GUIDType"/> */
  readonly representedGUID?: GuidString;
  /** <xsd:attribute name="name" type="xsd:string"/> */
  readonly name?: string;
  /** <xsd:attribute name="sourceVertex" type="GUIDType" use="required"/> */
  readonly sourceVertex: GuidString;
  /** <xsd:attribute name="targetVertex" type="GUIDType" use="required"/> */
  readonly targetVertex: GuidString;
  /** <xsd:attribute name="color" type="RGBType"/> */
  readonly color?: RGBString;
  /** <xsd:attribute name="direction" type="directionType"/> */
  readonly direction?: Direction;
  /** <xsd:attribute name="lineStyle" type="LineStyleType"/> */
  readonly lineStyle?: LineStyle;

  /**
   * Create an Edge from a JSON object.
   * @param json - The JSON object to create the Edge from.
   * @returns The created Edge.
   */
  static fromJson(json: EdgeJson): Edge {
    const result = edgeJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as EdgeJson;
    const attrs = data._attributes as {
      guid: GuidString;
      representedGUID?: GuidString;
      name?: string;
      sourceVertex: GuidString;
      targetVertex: GuidString;
      color?: RGBString;
      direction?: Direction;
      lineStyle?: LineStyle;
    };
    return new Edge({
      guid: attrs.guid,
      representedGUID: attrs.representedGUID,
      name: attrs.name,
      sourceVertex: attrs.sourceVertex,
      targetVertex: attrs.targetVertex,
      color: attrs.color,
      direction: attrs.direction,
      lineStyle: attrs.lineStyle,
    });
  }

  /**
   * Create an Edge from a specification object.
   * @param spec - The specification object to create the Edge from.
   */
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

  /**
   * Convert the Edge to a JSON object.
   * @returns The JSON object representing the Edge.
   */
  toJson(): EdgeJson {
    const guid = ensureValidGuid(this.guid, "Edge.guid");
    const representedGUID = this.representedGUID
      ? ensureValidGuid(this.representedGUID, "Edge.representedGUID")
      : undefined;
    const color = this.color ? ensureValidRgbColor(this.color) : undefined;
    const sourceVertex = ensureValidGuid(this.sourceVertex, "Edge.sourceVertex");
    const targetVertex = ensureValidGuid(this.targetVertex, "Edge.targetVertex");

    return {
      _attributes: {
        guid,
        ...(representedGUID ? { representedGUID } : {}),
        ...(this.name ? { name: this.name } : {}),
        sourceVertex,
        targetVertex,
        ...(color ? { color } : {}),
        ...(this.direction ? { direction: this.direction } : {}),
        ...(this.lineStyle ? { lineStyle: this.lineStyle } : {}),
      },
    } as unknown as EdgeJson;
  }
}
