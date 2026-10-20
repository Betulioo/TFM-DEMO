import { test } from "node:test";
import assert from "node:assert/strict";
import { isAged, isApproved, isBlocked, isPendingMyReview, isPendingTeamReview, myTasks } from "../src/domain/rules.js";
import type { PullRequest, PullRequestStatus, StateCategory, User, Vote, WorkItem } from "../src/domain/types.js";

const CURRENT_USER = { id: "me", displayName: "Yo" };
const OTHER_USER = { id: "other", displayName: "Otra" };
const THIRD_USER = { id: "third", displayName: "Tercera" };
const MY_TEAM = { id: "my-team", name: "Mi equipo" };
const OTHER_TEAM = { id: "other-team", name: "Otro equipo" };
const MY_TEAM_REVIEWER = { id: MY_TEAM.id, displayName: MY_TEAM.name };
const NOW = new Date("2026-10-19T09:00:00Z");
const AGED_PR_DAYS = 3;

function buildWorkItem(id: number, stateCategory: StateCategory, assignedTo = CURRENT_USER, type = "Task"): WorkItem {
  return { id, title: `WI ${id}`, type, state: "x", stateCategory, assignedTo, changedAt: "2026-10-19T00:00:00Z", pullRequestIds: [] };
}

const ids = (workItems: WorkItem[]) => workItems.map((workItem) => workItem.id);

test("mis tareas: asignadas a mí y no cerradas", () => {
  const workItems = [
    buildWorkItem(1, "Proposed"),
    buildWorkItem(2, "InProgress"),
    buildWorkItem(3, "Resolved"),
    buildWorkItem(4, "Completed"),
    buildWorkItem(5, "Removed"),
    buildWorkItem(6, "InProgress", OTHER_USER),
  ];

  assert.deepEqual(ids(myTasks(workItems, CURRENT_USER)), [1, 2, 3]);
});

test("mis tareas: sin asignar no cuenta", () => {
  const unassigned: WorkItem = { ...buildWorkItem(7, "Proposed"), assignedTo: undefined };

  assert.deepEqual(myTasks([unassigned], CURRENT_USER), []);
});

test("mis tareas: el tipo no filtra (procesos personalizados)", () => {
  const workItems = [buildWorkItem(8, "InProgress", CURRENT_USER, "Bug desarrollo"), buildWorkItem(9, "InProgress", CURRENT_USER, "Epic")];

  assert.deepEqual(ids(myTasks(workItems, CURRENT_USER)), [8, 9]);
});

interface PullRequestOptions {
  author?: User;
  status?: PullRequestStatus;
  isDraft?: boolean;
  createdAt?: string;
  votes?: [User, Vote][];
}

function buildPullRequest({ author = OTHER_USER, status = "active", isDraft = false, createdAt = "2026-10-19T08:00:00Z", votes = [] }: PullRequestOptions = {}): PullRequest {
  const reviewers = votes.map(([reviewer, vote]) => ({ ...reviewer, vote }));
  return { id: 1, title: "PR 1", status, isDraft, author, createdAt, sourceBranch: "feat/1_tarea", reviewers };
}

test("PR pendiente de mi revisión: soy revisor, no autor y mi voto es 0 (caso K)", () => {
  assert.equal(isPendingMyReview(buildPullRequest({ votes: [[CURRENT_USER, 0]] }), CURRENT_USER), true);
});

test("PR pendiente de mi revisión: si ya voté no cuenta (caso L)", () => {
  for (const vote of [10, 5, -5, -10] as const) {
    assert.equal(isPendingMyReview(buildPullRequest({ votes: [[CURRENT_USER, vote]] }), CURRENT_USER), false, `voto ${vote}`);
  }
});

test("PR pendiente de mi revisión: si soy el autor no cuenta (casos D, E y F)", () => {
  const myPullRequest = buildPullRequest({ author: CURRENT_USER, votes: [[CURRENT_USER, 0]] });

  assert.equal(isPendingMyReview(myPullRequest, CURRENT_USER), false);
});

test("PR pendiente de mi revisión: si no soy revisor no cuenta", () => {
  assert.equal(isPendingMyReview(buildPullRequest({ votes: [[THIRD_USER, 0]] }), CURRENT_USER), false);
});

test("PR pendiente de mi revisión: solo PR activa (ni borrador, ni completada, ni abandonada)", () => {
  const votes: [User, Vote][] = [[CURRENT_USER, 0]];
  const notActive = [
    buildPullRequest({ votes, isDraft: true }),
    buildPullRequest({ votes, status: "completed" }),
    buildPullRequest({ votes, status: "abandoned" }),
  ];

  assert.deepEqual(notActive.map((pullRequest) => isPendingMyReview(pullRequest, CURRENT_USER)), [false, false, false]);
});

test("PR bloqueada: al menos un voto -5 o -10 (caso E)", () => {
  assert.equal(isBlocked(buildPullRequest({ votes: [[THIRD_USER, -5]] })), true);
  assert.equal(isBlocked(buildPullRequest({ votes: [[THIRD_USER, 10], [CURRENT_USER, -10]] })), true);
});

test("PR bloqueada: sin votos negativos no lo está", () => {
  assert.equal(isBlocked(buildPullRequest({ votes: [[THIRD_USER, 10], [CURRENT_USER, 0]] })), false);
  assert.equal(isBlocked(buildPullRequest()), false);
});

test("PR bloqueada: un borrador con voto negativo no cuenta", () => {
  assert.equal(isBlocked(buildPullRequest({ isDraft: true, votes: [[THIRD_USER, -10]] })), false);
});

test("PR aprobada: al menos un voto 5 o 10 y ningún negativo (caso F)", () => {
  assert.equal(isApproved(buildPullRequest({ votes: [[THIRD_USER, 10]] })), true);
  assert.equal(isApproved(buildPullRequest({ votes: [[THIRD_USER, 5], [CURRENT_USER, 0]] })), true);
});

test("PR aprobada: un voto negativo la anula", () => {
  assert.equal(isApproved(buildPullRequest({ votes: [[THIRD_USER, 10], [CURRENT_USER, -5]] })), false);
});

test("PR aprobada: sin votos positivos no lo está (caso D)", () => {
  assert.equal(isApproved(buildPullRequest({ votes: [[THIRD_USER, 0]] })), false);
});

test("PR aprobada: una PR completada no cuenta como PR aprobada", () => {
  assert.equal(isApproved(buildPullRequest({ status: "completed", votes: [[THIRD_USER, 10]] })), false);
});

test("PR envejecida: 3 días o más (límite 2, 3 y 4 días; caso M)", () => {
  const createdDaysAgo = (days: number) => buildPullRequest({ createdAt: new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString() });

  assert.deepEqual([2, 3, 4].map((days) => isAged(createdDaysAgo(days), NOW, AGED_PR_DAYS)), [false, true, true]);
});

test("PR envejecida: un minuto antes del umbral aún no lo está", () => {
  const almostAged = buildPullRequest({ createdAt: "2026-10-16T09:01:00Z" });

  assert.equal(isAged(almostAged, NOW, AGED_PR_DAYS), false);
});

test("PR envejecida: el umbral es configurable (AGED_PR_DAYS)", () => {
  const fiveDaysOld = buildPullRequest({ createdAt: "2026-10-14T09:00:00Z" });

  assert.deepEqual([5, 6].map((agedPrDays) => isAged(fiveDaysOld, NOW, agedPrDays)), [true, false]);
});

test("PR envejecida: solo PR activa", () => {
  const oldCompleted = buildPullRequest({ status: "completed", createdAt: "2026-10-01T09:00:00Z" });

  assert.equal(isAged(oldCompleted, NOW, AGED_PR_DAYS), false);
});

test("PR pendiente del equipo: mi equipo es revisor y yo no figuro (caso O)", () => {
  const pullRequest = buildPullRequest({ votes: [[MY_TEAM_REVIEWER, 0]] });

  assert.equal(isPendingTeamReview(pullRequest, CURRENT_USER, [OTHER_TEAM, MY_TEAM]), true);
});

test("PR pendiente del equipo: si figuro como revisor individual no cuenta (ya está en mi revisión o ya voté)", () => {
  for (const vote of [0, 10, -5] as const) {
    const pullRequest = buildPullRequest({ votes: [[MY_TEAM_REVIEWER, 0], [CURRENT_USER, vote]] });
    assert.equal(isPendingTeamReview(pullRequest, CURRENT_USER, [MY_TEAM]), false, `mi voto ${vote}`);
  }
});

test("PR pendiente del equipo: un equipo que no es mío no cuenta", () => {
  const pullRequest = buildPullRequest({ votes: [[{ id: OTHER_TEAM.id, displayName: OTHER_TEAM.name }, 0]] });

  assert.equal(isPendingTeamReview(pullRequest, CURRENT_USER, [MY_TEAM]), false);
});

test("PR pendiente del equipo: si soy el autor no cuenta", () => {
  const pullRequest = buildPullRequest({ author: CURRENT_USER, votes: [[MY_TEAM_REVIEWER, 0]] });

  assert.equal(isPendingTeamReview(pullRequest, CURRENT_USER, [MY_TEAM]), false);
});

test("PR pendiente del equipo: solo PR activa (ni borrador ni completada)", () => {
  const votes: [User, Vote][] = [[MY_TEAM_REVIEWER, 0]];
  const notActive = [buildPullRequest({ votes, isDraft: true }), buildPullRequest({ votes, status: "completed" })];

  assert.deepEqual(notActive.map((pullRequest) => isPendingTeamReview(pullRequest, CURRENT_USER, [MY_TEAM])), [false, false]);
});
