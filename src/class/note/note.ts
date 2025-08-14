import type { NoteJson } from "../../qde/types.ts";
import { TextSource } from "../source/text-source.ts";

export class Note extends TextSource {
  static override fromJson(json: NoteJson): Note {
    const text = TextSource.fromJson(json);
    // Upcast to Note
    return new Note({
      guid: text.guid,
      name: text.name,
      description: text.description,
      creatingUser: text.creatingUser,
      creationDateTime: text.creationDateTime,
      modifyingUser: text.modifyingUser,
      modifiedDateTime: text.modifiedDateTime,
      noteRefs: text.noteRefs,
      variableValues: text.variableValues,
      richTextPath: text.richTextPath,
      plainTextPath: text.plainTextPath,
      plainTextContent: text.plainTextContent,
    });
  }
}
