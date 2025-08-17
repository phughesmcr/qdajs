import { textSourceSchema } from "../../qde/schema.ts";
import type { TextSourceJson } from "../../qde/types.ts";
import { VariableValue } from "../case/variableValue.ts";
import { Coding } from "../codebook/coding.ts";
import { Ref } from "../ref/ref.ts";
import { PlainTextSelection } from "../selection/plain-text-selection.ts";
import { assertExactlyOne, ensureValidGuid } from "../shared/utils.ts";
import { SourceBase, type SourceBaseSpec } from "./source-base.ts";

type TextSourceSpec = SourceBaseSpec & {
  plainTextContent?: string;
  plainTextSelections?: Set<PlainTextSelection>;
  richTextPath?: string;
  plainTextPath?: string;
};

export class TextSource extends SourceBase {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="richTextPath" type="xsd:string"/> */
  readonly richTextPath?: string;
  /** <xsd:attribute name="plainTextPath" type="xsd:string"/> */
  readonly plainTextPath?: string;

  // #### ELEMENTS ####

  /** <xsd:element name="PlainTextContent" type="xsd:string" minOccurs="0"/> */
  readonly plainTextContent?: string;
  /** <xsd:element name="PlainTextSelection" type="PlainTextSelectionType" minOccurs="0" maxOccurs="unbounded"/> */
  readonly plainTextSelections: Set<PlainTextSelection>;

  /**
   * Create a TextSource from a JSON object.
   * @param json - The JSON object to create the TextSource from.
   * @returns The created TextSource.
   */
  static fromJson(json: TextSourceJson): TextSource {
    const result = textSourceSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as TextSourceJson;
    return new TextSource({
      guid: data.guid,
      name: data.name,
      description: data.Description,
      creatingUser: data.creatingUser,
      creationDateTime: data.creationDateTime ? new Date(data.creationDateTime) : undefined,
      modifyingUser: data.modifyingUser,
      modifiedDateTime: data.modifiedDateTime ? new Date(data.modifiedDateTime) : undefined,
      noteRefs: new Set(data.NoteRef?.map((r) => Ref.fromJson(r)) ?? []),
      variableValues: new Set(data.VariableValue?.map((v) => VariableValue.fromJson(v)) ?? []),
      codings: new Set(data.Coding?.map((c) => Coding.fromJson(c)) ?? []),
      richTextPath: data.richTextPath,
      plainTextPath: data.plainTextPath,
      plainTextContent: data.PlainTextContent,
      plainTextSelections: new Set(data.PlainTextSelection?.map((s) => PlainTextSelection.fromJson(s)) ?? []),
    });
  }

  /**
   * Create a TextSource from a specification object.
   * @param spec - The specification object to create the TextSource from.
   * @note Either PlainTextContent or plainTextPath MUST be filled, not both.
   */
  constructor(spec: TextSourceSpec) {
    super(spec);
    this.richTextPath = spec.richTextPath;
    this.plainTextPath = spec.plainTextPath;
    this.plainTextContent = spec.plainTextContent;
    this.plainTextSelections = spec.plainTextSelections ?? new Set();
    // Enforce XOR at construction time for robustness
    assertExactlyOne(
      { PlainTextContent: this.plainTextContent, plainTextPath: this.plainTextPath },
      ["PlainTextContent", "plainTextPath"],
      "TextSource",
    );
  }

  /**
   * Convert the TextSource to a JSON object.
   * @returns The JSON object representing the TextSource.
   */
  toJson(): TextSourceJson {
    const json: TextSourceJson = {
      guid: ensureValidGuid(this.guid, "TextSource.guid"),
      ...(this.name ? { name: this.name } : {}),
      ...(this.creatingUser ? { creatingUser: ensureValidGuid(this.creatingUser, "TextSource.creatingUser") } : {}),
      ...(this.creationDateTime ? { creationDateTime: this.creationDateTime.toISOString() } : {}),
      ...(this.modifyingUser ? { modifyingUser: ensureValidGuid(this.modifyingUser, "TextSource.modifyingUser") } : {}),
      ...(this.modifiedDateTime ? { modifiedDateTime: this.modifiedDateTime.toISOString() } : {}),
      ...(this.description ? { Description: this.description } : {}),
      ...(this.codings.size > 0 ? { Coding: [...this.codings].map((c) => c.toJson()) } : {}),
      ...(this.noteRefs.size > 0 ? { NoteRef: [...this.noteRefs].map((r) => r.toJson()) } : {}),
      ...(this.variableValues.size > 0 ? { VariableValue: [...this.variableValues].map((v) => v.toJson()) } : {}),

      ...(this.plainTextContent ? { PlainTextContent: this.plainTextContent } : {}),
      ...(this.plainTextSelections.size > 0
        ? { PlainTextSelection: [...this.plainTextSelections].map((s) => s.toJson()) }
        : {}),

      ...(this.richTextPath ? { richTextPath: this.richTextPath } : {}),
      ...(this.plainTextPath ? { plainTextPath: this.plainTextPath } : {}),
    };
    // Re-assert XOR at serialization time to catch post-construction mutations
    assertExactlyOne(
      { PlainTextContent: json.PlainTextContent, plainTextPath: json.plainTextPath },
      ["PlainTextContent", "plainTextPath"],
      "TextSource",
    );
    return json;
  }
}
