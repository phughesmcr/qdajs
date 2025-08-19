import { projectJsonSchema } from "../qde/schema.ts";
import type { GuidString, ProjectJson } from "../qde/types.ts";
import { Case } from "./case/case.ts";
import { Variable } from "./case/variable.ts";
import { Codebook } from "./codebook/codebook.ts";
import { Graph } from "./graph/graph.ts";
import { Link } from "./link/link.ts";
import { Note } from "./note/note.ts";
import { Ref } from "./ref/ref.ts";
import { CodeSet } from "./set/set.ts";
import { ensureValidGuid, stripUndefinedDeep } from "./shared/utils.ts";
import { type AnySource, AudioSource, PDFSource, PictureSource, TextSource, VideoSource } from "./source/index.ts";
import { User } from "./user/user.ts";

export type ProjectSpec = {
  xmlns?: string;
  xmlnsXsi?: string;
  xsiSchemaLocation?: string;

  name: string;
  origin?: string;
  creatingUserGUID?: GuidString;
  creationDateTime?: Date;
  modifyingUserGUID?: GuidString;
  modifiedDateTime?: Date;
  basePath?: string;

  users?: Set<User>;
  codeBook?: Codebook;
  variables?: Set<Variable>;
  cases?: Set<Case>;
  sources?: Set<AnySource>;
  notes?: Set<Note>;
  links?: Set<Link>;
  sets?: Set<CodeSet>;
  graphs?: Set<Graph>;
  description?: string;
  noteRefs?: Set<Ref>;
};

export class Project {
  // #### TOP-LEVEL XML ATTRIBUTES ####

  /** <xsd:attribute name="xmlns" type="xsd:string"/> */
  xmlns?: string;
  /** <xsd:attribute name="xmlns:xsi" type="xsd:string"/> */
  xmlnsXsi?: string;
  /** <xsd:attribute name="xsi:schemaLocation" type="xsd:string"/> */
  xsiSchemaLocation?: string;

  // #### ATTRIBUTES ####

  /** <xsd:attribute name="name" type="xsd:string" use="required"/> */
  name: string;
  /** <xsd:attribute name="origin" type="xsd:string"/> */
  origin?: string;
  /** <xsd:attribute name="creatingUserGUID" type="GUIDType"/> */
  creatingUserGUID?: GuidString;
  /** <xsd:attribute name="creationDateTime" type="xsd:dateTime"/> */
  creationDateTime?: Date;
  /** <xsd:attribute name="modifyingUserGUID" type="GUIDType"/> */
  modifyingUserGUID?: GuidString;
  /** <xsd:attribute name="modifiedDateTime" type="xsd:dateTime"/> */
  modifiedDateTime?: Date;
  /** <xsd:attribute name="basePath" type="xsd:string"/> */
  basePath?: string;

  // #### ELEMENTS ####

  /** <xsd:element name="Description" type="xsd:string" minOccurs="0"/> */
  description?: string;
  /** <xsd:element name="Users" type="UsersType" minOccurs="0"/> */
  readonly users: Set<User>;
  /** <xsd:element name="CodeBook" type="CodeBookType" minOccurs="0"/> */
  readonly codeBook: Codebook;
  /** <xsd:element name="Variables" type="VariablesType" minOccurs="0"/> */
  readonly variables: Set<Variable>;
  /** <xsd:element name="Cases" type="CasesType" minOccurs="0"/> */
  readonly cases: Set<Case>;
  /** <xsd:element name="Sources" type="SourcesType" minOccurs="0"/> */
  readonly sources: Set<AnySource>;
  /** <xsd:element name="Notes" type="NotesType" minOccurs="0"/> */
  readonly notes: Set<Note>;
  /** <xsd:element name="Sets" type="SetsType" minOccurs="0"/> */
  readonly sets: Set<CodeSet>;
  /** <xsd:element name="Graphs" type="GraphsType" minOccurs="0"/> */
  readonly graphs: Set<Graph>;
  /** <xsd:element name="Links" type="LinksType" minOccurs="0"/> */
  readonly links: Set<Link>;
  /**
   * <xsd:element name="NoteRef" type="NoteRefType" minOccurs="0" maxOccurs="unbounded"/>
   * Note(s) that apply to the project as a whole
   */
  readonly noteRefs: Set<Ref>;

  /**
   * Create a Project from a JSON object.
   * @param json - The JSON object to create the Project from.
   * @returns The created Project.
   */
  static fromJson(json: ProjectJson): Project {
    const result = projectJsonSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);

    const data = result.data as unknown as ProjectJson;
    const codeBook = data.CodeBook ? Codebook.fromJson(data.CodeBook) : new Codebook({ codes: new Set() });
    const sourcesJson = data.Sources
      ? {
        TextSource: data.Sources.TextSource?.map((s) => TextSource.fromJson(s)) ?? [],
        PictureSource: data.Sources.PictureSource?.map((s) => PictureSource.fromJson(s)) ?? [],
        PDFSource: data.Sources.PDFSource?.map((s) => PDFSource.fromJson(s)) ?? [],
        AudioSource: data.Sources.AudioSource?.map((s) => AudioSource.fromJson(s)) ?? [],
        VideoSource: data.Sources.VideoSource?.map((s) => VideoSource.fromJson(s)) ?? [],
      }
      : {};

    const users = new Set(data.Users?.User.map((u) => User.fromJson(u)) ?? []);
    const variables = new Set(data.Variables?.Variable?.map((v) => Variable.fromJson(v)) ?? []);
    const cases = new Set(data.Cases?.Case?.map((c) => Case.fromJson(c)) ?? []);
    const sources = new Set(Object.values(sourcesJson).flat());
    const links = new Set(data.Links?.Link?.map((l) => Link.fromJson(l)) ?? []);
    const notes = new Set(data.Notes?.Note?.map((n) => Note.fromJson(n)) ?? []);
    const sets = new Set(data.Sets?.Set?.map((s) => CodeSet.fromJson(s)) ?? []);
    const graphs = new Set(data.Graphs?.Graph?.map((g) => Graph.fromJson(g)) ?? []);
    const noteRefs = new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []);

    const xmlAttributes = data._attributes as unknown as Record<string, unknown>;
    const { xmlns, "xmlns:xsi": xmlnsXsi, "xsi:schemaLocation": xsiSchemaLocation } = xmlAttributes;
    const { creationDateTime, modifiedDateTime } = xmlAttributes;
    const _creationDateTime = creationDateTime ? new Date(creationDateTime as string) : undefined;
    const _modifiedDateTime = modifiedDateTime ? new Date(modifiedDateTime as string) : undefined;

    return new Project({
      xmlns: xmlns as string | undefined,
      xmlnsXsi: xmlnsXsi as string | undefined,
      xsiSchemaLocation: xsiSchemaLocation as string | undefined,
      name: xmlAttributes["name"] as string,
      origin: xmlAttributes["origin"] as string | undefined,
      creatingUserGUID: xmlAttributes["creatingUserGUID"] as GuidString | undefined,
      creationDateTime: _creationDateTime,
      modifyingUserGUID: xmlAttributes["modifyingUserGUID"] as GuidString | undefined,
      modifiedDateTime: _modifiedDateTime,
      basePath: xmlAttributes["basePath"] as string | undefined,
      users,
      codeBook,
      variables,
      cases,
      sources,
      notes,
      sets,
      graphs,
      links,
      description: data.Description,
      noteRefs,
    });
  }

  /**
   * Create a Project from a specification object.
   * @param spec - The specification object to create the Project from.
   */
  constructor(spec: ProjectSpec) {
    this.xmlns = spec.xmlns;
    this.xmlnsXsi = spec.xmlnsXsi;
    this.xsiSchemaLocation = spec.xsiSchemaLocation;

    this.name = spec.name;
    this.origin = spec.origin;
    this.creatingUserGUID = spec.creatingUserGUID;
    this.creationDateTime = spec.creationDateTime;
    this.modifyingUserGUID = spec.modifyingUserGUID;
    this.modifiedDateTime = spec.modifiedDateTime;
    this.basePath = spec.basePath;

    this.users = spec.users ?? new Set();
    this.codeBook = spec.codeBook ?? new Codebook({ codes: new Set() });
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

  /**
   * Convert the Project to a JSON object.
   * @returns The JSON object representing the Project.
   */
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
      ...(this.origin ? { origin: this.origin } : {}),
      ...(this.creatingUserGUID
        ? { creatingUserGUID: ensureValidGuid(this.creatingUserGUID, "Project.creatingUserGUID") }
        : {}),
      ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
      ...(this.modifyingUserGUID
        ? { modifyingUserGUID: ensureValidGuid(this.modifyingUserGUID, "Project.modifyingUserGUID") }
        : {}),
      ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
      ...(this.basePath ? { basePath: this.basePath } : {}),
      ...(this.xmlns ? { xmlns: this.xmlns } : {}),
      ...(this.xmlnsXsi ? { "xmlns:xsi": this.xmlnsXsi } : {}),
      ...(this.xsiSchemaLocation ? { "xsi:schemaLocation": this.xsiSchemaLocation } : {}),
    };

    const json: ProjectJson = {
      _attributes: attributes,
      ...(this.users.size > 0
        ? {
          Users: {
            User: [...this.users].map((u) => u.toJson()),
          },
        }
        : {}),
      ...(this.codeBook && (this.codeBook.codes?.size ?? 0) > 0 ? { CodeBook: this.codeBook.toJson() } : {}),
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
    return stripUndefinedDeep(json);
  }
}
