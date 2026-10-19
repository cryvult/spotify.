// Proste strażniki typów do sprawdzania danych odczytanych z localStorage lub API.

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

/** Zwraca wartość, jeśli należy do listy dozwolonych, w przeciwnym razie wartość domyślną. */
export function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return isFiniteNumber(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
