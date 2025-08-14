import type { Ref } from "../ref/ref.ts";
import type { Auditable, Described, HasNoteRefs, Identifiable, Named } from "../shared/interfaces.ts";

export type SelectionBaseSpec =
  & Identifiable
  & Partial<Named & Described & Auditable>
  & {
    noteRefs: Ref[];
  };

export abstract class SelectionBase
  implements Identifiable, Partial<Named>, Partial<Described>, Partial<Auditable>, HasNoteRefs {
  readonly guid: string;
  readonly name?: string;
  readonly description?: string;
  readonly creatingUser?: string;
  readonly creationDateTime?: Date;
  readonly modifyingUser?: string;
  readonly modifiedDateTime?: Date;
  readonly noteRefs: Ref[];

  protected constructor(spec: SelectionBaseSpec) {
    this.guid = spec.guid;
    this.name = spec.name;
    this.description = spec.description;
    this.creatingUser = spec.creatingUser;
    this.creationDateTime = spec.creationDateTime;
    this.modifyingUser = spec.modifyingUser;
    this.modifiedDateTime = spec.modifiedDateTime;
    this.noteRefs = spec.noteRefs;
  }
}
