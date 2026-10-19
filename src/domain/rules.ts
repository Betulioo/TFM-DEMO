// Reglas del glosario (docs/glosario.md) como funciones puras. Se completan en el paso 6.
import type { StateCategory, User, WorkItem } from "./types.js";

const CLOSED_CATEGORIES: ReadonlySet<StateCategory> = new Set(["Completed", "Removed"]);

/**
 * Mis tareas: work items de cualquier tipo, en la iteración actual, asignados al usuario y cuya categoría
 * de estado no es Completed ni Removed. Recibe ya los work items de la iteración actual.
 */
export function myTasks(iterationWorkItems: WorkItem[], user: User): WorkItem[] {
  return iterationWorkItems.filter(
    (workItem) => workItem.assignedTo?.id === user.id && !CLOSED_CATEGORIES.has(workItem.stateCategory),
  );
}
