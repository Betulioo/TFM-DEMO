import type { PullRequest, User } from "../domain/types.js";

/**
 * Puerto de lectura: lo que la recogida necesita de Azure DevOps.
 * Implementaciones: adapters/azdo/azdo-source.ts (API real) y adapters/fixtures/fixture-source.ts (datos falsos).
 * Los work items y las ramas se añaden en los pasos 5 y 6.
 */
export interface DevOpsSource {
  /** El usuario del token. */
  currentUser(): Promise<User>;
  /** PRs activas (borradores incluidos) donde el usuario es revisor. */
  pullRequestsToReview(): Promise<PullRequest[]>;
  /** PRs activas (borradores incluidos) creadas por el usuario. */
  myPullRequests(): Promise<PullRequest[]>;
  /** Una PR por ID en cualquier estado, o `undefined` si no existe. */
  pullRequestById(id: number): Promise<PullRequest | undefined>;
}
