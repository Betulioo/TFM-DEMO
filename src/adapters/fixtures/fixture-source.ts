// Adaptador falso: construye los datos a partir de los casos de fixtures/expected.json,
// con fechas relativas a `now`. Así hay una sola lista de casos (la misma que usa el seed)
// y se pueden probar los casos de fechas (M, N) que la demo real no permite crear.
import type { Iteration, PullRequest, StateCategory, User, WorkItem } from "../../domain/types.js";
import { loadCases, type Case, type WorkItemSetup } from "./cases.js";
import type { DevOpsSource } from "../../ports/devops-source.js";

const DAY_MS = 86_400_000;

export const FIXTURE_ME: User = { id: "fixture-me", displayName: "Yo (fixture)" };
export const FIXTURE_TEAMMATE: User = { id: "fixture-teammate", displayName: "Compañero (fixture)" };

/** IDs deterministas por posición del caso: PR #1, #2… y WI #101, #102… */
export function fixturePullRequestId(index: number): number {
  return index + 1;
}
export function fixtureWorkItemId(index: number): number {
  return index + 101;
}

export const FIXTURE_ITERATIONS: Record<WorkItemSetup["iteration"], Iteration> = {
  current: { id: "fixture-current", name: "Sprint actual" },
  previous: { id: "fixture-previous", name: "Sprint anterior" },
};

/**
 * Categorías del proceso Agile para los estados que usan los casos. El adaptador real no las fija:
 * las lee de la API, porque cambian según el proceso y el tipo de work item.
 */
const AGILE_CATEGORIES: Record<string, StateCategory> = {
  New: "Proposed",
  Active: "InProgress",
  Resolved: "Resolved",
  Closed: "Completed",
  Removed: "Removed",
};

export class FixtureSource implements DevOpsSource {
  private readonly pullRequests: PullRequest[];
  private readonly workItems: { iterationId: string; workItem: WorkItem }[];

  constructor(cases: Case[], now: Date) {
    this.pullRequests = cases.flatMap((c, index) => {
      const pr = toPullRequest(c, index, now);
      return pr ? [pr] : [];
    });
    this.workItems = cases.flatMap((c, index) =>
      c.setup.entity === "workItem"
        ? [{ iterationId: FIXTURE_ITERATIONS[c.setup.iteration].id, workItem: toWorkItem(c.setup, index, now) }]
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
    return this.pullRequests.filter((pr) => pr.status === "active" && pr.reviewers.some((r) => r.id === FIXTURE_ME.id));
  }

  async myPullRequests(): Promise<PullRequest[]> {
    return this.pullRequests.filter((pr) => pr.status === "active" && pr.author.id === FIXTURE_ME.id);
  }

  async pullRequestById(id: number): Promise<PullRequest | undefined> {
    return this.pullRequests.find((pr) => pr.id === id);
  }

  async currentIteration(): Promise<Iteration | undefined> {
    return FIXTURE_ITERATIONS.current;
  }

  async workItemsInIteration(iterationId: string): Promise<WorkItem[]> {
    return this.workItems.filter((w) => w.iterationId === iterationId).map((w) => w.workItem);
  }
}

function toWorkItem(s: WorkItemSetup, index: number, now: Date): WorkItem {
  const category = AGILE_CATEGORIES[s.state];
  if (!category) throw new Error(`Estado "${s.state}" sin categoría en el adaptador falso.`);
  return {
    id: fixtureWorkItemId(index),
    title: s.title,
    type: s.type,
    state: s.state,
    stateCategory: category,
    assignedTo: s.assignedToMe ? FIXTURE_ME : undefined,
    changedAt: new Date(now.getTime() - (s.changedDaysAgo ?? 0) * DAY_MS).toISOString(),
    pullRequestIds: s.pr ? [fixturePullRequestId(index)] : [],
  };
}

function toPullRequest(c: Case, index: number, now: Date): PullRequest | undefined {
  const s = c.setup;
  const id = fixturePullRequestId(index);

  if (s.entity === "pullRequest") {
    // PR de un compañero en la que el usuario es revisor.
    return {
      id,
      title: s.title,
      status: "active",
      isDraft: false,
      author: FIXTURE_TEAMMATE,
      createdAt: new Date(now.getTime() - (s.createdDaysAgo ?? 0) * DAY_MS).toISOString(),
      sourceBranch: `feat/revision-${c.key.toLowerCase()}`,
      reviewers: [{ ...FIXTURE_ME, vote: s.myVote }],
    };
  }

  if (!s.pr) return undefined;
  // PR propia de una tarea; el revisor es el compañero (si hay voto).
  return {
    id,
    title: s.title,
    status: s.pr.status,
    isDraft: false,
    author: FIXTURE_ME,
    createdAt: now.toISOString(),
    sourceBranch: `feat/${fixtureWorkItemId(index)}_${c.key.toLowerCase()}`,
    reviewers: s.pr.vote === null ? [] : [{ ...FIXTURE_TEAMMATE, vote: s.pr.vote }],
  };
}
