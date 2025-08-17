import { GUID_REGEX, ISO_DATE_REGEX, ISO_DATETIME_REGEX, RGB_REGEX } from "../../constants.ts";

/** Coerce a value to an array, handling null/undefined gracefully */
export function coerceArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/** Safely extract string value with fallback */
export function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function coerceNoteRef(raw?: unknown[]): { targetGUID: string }[] {
  return coerceArray(raw)
    .map((ref: unknown) => {
      const targetGUID = String((ref as Record<string, unknown>)["targetGUID"] || "");
      if (!targetGUID) return null;
      return { targetGUID };
    })
    .filter(Boolean) as { targetGUID: string }[];
}

/**
 * Remove all properties with value undefined recursively from an object/array graph.
 * This ensures optional fields are omitted from emitted JSON when not present, per XSD.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefinedDeep(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) {
        result[key] = stripUndefinedDeep(val);
      }
    }
    return result as unknown as T;
  }
  return value;
}

/** Ensure a string is a valid ISO date (YYYY-MM-DD); returns the value or throws */
export function ensureValidIsoDate(value: string, context = "DateValue"): string {
  if (!ISO_DATE_REGEX.test(value)) {
    throw new Error(`${context} must be in ISO date format YYYY-MM-DD: ${value}`);
  }
  // Stricter: verify calendar-valid date (year-month-day ranges, leap years)
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr); // 1..12
  const day = Number(dayStr); // 1..31 (checked below)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error(`${context} must be a valid calendar date: ${value}`);
  }
  if (month < 1 || month > 12) {
    throw new Error(`${context} month must be between 01 and 12: ${value}`);
  }
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysPerMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const daysInMonth = daysPerMonth[month - 1];
  if (daysInMonth === undefined || day < 1 || day > daysInMonth) {
    throw new Error(`${context} day must be between 01 and ${String(daysInMonth).padStart(2, "0")}: ${value}`);
  }
  return value;
}

/** Ensure a string is a valid ISO 8601 datetime; returns the value or throws */
export function ensureValidIsoDateTime(value: string, context = "DateTimeValue"): string {
  if (!ISO_DATETIME_REGEX.test(value)) {
    throw new Error(`${context} must be in ISO 8601 datetime format: ${value}`);
  }
  // Stricter: confirm it parses to a valid date
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${context} must be a real datetime: ${value}`);
  }
  return value;
}

/** Ensure a string is a valid RGB color (#fff or #ffffff); returns the value or throws */
export function ensureValidRgbColor(value: string, context = "color"): string {
  if (!RGB_REGEX.test(value)) {
    throw new Error(`${context} must be a valid RGB hex color (e.g., #fff or #ffffff): ${value}`);
  }
  return value;
}

/** Ensure a string is a valid GUID/UUID; returns the value or throws */
export function ensureValidGuid(value: string, context = "guid"): string {
  if (!GUID_REGEX.test(value)) {
    throw new Error(`${context} must be a valid GUID: ${value}`);
  }
  return value;
}

/** Ensure a number is finite (rejects NaN/Infinity); returns the value or throws */
export function ensureFiniteNumber(value: number, context = "number"): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${context} must be a finite number: ${value}`);
  }
  return value;
}

/** Ensure a number is an integer; returns the value or throws */
export function ensureInteger(value: number, context = "integer"): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${context} must be an integer: ${value}`);
  }
  return value;
}

/** Assert exactly one of the provided keys is present (value !== undefined) */
export function assertExactlyOne(obj: Record<string, unknown>, keys: string[], context: string): void {
  const present = keys.reduce((acc, k) => acc + (obj[k] !== undefined ? 1 : 0), 0);
  if (present !== 1) {
    throw new Error(`${context}: exactly one of [${keys.join(", ")}] must be present`);
  }
}
