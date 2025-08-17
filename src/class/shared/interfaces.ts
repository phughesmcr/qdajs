import type { GuidString } from "../../qde/types.ts";
import type { Ref } from "../ref/ref.ts";

export interface Identifiable {
  guid: GuidString;
}

export interface Named {
  name: string;
}

export interface Described {
  description: string;
}

export interface HasNoteRefs {
  noteRefs: Set<Ref>;
}

export interface Auditable {
  creatingUser: GuidString;
  creationDateTime: Date;
  modifyingUser: GuidString;
  modifiedDateTime: Date;
}
