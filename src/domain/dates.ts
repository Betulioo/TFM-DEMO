// Días naturales como tiempo transcurrido en múltiplos de 24 h, no como fechas del calendario: así no dependen
// de la zona horaria (decisión del 2026-10-19 en docs/bitacora.md).

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Fecha ISO `days` días naturales antes de `now`. */
export function daysBefore(now: Date, days: number): string {
  return new Date(now.getTime() - days * MILLISECONDS_PER_DAY).toISOString();
}

/** Si desde `since` (ISO) hasta `now` han pasado `days` días naturales o más. */
export function hasElapsedDays(since: string, now: Date, days: number): boolean {
  return now.getTime() - new Date(since).getTime() >= days * MILLISECONDS_PER_DAY;
}
