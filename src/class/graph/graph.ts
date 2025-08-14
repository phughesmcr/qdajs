import { graphSchema } from "../../qde/schema.ts";
import type { GraphJson } from "../../qde/types.ts";
import { Edge } from "./edge.ts";
import { Vertex } from "./vertex.ts";

export type GraphSpec = {
  guid: string;
  name?: string;
  vertices: Vertex[];
  edges: Edge[];
};

export class Graph {
  readonly guid: string;
  readonly name?: string;
  readonly vertices: Vertex[];
  readonly edges: Edge[];

  static fromJson(json: GraphJson): Graph {
    const result = graphSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as GraphJson;
    return new Graph({
      guid: data.guid,
      name: data.name,
      vertices: (data.Vertex ?? []).map(Vertex.fromJson),
      edges: (data.Edge ?? []).map(Edge.fromJson),
    });
  }

  constructor(spec: GraphSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.vertices = spec.vertices;
    this.edges = spec.edges;
  }

  toJson(): GraphJson {
    return {
      guid: this.guid,
      name: this.name,
      Vertex: this.vertices.map((v) => v.toJson()),
      Edge: this.edges.map((e) => e.toJson()),
    };
  }
}
