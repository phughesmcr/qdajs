import { projectSchema } from "../qde/schema.ts";
import type { ProjectJson } from "../qde/types.ts";
import { Case } from "./case/case.ts";
import { Variable } from "./case/variable.ts";
import { Codebook } from "./codebook/codebook.ts";
import { Graph } from "./graph/graph.ts";
import { Link } from "./link/link.ts";
import { Note } from "./note/note.ts";
import { Ref } from "./ref/ref.ts";
import { Set } from "./set/set.ts";
import { type AnySource, AudioSource, PDFSource, PictureSource, TextSource, VideoSource } from "./source/index.ts";
import { User } from "./user/user.ts";

export type ProjectSpec = {
  name: string;
  origin: string;
  creatingUserGUID?: string;
  creationDateTime?: Date;
  modifyingUserGUID?: string;
  modifiedDateTime?: Date;
  basePath?: string;

  users: User[];
  codeBook: Codebook;
  variables: Variable[];
  cases: Case[];
  sources: AnySource[];
  notes: Note[];
  sets: Set[];
  graphs: Graph[];
  links: Link[];
  description?: string;
  noteRefs: Ref[];
};

export class Project {
  readonly name: string;
  readonly origin: string;
  readonly creatingUserGUID?: string;
  readonly creationDateTime?: Date;
  readonly modifyingUserGUID?: string;
  readonly modifiedDateTime?: Date;
  readonly basePath?: string;

  readonly users: User[];
  readonly codeBook: Codebook;
  readonly variables: Variable[];
  readonly cases: Case[];
  readonly sources: AnySource[];
  readonly notes: Note[];
  readonly sets: Set[];
  readonly graphs: Graph[];
  readonly links: Link[];
  readonly description?: string;
  readonly noteRefs: Ref[];

  static fromJson(json: ProjectJson): Project {
    const result = projectSchema.safeParse(json);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    const data = result.data as unknown as ProjectJson;
    const codeBook = data.CodeBook ? Codebook.fromJson(data.CodeBook) : new Codebook({
      codes: [],
      sets: [],
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
      users: data.Users?.User.map((u) => User.fromJson(u)) ?? [],
      codeBook,
      variables: data.Variables?.Variable?.map((v) => Variable.fromJson(v)) ?? [],
      cases: data.Cases?.Case?.map((c) => Case.fromJson(c)) ?? [],
      sources: Object.values(sources).flat(),
      notes: data.Notes?.Note?.map((n) => Note.fromJson(n)) ?? [],
      sets: data.Sets?.Set?.map((s) => Set.fromJson(s)) ?? [],
      graphs: data.Graphs?.Graph?.map((g) => Graph.fromJson(g)) ?? [],
      links: data.Links?.Link?.map((l) => Link.fromJson(l)) ?? [],
      description: data.Description ?? undefined,
      noteRefs: data.NoteRef?.map((r) => Ref.fromJson(r)) ?? [],
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

    this.users = spec.users;
    this.codeBook = spec.codeBook;
    this.variables = spec.variables;
    this.cases = spec.cases;
    this.sources = spec.sources;
    this.notes = spec.notes;
    this.sets = spec.sets;
    this.graphs = spec.graphs;
    this.links = spec.links;
    this.description = spec.description;
    this.noteRefs = spec.noteRefs;
  }

  toJson(): ProjectJson {
    // Group sources by concrete type to match REFI-QDA JSON structure
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
      ...(this.users.length > 0
        ? {
          Users: {
            User: this.users.map((u) => u.toJson()),
          },
        }
        : {}),
      // Include CodeBook only when it contains meaningful data
      ...((this.codeBook && (
          (this.codeBook.codes?.length ?? 0) > 0 ||
          (this.codeBook.sets?.length ?? 0) > 0 ||
          (this.codeBook.origin ?? "") !== ""
        ))
        ? { CodeBook: this.codeBook.toJson() }
        : {}),
      ...(this.variables.length > 0
        ? {
          Variables: {
            Variable: this.variables.map((v) => v.toJson()),
          },
        }
        : {}),
      ...(this.cases.length > 0
        ? {
          Cases: {
            Case: this.cases.map((c) => c.toJson()),
          },
        }
        : {}),
      ...(Object.keys(sourcesJson ?? {}).length ? { Sources: sourcesJson } : {}),
      ...(this.notes.length > 0
        ? {
          Notes: {
            Note: this.notes.map((n) => n.toJson()),
          },
        }
        : {}),
      ...(this.sets.length > 0
        ? {
          Sets: {
            Set: this.sets.map((s) => s.toJson()),
          },
        }
        : {}),
      ...(this.graphs.length > 0
        ? {
          Graphs: {
            Graph: this.graphs.map((g) => g.toJson()),
          },
        }
        : {}),
      ...(this.links.length > 0
        ? {
          Links: {
            Link: this.links.map((l) => l.toJson()),
          },
        }
        : {}),
      ...(this.description ? { Description: this.description } : {}),
      ...(this.noteRefs.length > 0 ? { NoteRef: this.noteRefs.map((r) => r.toJson()) } : {}),
    };
  }
}
