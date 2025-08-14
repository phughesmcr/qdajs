import type { Ref } from "../ref/ref.ts";

export interface Identifiable {
  guid: string;
}

export interface Named {
  name: string;
}

export interface Described {
  description?: string;
}

export interface HasNoteRefs {
  noteRefs: Ref[];
}

export interface Auditable {
  creatingUser?: string;
  creationDateTime?: Date;
  modifyingUser?: string;
  modifiedDateTime?: Date;
}
