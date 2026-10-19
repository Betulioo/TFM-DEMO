// Tipos de dominio. No conocen Azure DevOps: los adaptadores traducen a estos tipos.
// Términos según docs/glosario.md.

export interface User {
  id: string;
  displayName: string;
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
}
