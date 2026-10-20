// Helpers que comparten tests de carpetas distintas (CLAUDE.md, "DRY").

/**
 * "Ahora" fijo de los tests: nunca la hora real (skill tests-semanticos, criterio 3). Se exporta como texto y
 * cada archivo crea su `Date`: un `Date` compartido se puede modificar y un test afectaría a otro.
 */
export const NOW_ISO = "2026-10-19T09:00:00Z";

/** Lista de `count` elementos construidos a partir de su posición (0, 1, 2…). */
export function listOf<T>(count: number, build: (position: number) => T): T[] {
  return Array.from({ length: count }, (_value, position) => build(position));
}
