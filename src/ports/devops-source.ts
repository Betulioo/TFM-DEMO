import type { Iteration, PullRequest, Team, User, WorkItem } from "../domain/types.js";

/**
 * Puerto de lectura: lo que la recogida necesita de Azure DevOps.
 * Implementaciones: adapters/azdo/azdo-source.ts (API real) y adapters/fixtures/fixture-source.ts (datos falsos).
 */
export interface DevOpsSource {
  /** El usuario del token. */
  currentUser(): Promise<User>;
  /** PRs activas (borradores incluidos) donde el usuario es revisor. */
  pullRequestsToReview(): Promise<PullRequest[]>;
  /** Equipos del proyecto de los que el usuario es miembro. */
  myTeams(): Promise<Team[]>;
  /** PRs activas (borradores incluidos) donde el equipo es revisor. */
  pullRequestsToReviewByTeam(teamId: string): Promise<PullRequest[]>;
  /** PRs activas (borradores incluidos) creadas por el usuario. */
  myPullRequests(): Promise<PullRequest[]>;
  /** Una PR por ID en cualquier estado, o `undefined` si no existe. */
  pullRequestById(id: number): Promise<PullRequest | undefined>;
  /** Iteración actual del equipo por defecto, o `undefined` si hoy no hay ninguna. */
  currentIteration(): Promise<Iteration | undefined>;
  /** Todos los work items de una iteración, de cualquier tipo, asignados o no. Filtrar es cosa del dominio. */
  workItemsInIteration(iterationId: string): Promise<WorkItem[]>;
}
