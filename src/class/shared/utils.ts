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
