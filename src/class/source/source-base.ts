import type { VariableValueJson } from "../../qde/types.ts";
import type { Ref } from "../ref/ref.ts";
import type { Auditable, Described, HasNoteRefs, Identifiable, Named } from "../shared/interfaces.ts";

export type SourceBaseSpec =
  & Identifiable
  & Partial<Named & Described & Auditable>
  & {
    noteRefs: Ref[];
    variableValues: VariableValueJson[];
  };

export abstract class SourceBase
  implements Identifiable, Partial<Named>, Partial<Described>, Partial<Auditable>, HasNoteRefs {
  readonly guid: string;
  readonly name?: string;
  readonly description?: string;
  readonly creatingUser?: string;
  readonly creationDateTime?: Date;
  readonly modifyingUser?: string;
  readonly modifiedDateTime?: Date;
  readonly noteRefs: Ref[];
  readonly variableValues: VariableValueJson[];

  protected constructor(spec: SourceBaseSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.description = spec.description;
    this.creatingUser = spec.creatingUser;
    this.creationDateTime = spec.creationDateTime;
    this.modifyingUser = spec.modifyingUser;
    this.modifiedDateTime = spec.modifiedDateTime;
    this.noteRefs = spec.noteRefs;
    this.variableValues = spec.variableValues;
  }
}
