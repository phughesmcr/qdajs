import { projectSchema } from "../qde/schema.ts";
import type { GuidString, ProjectJson } from "../qde/types.ts";
import { Case } from "./case/case.ts";
import { Variable } from "./case/variable.ts";
import { Codebook } from "./codebook/codebook.ts";
import { Graph } from "./graph/graph.ts";
import { Link } from "./link/link.ts";
import { Note } from "./note/note.ts";
import { Ref } from "./ref/ref.ts";
import { CodeSet } from "./set/set.ts";
import { type AnySource, AudioSource, PDFSource, PictureSource, TextSource, VideoSource } from "./source/index.ts";
import { User } from "./user/user.ts";

export type ProjectSpec = {
  name: string;
  origin: string;
  creatingUserGUID?: GuidString;
  creationDateTime?: Date;
  modifyingUserGUID?: GuidString;
  modifiedDateTime?: Date;
  basePath?: string;
  description?: string;

  users?: Set<User>;
  codeBook?: Codebook;
  variables?: Set<Variable>;
  cases?: Set<Case>;
  sources?: Set<AnySource>;
  notes?: Set<Note>;
  sets?: Set<CodeSet>;
  graphs?: Set<Graph>;
  links?: Set<Link>;
  noteRefs?: Set<Ref>;
};

export class Project {
  name: string;
  origin: string;
  creatingUserGUID?: GuidString;
  creationDateTime?: Date;
  modifyingUserGUID?: GuidString;
  modifiedDateTime?: Date;
  basePath?: string;
  description?: string;

  readonly users: Set<User>;
  readonly codeBook: Codebook;
  readonly variables: Set<Variable>;
  readonly cases: Set<Case>;
  readonly sources: Set<AnySource>;
  readonly notes: Set<Note>;
  readonly sets: Set<CodeSet>;
  readonly graphs: Set<Graph>;
  readonly links: Set<Link>;
  readonly noteRefs: Set<Ref>;

  static fromJson(json: ProjectJson): Project {
    const result = projectSchema.safeParse(json);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    const data = result.data as unknown as ProjectJson;
    const codeBook = data.CodeBook ? Codebook.fromJson(data.CodeBook) : new Codebook({
      codes: new Set(),
      sets: new Set(),
      origin: data._attributes.origin ?? "",
    });
    const sources = data.Sources
      ? {
        TextSource: data.Sources.TextSource?.map((s) => TextSource.fromJson(s)) ?? [],
        PictureSource: data.Sources.PictureSource?.map((s) => PictureSource.fromJson(s)) ?? [],
        PDFSource: data.Sources.PDFSource?.map((s) => PDFSource.fromJson(s)) ?? [],
        AudioSource: data.Sources.AudioSource?.map((s) => AudioSource.fromJson(s)) ?? [],
        VideoSource: data.Sources.VideoSource?.map((s) => VideoSource.fromJson(s)) ?? [],
      }
      : {};
    return new Project({
      name: data._attributes.name,
      origin: data._attributes.origin ?? "",
      creatingUserGUID: data._attributes.creatingUserGUID,
      creationDateTime: data._attributes.creationDateTime ? new Date(data._attributes.creationDateTime) : undefined,
      modifyingUserGUID: data._attributes.modifyingUserGUID,
      modifiedDateTime: data._attributes.modifiedDateTime ? new Date(data._attributes.modifiedDateTime) : undefined,
      basePath: data._attributes.basePath,
      users: new Set(data.Users?.User.map((u) => User.fromJson(u)) ?? []),
      codeBook,
      variables: new Set(data.Variables?.Variable?.map((v) => Variable.fromJson(v)) ?? []),
      cases: new Set(data.Cases?.Case?.map((c) => Case.fromJson(c)) ?? []),
      sources: new Set(Object.values(sources).flat()),
      notes: new Set(data.Notes?.Note?.map((n) => Note.fromJson(n)) ?? []),
      sets: new Set(data.Sets?.Set?.map((s) => CodeSet.fromJson(s)) ?? []),
      graphs: new Set(data.Graphs?.Graph?.map((g) => Graph.fromJson(g)) ?? []),
      links: new Set(data.Links?.Link?.map((l) => Link.fromJson(l)) ?? []),
      description: data.Description ?? undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
    });
  }

  constructor(spec: ProjectSpec) {
    this.name = spec.name;
    this.origin = spec.origin;
    this.creatingUserGUID = spec.creatingUserGUID;
    this.creationDateTime = spec.creationDateTime;
    this.modifyingUserGUID = spec.modifyingUserGUID;
    this.modifiedDateTime = spec.modifiedDateTime;
    this.basePath = spec.basePath;

    this.users = spec.users ?? new Set();
    this.codeBook = spec.codeBook ?? new Codebook({
      codes: new Set(),
      sets: new Set(),
      origin: this.origin,
    });
    this.variables = spec.variables ?? new Set();
    this.cases = spec.cases ?? new Set();
    this.sources = spec.sources ?? new Set();
    this.notes = spec.notes ?? new Set();
    this.sets = spec.sets ?? new Set();
    this.graphs = spec.graphs ?? new Set();
    this.links = spec.links ?? new Set();
    this.description = spec.description;
    this.noteRefs = spec.noteRefs ?? new Set();
  }

  toJson(): ProjectJson {
    const textSources = [] as ReturnType<TextSource["toJson"]>[];
    const pictureSources = [] as ReturnType<PictureSource["toJson"]>[];
    const pdfSources = [] as ReturnType<PDFSource["toJson"]>[];
    const audioSources = [] as ReturnType<AudioSource["toJson"]>[];
    const videoSources = [] as ReturnType<VideoSource["toJson"]>[];

    for (const source of this.sources) {
      if (source instanceof TextSource) {
        textSources.push(source.toJson());
      } else if (source instanceof PictureSource) {
        pictureSources.push(source.toJson());
      } else if (source instanceof PDFSource) {
        pdfSources.push(source.toJson());
      } else if (source instanceof AudioSource) {
        audioSources.push(source.toJson());
      } else if (source instanceof VideoSource) {
        videoSources.push(source.toJson());
      }
    }

    const sourcesJson: ProjectJson["Sources"] = {
      ...(textSources.length ? { TextSource: textSources } : {}),
      ...(pictureSources.length ? { PictureSource: pictureSources } : {}),
      ...(pdfSources.length ? { PDFSource: pdfSources } : {}),
      ...(audioSources.length ? { AudioSource: audioSources } : {}),
      ...(videoSources.length ? { VideoSource: videoSources } : {}),
    };

    const attributes: ProjectJson["_attributes"] = {
      name: this.name,
      origin: this.origin,
      ...(this.creatingUserGUID ? { creatingUserGUID: this.creatingUserGUID } : {}),
      ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
      ...(this.modifyingUserGUID ? { modifyingUserGUID: this.modifyingUserGUID } : {}),
      ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
      ...(this.basePath ? { basePath: this.basePath } : {}),
    };

    return {
      _attributes: attributes,
      ...(this.users.size > 0
        ? {
          Users: {
            User: [...this.users].map((u) => u.toJson()),
          },
        }
        : {}),
      // Include CodeBook only when it contains meaningful data
      ...((this.codeBook && (
          (this.codeBook.codes?.size ?? 0) > 0 ||
          (this.codeBook.sets?.size ?? 0) > 0 ||
          (this.codeBook.origin ?? "") !== ""
        ))
        ? { CodeBook: this.codeBook.toJson() }
        : {}),
      ...(this.variables.size > 0
        ? {
          Variables: {
            Variable: [...this.variables].map((v) => v.toJson()),
          },
        }
        : {}),
      ...(this.cases.size > 0
        ? {
          Cases: {
            Case: [...this.cases].map((c) => c.toJson()),
          },
        }
        : {}),
      ...(Object.keys(sourcesJson ?? {}).length ? { Sources: sourcesJson } : {}),
      ...(this.notes.size > 0
        ? {
          Notes: {
            Note: [...this.notes].map((n) => n.toJson()),
          },
        }
        : {}),
      ...(this.sets.size > 0
        ? {
          Sets: {
            Set: [...this.sets].map((s) => s.toJson()),
          },
        }
        : {}),
      ...(this.graphs.size > 0
        ? {
          Graphs: {
            Graph: [...this.graphs].map((g) => g.toJson()),
          },
        }
        : {}),
      ...(this.links.size > 0
        ? {
          Links: {
            Link: [...this.links].map((l) => l.toJson()),
          },
        }
        : {}),
      ...(this.description ? { Description: this.description } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
    };
  }
}
