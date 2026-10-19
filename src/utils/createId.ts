/** Unikalny identyfikator, np. „pl_3f9c2a1b”. Używa crypto.randomUUID, gdy jest dostępne. */
export function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${random}`;
}
