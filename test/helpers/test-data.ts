// Helpers que comparten tests de carpetas distintas (CLAUDE.md, "DRY").

/** "Ahora" fijo de los tests: nunca la hora real (skill tests-semanticos, criterio 3). */
export const NOW = new Date("2026-10-19T09:00:00Z");

/** Lista de `count` elementos construidos a partir de su posición (0, 1, 2…). */
export function listOf<T>(count: number, build: (position: number) => T): T[] {
  return Array.from({ length: count }, (_value, position) => build(position));
}
