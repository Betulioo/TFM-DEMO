// Tipos de dominio. No conocen Azure DevOps: los adaptadores traducen a estos tipos.
// Términos según docs/glosario.md.

export interface User {
  id: string;
  displayName: string;
}

/**
 * Equipo del proyecto. Su `id` es el de su identidad (comprobado en la demo). Que sea el mismo `id` que aparece
 * cuando el equipo es revisor de una PR está sin comprobar: en la demo ninguna PR tiene un equipo como revisor.
 */
export interface Team {
  id: string;
  name: string;
}

/** Voto de revisor: 10 aprobada, 5 aprobada con sugerencias, 0 sin voto, -5 esperando al autor, -10 rechazada. */
export type Vote = -10 | -5 | 0 | 5 | 10;

export interface Reviewer extends User {
  vote: Vote;
}

export type PullRequestStatus = "active" | "completed" | "abandoned";

export interface PullRequest {
  id: number;
  title: string;
  status: PullRequestStatus;
  isDraft: boolean;
  author: User;
  /** Fecha ISO 8601. */
  createdAt: string;
  /** Nombre de la rama de origen sin `refs/heads/`, p. ej. `feat/123_tarea`. */
  sourceBranch: string;
  reviewers: Reviewer[];
  /** URL para abrirla en el navegador; la pone el adaptador. */
  webUrl: string;
}

/** Categoría de estado: común a todos los procesos (Basic, Agile, Scrum, personalizados). */
export type StateCategory = "Proposed" | "InProgress" | "Resolved" | "Completed" | "Removed";

export interface Iteration {
  id: string;
  name: string;
  /** Fechas ISO 8601, o `undefined` si la iteración no tiene fechas. */
  startDate?: string;
  finishDate?: string;
}

export interface WorkItem {
  id: number;
  title: string;
  /** Tipo tal cual lo define el proceso ("Task", "Bug desarrollo"…). No se usa para filtrar. */
  type: string;
  state: string;
  stateCategory: StateCategory;
  assignedTo?: User;
  /** Última modificación, ISO 8601. */
  changedAt: string;
  /** IDs de las PRs vinculadas (enlaces de tipo "Pull Request"). */
  pullRequestIds: number[];
  /** Etiquetas (`System.Tags`), una por elemento. */
  tags: string[];
  /** Motivo del bloqueo (campo `LOCK_REASON_FIELD`); `undefined` si no está configurado o viene vacío. */
  lockReason?: string;
  /** URL para abrirlo en el navegador; la pone el adaptador. */
  webUrl: string;
}

/** Siguiente paso de una tarea con PR, tal cual lo nombra el glosario. */
export type NextStep =
  | "Cerrar la tarea"
  | "PR en borrador"
  | "Completar la PR"
  | "Atender cambios solicitados"
  | "Esperar revisión"
  | "Revisar estado";

/** Umbrales en días naturales (glosario: "PR envejecida" y "Tarea estancada"). */
export interface Thresholds {
  agedPrDays: number;
  staleTaskDays: number;
}

/** Qué marca una tarea bloqueada (glosario): la etiqueta (`BLOCKED_TAG`) o el estado (`BLOCKED_STATE`). */
export interface BlockedTaskCriteria {
  tag: string;
  state: string;
}

/** PR del snapshot con las señales del glosario ya calculadas. */
export type SnapshotPullRequest = PullRequest & { aged: boolean; blocked: boolean; approved: boolean };

/** Una de "Mis tareas" con su PR (`null` si no tiene), su siguiente paso y si es una tarea estancada o bloqueada. */
export type SnapshotTask = WorkItem & {
  pullRequest: SnapshotPullRequest | null;
  nextStep: NextStep | null;
  stale: boolean;
  blocked: boolean;
};

/**
 * Lo que la recogida escribe en `output/snapshot.json` y la skill de síntesis interpreta. "Sin datos" es `null` o
 * un campo ausente: los opcionales (`startDate`, `finishDate`, `assignedTo`, `lockReason`) no aparecen en el JSON si
 * faltan.
 */
export interface Snapshot {
  /** Fecha ISO 8601 de la recogida: el "ahora" de todas las reglas. */
  generatedAt: string;
  thresholds: Thresholds;
  blockedTaskCriteria: BlockedTaskCriteria;
  user: User;
  teams: Team[];
  iteration: Iteration | null;
  myTasks: SnapshotTask[];
  pullRequestsPendingMyReview: SnapshotPullRequest[];
  pullRequestsPendingTeamReview: SnapshotPullRequest[];
  myPullRequests: SnapshotPullRequest[];
}
