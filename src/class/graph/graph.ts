import { graphSchema } from "../../qde/schema.ts";
import type { GraphJson, GuidString } from "../../qde/types.ts";
import { Edge } from "./edge.ts";
import { Vertex } from "./vertex.ts";

export type GraphSpec = {
  guid: GuidString;
  name?: string;
  vertices?: Set<Vertex>;
  edges?: Set<Edge>;
};

export class Graph {
  name?: string;

  readonly guid: GuidString;
  readonly vertices: Set<Vertex>;
  readonly edges: Set<Edge>;

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

  constructor(spec: GraphSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.vertices = spec.vertices ?? new Set();
    this.edges = spec.edges ?? new Set();
  }

  toJson(): GraphJson {
    return {
      guid: this.guid,
      name: this.name,
      ...(this.vertices.size > 0 ? { Vertex: [...this.vertices].map((v) => v.toJson()) } : {}),
      ...(this.edges.size > 0 ? { Edge: [...this.edges].map((e) => e.toJson()) } : {}),
    };
  }
}
