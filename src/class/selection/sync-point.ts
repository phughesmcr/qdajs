import { syncPointSchema } from "../../qde/schema.ts";
import type { GuidString, SyncPointJson } from "../../qde/types.ts";
import { ensureInteger, ensureValidGuid } from "../shared/utils.ts";

export type SyncPointSpec = {
  guid: GuidString;
  timeStamp?: number;
  position?: number;
};

export class SyncPoint {
  // #### ATTRIBUTES ####

  /** <xsd:attribute name="guid" type="GUIDType" use="required"/> */
  readonly guid: GuidString;
  /** <xsd:attribute name="timeStamp" type="xsd:integer"/> */
  readonly timeStamp?: number;
  /** <xsd:attribute name="position" type="xsd:integer"/> */
  readonly position?: number;

  /**
   * Create a SyncPoint from a JSON object.
   * @param json - The JSON object to create the SyncPoint from.
   * @returns The created SyncPoint.
   */
  static fromJson(json: SyncPointJson): SyncPoint {
    const result = syncPointSchema.safeParse(json);
    if (!result.success) throw new Error(result.error.message);
    const data = result.data as unknown as SyncPointJson;
    return new SyncPoint({
      guid: data.guid,
      timeStamp: data.timeStamp,
      position: data.position,
    });
  }

  /**
   * Create a SyncPoint from a specification object.
   * @param spec - The specification object to create the SyncPoint from.
   */
  constructor(spec: SyncPointSpec) {
    this.guid = spec.guid;
    this.timeStamp = spec.timeStamp;
    this.position = spec.position;
  }

  /**
   * Convert the SyncPoint to a JSON object.
   * @returns The JSON object representing the SyncPoint.
   */
  toJson(): SyncPointJson {
    return {
      guid: ensureValidGuid(this.guid, "SyncPoint.guid"),
      ...(this.timeStamp !== undefined ? { timeStamp: ensureInteger(this.timeStamp, "SyncPoint.timeStamp") } : {}),
      ...(this.position !== undefined ? { position: ensureInteger(this.position, "SyncPoint.position") } : {}),
    };
  }
}
