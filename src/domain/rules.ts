// Reglas del glosario (docs/glosario.md) como funciones puras. Se completan en el paso 6.
import { hasElapsedDays } from "./dates.js";
import type { NextStep, PullRequest, StateCategory, Team, User, Vote, WorkItem } from "./types.js";

const CLOSED_CATEGORIES: ReadonlySet<StateCategory> = new Set(["Completed", "Removed"]);
const NEGATIVE_VOTES: ReadonlySet<Vote> = new Set([-5, -10]);
const POSITIVE_VOTES: ReadonlySet<Vote> = new Set([5, 10]);
const NO_VOTE: Vote = 0;

/**
 * Mis tareas: work items de cualquier tipo, en la iteración actual, asignados al usuario y cuya categoría
 * de estado no es Completed ni Removed. Recibe ya los work items de la iteración actual.
 */
export function myTasks(iterationWorkItems: WorkItem[], user: User): WorkItem[] {
  return iterationWorkItems.filter(
    (workItem) => workItem.assignedTo?.id === user.id && !CLOSED_CATEGORIES.has(workItem.stateCategory),
  );
}

/** PR activa: estado active. Las PR en borrador no cuentan para nada del informe. */
export function isActive(pullRequest: PullRequest): boolean {
  return pullRequest.status === "active" && !pullRequest.isDraft;
}

/** PR pendiente de mi revisión: PR activa en la que el usuario es revisor, no es el autor y su voto es 0. */
export function isPendingMyReview(pullRequest: PullRequest, user: User): boolean {
  const myReview = pullRequest.reviewers.find((reviewer) => reviewer.id === user.id);
  return isActive(pullRequest) && pullRequest.author.id !== user.id && myReview?.vote === NO_VOTE;
}

/**
 * PR pendiente del equipo: PR activa en la que uno de mis equipos es revisor, el usuario no es el autor y no
 * figura como revisor individual. Si figura con voto 0 ya es "pendiente de mi revisión"; si votó, ya la revisó.
 */
export function isPendingTeamReview(pullRequest: PullRequest, user: User, myTeams: Team[]): boolean {
  const myTeamIds = new Set(myTeams.map((team) => team.id));
  return (
    isActive(pullRequest) &&
    pullRequest.author.id !== user.id &&
    pullRequest.reviewers.some((reviewer) => myTeamIds.has(reviewer.id)) &&
    !pullRequest.reviewers.some((reviewer) => reviewer.id === user.id)
  );
}

function hasVoteIn(pullRequest: PullRequest, votes: ReadonlySet<Vote>): boolean {
  return pullRequest.reviewers.some((reviewer) => votes.has(reviewer.vote));
}

/** PR bloqueada: PR activa con al menos un voto -5 o -10. */
export function isBlocked(pullRequest: PullRequest): boolean {
  return isActive(pullRequest) && hasVoteIn(pullRequest, NEGATIVE_VOTES);
}

/** PR aprobada: PR activa con al menos un voto 5 o 10 y ningún voto negativo. */
export function isApproved(pullRequest: PullRequest): boolean {
  return isActive(pullRequest) && hasVoteIn(pullRequest, POSITIVE_VOTES) && !hasVoteIn(pullRequest, NEGATIVE_VOTES);
}

/** PR envejecida: PR activa creada hace `agedPrDays` días naturales o más (cómo se cuentan: `dates.ts`). */
export function isAged(pullRequest: PullRequest, now: Date, agedPrDays: number): boolean {
  return isActive(pullRequest) && hasElapsedDays(pullRequest.createdAt, now, agedPrDays);
}

/** PR de una tarea: de las PRs vinculadas, la más reciente, que es la de mayor ID. `undefined` si no tiene. */
export function taskPullRequestId(workItem: WorkItem): number | undefined {
  return workItem.pullRequestIds.length === 0 ? undefined : Math.max(...workItem.pullRequestIds);
}

/** PR activa sin votos: ningún revisor ha votado (o no tiene revisores). */
function hasNoVotes(pullRequest: PullRequest): boolean {
  return isActive(pullRequest) && pullRequest.reviewers.every((reviewer) => reviewer.vote === NO_VOTE);
}

/** Tarea estancada: categoría InProgress y última modificación hace `staleTaskDays` días naturales o más. */
export function isStale(workItem: WorkItem, now: Date, staleTaskDays: number): boolean {
  return workItem.stateCategory === "InProgress" && hasElapsedDays(workItem.changedAt, now, staleTaskDays);
}

/**
 * Siguiente paso de una tarea según su PR (la elige la vinculación). Las reglas se evalúan en el orden del
 * glosario y gana la primera que se cumple. Una tarea sin PR no tiene siguiente paso.
 */
export function nextStep(taskPullRequest: PullRequest | undefined): NextStep | null {
  if (taskPullRequest === undefined) return null;
  if (taskPullRequest.status === "completed") return "Cerrar la tarea";
  if (isApproved(taskPullRequest)) return "Completar la PR";
  if (isBlocked(taskPullRequest)) return "Atender cambios solicitados";
  if (hasNoVotes(taskPullRequest)) return "Esperar revisión";
  return "Revisar estado";
}
