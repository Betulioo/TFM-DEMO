// Recogida: cómo junta lo que da el puerto (sin duplicados, PR de cada tarea, sin iteración) según el glosario.
// Los casos A–O se comprueban en scripts/lib/tests/snapshot-check.test.ts.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectSnapshot } from "../collect-snapshot.js";
import type { Iteration, PullRequest, Reviewer, Team, User, WorkItem } from "../../domain/types.js";
import type { DevOpsSource } from "../../ports/devops-source.js";
import { NOW_ISO } from "#test-helpers/test-data.js";

const NOW = new Date(NOW_ISO);
const THRESHOLDS = { agedPrDays: 3, staleTaskDays: 3 };
const CURRENT_USER: User = { id: "me", displayName: "Yo" };
const TEAMMATE: User = { id: "teammate", displayName: "Compañero" };
const TEAM: Team = { id: "team", name: "Equipo" };
const OTHER_TEAM: Team = { id: "other-team", name: "Otro equipo" };
const ITERATION: Iteration = { id: "sprint", name: "Sprint" };

interface FakeData {
  teams?: Team[];
  toReview?: PullRequest[];
  byTeam?: Record<string, PullRequest[]>;
  mine?: PullRequest[];
  byId?: PullRequest[];
  iteration?: Iteration;
  workItems?: WorkItem[];
}

/** Fuente falsa: devuelve lo que se le da, sin filtrar. Filtrar es cosa de las reglas. */
function fakeSource(data: FakeData): DevOpsSource {
  return {
    async currentUser() {
      return CURRENT_USER;
    },
    async pullRequestsToReview() {
      return data.toReview ?? [];
    },
    async myTeams() {
      return data.teams ?? [];
    },
    async pullRequestsToReviewByTeam(teamId: string) {
      return data.byTeam?.[teamId] ?? [];
    },
    async myPullRequests() {
      return data.mine ?? [];
    },
    async pullRequestById(id: number) {
      return data.byId?.find((pullRequest) => pullRequest.id === id);
    },
    async currentIteration() {
      return data.iteration;
    },
    async workItemsInIteration() {
      return data.workItems ?? [];
    },
  };
}

function buildPullRequest(id: number, overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    id,
    title: `PR ${id}`,
    status: "active",
    isDraft: false,
    author: TEAMMATE,
    createdAt: NOW_ISO,
    sourceBranch: `feat/${id}`,
    reviewers: [],
    ...overrides,
  };
}

function buildMyTask(id: number, pullRequestIds: number[]): WorkItem {
  return {
    id,
    title: `WI ${id}`,
    type: "Task",
    state: "Active",
    stateCategory: "InProgress",
    assignedTo: CURRENT_USER,
    changedAt: NOW_ISO,
    pullRequestIds,
  };
}

/** Revisor sin voto: el usuario o un equipo (un equipo revisor lleva su `id` y su nombre). */
const reviewer = (identity: User | Team): Reviewer => ({
  id: identity.id,
  displayName: "displayName" in identity ? identity.displayName : identity.name,
  vote: 0,
});
const ids = (items: { id: number }[]) => items.map((item) => item.id);

describe("Recogida: PRs pendientes sin duplicados", () => {
  it("una PR que llega como mía y por mi equipo sale una vez, como pendiente de mi revisión", async () => {
    const both = buildPullRequest(7, { reviewers: [reviewer(CURRENT_USER), reviewer(TEAM)] });
    const source = fakeSource({ teams: [TEAM], toReview: [both], byTeam: { [TEAM.id]: [both] } });

    const result = await collectSnapshot(source, NOW, THRESHOLDS);

    assert.deepEqual(ids(result.pullRequestsPendingMyReview), [7]);
    assert.deepEqual(ids(result.pullRequestsPendingTeamReview), []);
  });

  it("una PR de dos de mis equipos sale una vez como pendiente del equipo", async () => {
    const shared = buildPullRequest(8, { reviewers: [reviewer(TEAM), reviewer(OTHER_TEAM)] });
    const source = fakeSource({ teams: [TEAM, OTHER_TEAM], byTeam: { [TEAM.id]: [shared], [OTHER_TEAM.id]: [shared] } });

    const result = await collectSnapshot(source, NOW, THRESHOLDS);

    assert.deepEqual(ids(result.pullRequestsPendingTeamReview), [8]);
  });
});

describe("Recogida: PR de una tarea", () => {
  it("con varias PRs vinculadas cuenta la de mayor ID", async () => {
    const older = buildPullRequest(3, { author: CURRENT_USER, status: "completed" });
    const newer = buildPullRequest(9, { author: CURRENT_USER });
    const source = fakeSource({ iteration: ITERATION, workItems: [buildMyTask(100, [3, 9])], byId: [older, newer] });

    const result = await collectSnapshot(source, NOW, THRESHOLDS);

    assert.equal(result.myTasks[0]?.pullRequest?.id, 9);
    assert.equal(result.myTasks[0]?.nextStep, "Esperar revisión");
  });

  it("una PR vinculada que no se encuentra se ignora: la tarea queda sin PR ni siguiente paso", async () => {
    const source = fakeSource({ iteration: ITERATION, workItems: [buildMyTask(100, [404])] });

    const result = await collectSnapshot(source, NOW, THRESHOLDS);

    assert.equal(result.myTasks[0]?.pullRequest, null);
    assert.equal(result.myTasks[0]?.nextStep, null);
  });
});

describe("Recogida: iteración actual y mis PRs", () => {
  it("sin iteración actual: iteración null y ninguna tarea", async () => {
    const source = fakeSource({ workItems: [buildMyTask(100, [])] });

    const result = await collectSnapshot(source, NOW, THRESHOLDS);

    assert.equal(result.iteration, null);
    assert.deepEqual(result.myTasks, []);
  });

  it("mis PRs: una PR en borrador no aparece (no es PR activa)", async () => {
    const active = buildPullRequest(1, { author: CURRENT_USER });
    const draft = buildPullRequest(2, { author: CURRENT_USER, isDraft: true });
    const source = fakeSource({ mine: [active, draft] });

    const result = await collectSnapshot(source, NOW, THRESHOLDS);

    assert.deepEqual(ids(result.myPullRequests), [1]);
  });
});
