// Adaptador falso: construye los datos a partir de los casos de fixtures/expected.json,
// con fechas relativas a `now`. Así hay una sola lista de casos (la misma que usa el seed)
// y se pueden probar los casos de fechas (M, N) que la demo real no permite crear.
import type { Iteration, PullRequest, Reviewer, StateCategory, Team, User, WorkItem } from "../../domain/types.js";
import { loadCases, type Case, type PullRequestSetup, type WorkItemSetup } from "./cases.js";
import type { DevOpsSource } from "../../ports/devops-source.js";
import { daysBefore } from "../../domain/dates.js";


export const FIXTURE_ME: User = { id: "fixture-me", displayName: "Yo (fixture)" };
export const FIXTURE_TEAMMATE: User = { id: "fixture-teammate", displayName: "Compañero (fixture)" };
export const FIXTURE_TEAM: Team = { id: "fixture-team", name: "Equipo (fixture)" };
/** Dominio `.invalid` (reservado): los enlaces de fixtures nunca apuntan a nada real. */
const FIXTURE_WEB_BASE_URL = "https://fixture.invalid/proyecto";
const FIXTURE_REPOSITORY = "repositorio";

/** IDs deterministas por posición del caso: PR #1, #2… y WI #101, #102… */
export function fixturePullRequestId(index: number): number {
  return index + 1;
}
export function fixtureWorkItemId(index: number): number {
  return index + 101;
}

/** IDs con los que aparece un caso: su work item (si es una tarea) y su PR (si es una PR o la tarea tiene una). */
export function fixtureCaseIds(testCase: Case, index: number): { workItemId?: number; pullRequestId?: number } {
  const setup = testCase.setup;
  const hasPullRequest = setup.entity === "pullRequest" || setup.pr !== null;
  return {
    workItemId: setup.entity === "workItem" ? fixtureWorkItemId(index) : undefined,
    pullRequestId: hasPullRequest ? fixturePullRequestId(index) : undefined,
  };
}

export const FIXTURE_ITERATIONS: Record<WorkItemSetup["iteration"], Iteration> = {
  current: { id: "fixture-current", name: "Sprint actual" },
  previous: { id: "fixture-previous", name: "Sprint anterior" },
};

/**
 * Categorías de los estados que usan los casos: los del proceso Agile y `Locked`. El adaptador real no las fija:
 * las lee de la API, porque cambian según el proceso y el tipo de work item.
 */
const STATE_CATEGORIES: Record<string, StateCategory> = {
  New: "Proposed",
  Active: "InProgress",
  Resolved: "Resolved",
  Closed: "Completed",
  Removed: "Removed",
  // Estado del proceso del cliente (glosario: "Tarea bloqueada"). Su categoría allí no está comprobada.
  Locked: "InProgress",
};

export class FixtureSource implements DevOpsSource {
  private readonly pullRequests: PullRequest[];
  private readonly workItems: { iterationId: string; workItem: WorkItem }[];

  constructor(cases: Case[], now: Date) {
    this.pullRequests = cases.flatMap((testCase, index) => {
      const pullRequest = toPullRequest(testCase, index, now);
      return pullRequest ? [pullRequest] : [];
    });
    this.workItems = cases.flatMap((testCase, index) =>
      testCase.setup.entity === "workItem"
        ? [{ iterationId: FIXTURE_ITERATIONS[testCase.setup.iteration].id, workItem: toWorkItem(testCase, testCase.setup, index, now) }]
        : [],
    );
  }

  static fromFile(now: Date, path?: string): FixtureSource {
    return new FixtureSource(loadCases(path), now);
  }

  async currentUser(): Promise<User> {
    return FIXTURE_ME;
  }

  async pullRequestsToReview(): Promise<PullRequest[]> {
    return this.pullRequests.filter(
      (pullRequest) => pullRequest.status === "active" && pullRequest.reviewers.some((reviewer) => reviewer.id === FIXTURE_ME.id),
    );
  }

  async myTeams(): Promise<Team[]> {
    return [FIXTURE_TEAM];
  }

  async pullRequestsToReviewByTeam(teamId: string): Promise<PullRequest[]> {
    return this.pullRequests.filter(
      (pullRequest) => pullRequest.status === "active" && pullRequest.reviewers.some((reviewer) => reviewer.id === teamId),
    );
  }

  async myPullRequests(): Promise<PullRequest[]> {
    return this.pullRequests.filter((pullRequest) => pullRequest.status === "active" && pullRequest.author.id === FIXTURE_ME.id);
  }

  async pullRequestById(id: number): Promise<PullRequest | undefined> {
    return this.pullRequests.find((pullRequest) => pullRequest.id === id);
  }

  async currentIteration(): Promise<Iteration | undefined> {
    return FIXTURE_ITERATIONS.current;
  }

  async workItemsInIteration(iterationId: string): Promise<WorkItem[]> {
    return this.workItems.filter((entry) => entry.iterationId === iterationId).map((entry) => entry.workItem);
  }
}

function toWorkItem(testCase: Case, setup: WorkItemSetup, index: number, now: Date): WorkItem {
  const category = STATE_CATEGORIES[setup.state];
  if (!category) throw new Error(`Estado "${setup.state}" sin categoría en el adaptador falso.`);
  const { pullRequestId } = fixtureCaseIds(testCase, index);
  return {
    id: fixtureWorkItemId(index),
    title: setup.title,
    type: setup.type,
    state: setup.state,
    stateCategory: category,
    assignedTo: setup.assignedToMe ? FIXTURE_ME : undefined,
    changedAt: daysBefore(now, setup.changedDaysAgo ?? 0),
    pullRequestIds: pullRequestId === undefined ? [] : [pullRequestId],
    tags: setup.tags ?? [],
    lockReason: setup.lockReason,
    webUrl: `${FIXTURE_WEB_BASE_URL}/_workitems/edit/${fixtureWorkItemId(index)}`,
  };
}

function fixturePullRequestUrl(id: number): string {
  return `${FIXTURE_WEB_BASE_URL}/_git/${FIXTURE_REPOSITORY}/pullrequest/${id}`;
}

function toPullRequest(testCase: Case, index: number, now: Date): PullRequest | undefined {
  const setup = testCase.setup;
  const id = fixturePullRequestId(index);

  if (setup.entity === "pullRequest") {
    // PR de un compañero en la que el usuario, o su equipo, es revisor.
    return {
      id,
      title: setup.title,
      status: "active",
      isDraft: false,
      author: FIXTURE_TEAMMATE,
      createdAt: daysBefore(now, setup.createdDaysAgo ?? 0),
      sourceBranch: `feat/revision-${testCase.key.toLowerCase()}`,
      reviewers: reviewersFor(setup),
      webUrl: fixturePullRequestUrl(id),
    };
  }

  if (!setup.pr) return undefined;
  // PR propia de una tarea; el revisor es el compañero (si hay voto).
  return {
    id,
    title: setup.title,
    status: setup.pr.status,
    isDraft: false,
    author: FIXTURE_ME,
    createdAt: now.toISOString(),
    sourceBranch: `feat/${fixtureWorkItemId(index)}_${testCase.key.toLowerCase()}`,
    reviewers: setup.pr.vote === null ? [] : [{ ...FIXTURE_TEAMMATE, vote: setup.pr.vote }],
    webUrl: fixturePullRequestUrl(id),
  };
}

/** Revisor de una PR del compañero: el equipo (sin voto) o el usuario con `myVote`. */
function reviewersFor(setup: PullRequestSetup): Reviewer[] {
  if (setup.reviewer === "myTeam") return [{ id: FIXTURE_TEAM.id, displayName: FIXTURE_TEAM.name, vote: 0 }];
  return [{ ...FIXTURE_ME, vote: setup.myVote }];
}
