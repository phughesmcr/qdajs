import { graphSchema } from "../../qde/schema.ts";
import type { GraphJson, GuidString } from "../../qde/types.ts";
import { ensureValidGuid } from "../shared/utils.ts";
import { Edge } from "./edge.ts";
import { Vertex } from "./vertex.ts";

export type GraphSpec = {
  guid: GuidString;
  name?: string;
  vertices?: Set<Vertex>;
  edges?: Set<Edge>;
};

export class Graph {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="name" type="xsd:string"/> */
  name?: string;

  // #### ELEMENTS ####

  /** <xsd:element name="Vertex" type="VertexType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly vertices: Set<Vertex>;
  /** <xsd:element name="Edge" type="EdgeType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly edges: Set<Edge>;

  /**
   * Create a Graph from a JSON object.
   * @param json - The JSON object to create the Graph from.
   * @returns The created Graph.
   */
  static fromJson(json: GraphJson): Graph {
    const result = graphSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as GraphJson;
    return new Graph({
      guid: data.guid,
      name: data.name,
      vertices: new Set(data.Vertex?.map(Vertex.fromJson) ?? []),
      edges: new Set(data.Edge?.map(Edge.fromJson) ?? []),
    });
  }

  /**
   * Create a Graph from a specification object.
   * @param spec - The specification object to create the Graph from.
   */
  constructor(spec: GraphSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.vertices = spec.vertices ?? new Set();
    this.edges = spec.edges ?? new Set();
  }

  /**
   * Convert the Graph to a JSON object.
   * @returns The JSON object representing the Graph.
   */
  toJson(): GraphJson {
    const guid = ensureValidGuid(this.guid, "Graph.guid");
    const vertices = [...this.vertices].map((v) => v.toJson());
    const edges = [...this.edges].map((e) => e.toJson());
    return {
      guid,
      ...(this.name ? { name: this.name } : {}),
      ...(vertices.length > 0 ? { Vertex: vertices } : {}),
      ...(edges.length > 0 ? { Edge: edges } : {}),
    };
  }
}
