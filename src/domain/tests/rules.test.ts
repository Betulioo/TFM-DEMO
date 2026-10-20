// Reglas del glosario (docs/glosario.md): un `describe` por término, en el orden del glosario.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isAged,
  isApproved,
  isBlocked,
  isPendingMyReview,
  isPendingTeamReview,
  isStale,
  myTasks,
  nextStep,
  taskPullRequest,
} from "../rules.js";
import { daysBefore } from "../dates.js";
import { NOW_ISO } from "#test-helpers/test-data.js";
import type { PullRequest, PullRequestStatus, StateCategory, User, Vote, WorkItem } from "../types.js";

const CURRENT_USER = { id: "me", displayName: "Yo" };
const OTHER_USER = { id: "other", displayName: "Otra" };
const THIRD_USER = { id: "third", displayName: "Tercera" };
const MY_TEAM = { id: "my-team", name: "Mi equipo" };
const OTHER_TEAM = { id: "other-team", name: "Otro equipo" };
const MY_TEAM_REVIEWER = { id: MY_TEAM.id, displayName: MY_TEAM.name };
const NOW = new Date(NOW_ISO);
const AGED_PR_DAYS = 3;
const STALE_TASK_DAYS = 3;

interface WorkItemOptions {
  stateCategory?: StateCategory;
  assignedTo?: User;
  type?: string;
  changedAt?: string;
  pullRequestIds?: number[];
}

function buildWorkItem(
  id: number,
  { stateCategory = "InProgress", assignedTo = CURRENT_USER, type = "Task", changedAt = "2026-10-19T00:00:00Z", pullRequestIds = [] }: WorkItemOptions = {},
): WorkItem {
  return { id, title: `WI ${id}`, type, state: "x", stateCategory, assignedTo, changedAt, pullRequestIds };
}

interface PullRequestOptions {
  id?: number;
  author?: User;
  status?: PullRequestStatus;
  isDraft?: boolean;
  createdAt?: string;
  votes?: [User, Vote][];
}

function buildPullRequest({ id = 1, author = OTHER_USER, status = "active", isDraft = false, createdAt = "2026-10-19T08:00:00Z", votes = [] }: PullRequestOptions = {}): PullRequest {
  const reviewers = votes.map(([reviewer, vote]) => ({ ...reviewer, vote }));
  return { id, title: `PR ${id}`, status, isDraft, author, createdAt, sourceBranch: `feat/${id}_tarea`, reviewers };
}

/** Las tres formas de no ser PR activa: borrador, completada y abandonada. */
function notActivePullRequests(votes: [User, Vote][]): PullRequest[] {
  return [buildPullRequest({ votes, isDraft: true }), buildPullRequest({ votes, status: "completed" }), buildPullRequest({ votes, status: "abandoned" })];
}

const ids = (workItems: WorkItem[]) => workItems.map((workItem) => workItem.id);

describe("Mis tareas", () => {
  it("asignadas a mí y no cerradas", () => {
    const workItems = [
      buildWorkItem(1, { stateCategory: "Proposed" }),
      buildWorkItem(2, { stateCategory: "InProgress" }),
      buildWorkItem(3, { stateCategory: "Resolved" }),
      buildWorkItem(4, { stateCategory: "Completed" }),
      buildWorkItem(5, { stateCategory: "Removed" }),
      buildWorkItem(6, { assignedTo: OTHER_USER }),
    ];

    const result = myTasks(workItems, CURRENT_USER);

    assert.deepEqual(ids(result), [1, 2, 3]);
  });

  it("sin asignar no cuenta", () => {
    const unassigned: WorkItem = { ...buildWorkItem(7), assignedTo: undefined };

    const result = myTasks([unassigned], CURRENT_USER);

    assert.deepEqual(result, []);
  });

  it("el tipo no filtra (procesos personalizados)", () => {
    const workItems = [buildWorkItem(8, { type: "Bug desarrollo" }), buildWorkItem(9, { type: "Epic" })];

    const result = myTasks(workItems, CURRENT_USER);

    assert.deepEqual(ids(result), [8, 9]);
  });
});

describe("PR pendiente de mi revisión", () => {
  it("soy revisor, no autor y mi voto es 0 (caso K)", () => {
    const pullRequest = buildPullRequest({ votes: [[CURRENT_USER, 0]] });

    const result = isPendingMyReview(pullRequest, CURRENT_USER);

    assert.equal(result, true);
  });

  it("si ya voté no cuenta (caso L)", () => {
    const votedPullRequests = ([10, 5, -5, -10] as const).map((vote) => buildPullRequest({ votes: [[CURRENT_USER, vote]] }));

    const results = votedPullRequests.map((pullRequest) => isPendingMyReview(pullRequest, CURRENT_USER));

    assert.deepEqual(results, [false, false, false, false]);
  });

  it("si soy el autor no cuenta (casos D, E y F)", () => {
    const myPullRequest = buildPullRequest({ author: CURRENT_USER, votes: [[CURRENT_USER, 0]] });

    const result = isPendingMyReview(myPullRequest, CURRENT_USER);

    assert.equal(result, false);
  });

  it("si no soy revisor no cuenta", () => {
    const pullRequest = buildPullRequest({ votes: [[THIRD_USER, 0]] });

    const result = isPendingMyReview(pullRequest, CURRENT_USER);

    assert.equal(result, false);
  });

  it("solo PR activa (ni borrador, ni completada, ni abandonada)", () => {
    const pullRequests = notActivePullRequests([[CURRENT_USER, 0]]);

    const results = pullRequests.map((pullRequest) => isPendingMyReview(pullRequest, CURRENT_USER));

    assert.deepEqual(results, [false, false, false]);
  });
});

describe("PR pendiente del equipo", () => {
  it("mi equipo es revisor y yo no figuro (caso O)", () => {
    const pullRequest = buildPullRequest({ votes: [[MY_TEAM_REVIEWER, 0]] });

    const result = isPendingTeamReview(pullRequest, CURRENT_USER, [OTHER_TEAM, MY_TEAM]);

    assert.equal(result, true);
  });

  it("si figuro como revisor individual no cuenta (ya está en mi revisión o ya voté)", () => {
    const pullRequests = ([0, 10, -5] as const).map((vote) => buildPullRequest({ votes: [[MY_TEAM_REVIEWER, 0], [CURRENT_USER, vote]] }));

    const results = pullRequests.map((pullRequest) => isPendingTeamReview(pullRequest, CURRENT_USER, [MY_TEAM]));

    assert.deepEqual(results, [false, false, false]);
  });

  it("un equipo que no es mío no cuenta", () => {
    const pullRequest = buildPullRequest({ votes: [[{ id: OTHER_TEAM.id, displayName: OTHER_TEAM.name }, 0]] });

    const result = isPendingTeamReview(pullRequest, CURRENT_USER, [MY_TEAM]);

    assert.equal(result, false);
  });

  it("si soy el autor no cuenta", () => {
    const pullRequest = buildPullRequest({ author: CURRENT_USER, votes: [[MY_TEAM_REVIEWER, 0]] });

    const result = isPendingTeamReview(pullRequest, CURRENT_USER, [MY_TEAM]);

    assert.equal(result, false);
  });

  it("solo PR activa (ni borrador, ni completada, ni abandonada)", () => {
    const pullRequests = notActivePullRequests([[MY_TEAM_REVIEWER, 0]]);

    const results = pullRequests.map((pullRequest) => isPendingTeamReview(pullRequest, CURRENT_USER, [MY_TEAM]));

    assert.deepEqual(results, [false, false, false]);
  });
});

describe("PR bloqueada", () => {
  it("al menos un voto -5 o -10 (caso E)", () => {
    const pullRequests = [buildPullRequest({ votes: [[THIRD_USER, -5]] }), buildPullRequest({ votes: [[THIRD_USER, 10], [CURRENT_USER, -10]] })];

    const results = pullRequests.map(isBlocked);

    assert.deepEqual(results, [true, true]);
  });

  it("sin votos negativos no lo está", () => {
    const pullRequests = [buildPullRequest({ votes: [[THIRD_USER, 10], [CURRENT_USER, 0]] }), buildPullRequest()];

    const results = pullRequests.map(isBlocked);

    assert.deepEqual(results, [false, false]);
  });

  it("un borrador con voto negativo no cuenta", () => {
    const draft = buildPullRequest({ isDraft: true, votes: [[THIRD_USER, -10]] });

    const result = isBlocked(draft);

    assert.equal(result, false);
  });
});

describe("PR aprobada", () => {
  it("al menos un voto 5 o 10 y ningún negativo (caso F)", () => {
    const pullRequests = [buildPullRequest({ votes: [[THIRD_USER, 10]] }), buildPullRequest({ votes: [[THIRD_USER, 5], [CURRENT_USER, 0]] })];

    const results = pullRequests.map(isApproved);

    assert.deepEqual(results, [true, true]);
  });

  it("un voto negativo la anula", () => {
    const pullRequest = buildPullRequest({ votes: [[THIRD_USER, 10], [CURRENT_USER, -5]] });

    const result = isApproved(pullRequest);

    assert.equal(result, false);
  });

  it("sin votos positivos no lo está (caso D)", () => {
    const pullRequest = buildPullRequest({ votes: [[THIRD_USER, 0]] });

    const result = isApproved(pullRequest);

    assert.equal(result, false);
  });

  it("una PR completada no cuenta como PR aprobada", () => {
    const completed = buildPullRequest({ status: "completed", votes: [[THIRD_USER, 10]] });

    const result = isApproved(completed);

    assert.equal(result, false);
  });
});

describe("PR envejecida", () => {
  it("3 días o más (límite 2, 3 y 4 días; caso M)", () => {
    const pullRequests = [2, 3, 4].map((days) => buildPullRequest({ createdAt: daysBefore(NOW, days) }));

    const results = pullRequests.map((pullRequest) => isAged(pullRequest, NOW, AGED_PR_DAYS));

    assert.deepEqual(results, [false, true, true]);
  });

  it("un minuto antes del umbral aún no lo está", () => {
    const almostAged = buildPullRequest({ createdAt: "2026-10-16T09:01:00Z" });

    const result = isAged(almostAged, NOW, AGED_PR_DAYS);

    assert.equal(result, false);
  });

  it("el umbral es configurable (AGED_PR_DAYS)", () => {
    const fiveDaysOld = buildPullRequest({ createdAt: "2026-10-14T09:00:00Z" });

    const results = [5, 6].map((agedPrDays) => isAged(fiveDaysOld, NOW, agedPrDays));

    assert.deepEqual(results, [true, false]);
  });

  it("solo PR activa", () => {
    const oldCompleted = buildPullRequest({ status: "completed", createdAt: "2026-10-01T09:00:00Z" });

    const result = isAged(oldCompleted, NOW, AGED_PR_DAYS);

    assert.equal(result, false);
  });
});

describe("PR de una tarea", () => {
  /** PRs vinculadas ya buscadas: `undefined` es una vinculada que no se encontró. */
  const linked = (...ids: (number | undefined)[]) => ids.map((id) => (id === undefined ? undefined : buildPullRequest({ id })));

  it("con una PR vinculada, esa (casos D–G)", () => {
    const linkedPullRequests = linked(42);

    const result = taskPullRequest(linkedPullRequests);

    assert.equal(result?.id, 42);
  });

  it("con varias, la más reciente (la de mayor ID), en cualquier orden", () => {
    const linkedPullRequests = linked(7, 31, 12);

    const result = taskPullRequest(linkedPullRequests);

    assert.equal(result?.id, 31);
  });

  it("sin PRs vinculadas no tiene (casos A, B, C y N)", () => {
    const linkedPullRequests = linked();

    const result = taskPullRequest(linkedPullRequests);

    assert.equal(result, undefined);
  });

  it("una vinculada que no se encuentra se ignora: cuenta la mayor de las que sí existen", () => {
    const linkedPullRequests = [buildPullRequest({ id: 7 }), undefined, buildPullRequest({ id: 12 })];

    const result = taskPullRequest(linkedPullRequests);

    assert.equal(result?.id, 12);
  });

  it("si no se encuentra ninguna, es como si no tuviera PR", () => {
    const linkedPullRequests = linked(undefined, undefined);

    const result = taskPullRequest(linkedPullRequests);

    assert.equal(result, undefined);
  });
});

describe("Siguiente paso", () => {
  it("una tarea sin PR no tiene (casos A, B, C y N)", () => {
    const taskPullRequest = undefined;

    const result = nextStep(taskPullRequest);

    assert.equal(result, null);
  });

  it("G: PR completada → Cerrar la tarea", () => {
    const completed = buildPullRequest({ status: "completed" });

    const result = nextStep(completed);

    assert.equal(result, "Cerrar la tarea");
  });

  it("F: PR aprobada → Completar la PR", () => {
    const approved = buildPullRequest({ votes: [[THIRD_USER, 10]] });

    const result = nextStep(approved);

    assert.equal(result, "Completar la PR");
  });

  it("E: PR bloqueada → Atender cambios solicitados", () => {
    const blocked = buildPullRequest({ votes: [[THIRD_USER, -5]] });

    const result = nextStep(blocked);

    assert.equal(result, "Atender cambios solicitados");
  });

  it("D: PR activa sin votos → Esperar revisión", () => {
    const pullRequests = [buildPullRequest({ votes: [[THIRD_USER, 0]] }), buildPullRequest()];

    const results = pullRequests.map(nextStep);

    assert.deepEqual(results, ["Esperar revisión", "Esperar revisión"]);
  });

  it("PR en borrador → PR en borrador, tenga o no votos", () => {
    const drafts = [buildPullRequest({ isDraft: true }), buildPullRequest({ isDraft: true, votes: [[THIRD_USER, 10]] })];

    const results = drafts.map(nextStep);

    assert.deepEqual(results, ["PR en borrador", "PR en borrador"]);
  });

  it("PR abandonada → Revisar estado (también si era borrador)", () => {
    const abandoned = [buildPullRequest({ status: "abandoned", votes: [[THIRD_USER, 10]] }), buildPullRequest({ status: "abandoned", isDraft: true })];

    const results = abandoned.map(nextStep);

    assert.deepEqual(results, ["Revisar estado", "Revisar estado"]);
  });

  it("gana la primera regla (completada con voto negativo → Cerrar la tarea)", () => {
    const completedWithNegativeVote = buildPullRequest({ status: "completed", votes: [[THIRD_USER, -10]] });

    const result = nextStep(completedWithNegativeVote);

    assert.equal(result, "Cerrar la tarea");
  });
});

describe("Tarea estancada", () => {
  const changedDaysAgo = (days: number, stateCategory: StateCategory = "InProgress") =>
    buildWorkItem(10, { stateCategory, changedAt: daysBefore(NOW, days) });

  it("InProgress sin cambios hace 4 días (caso N)", () => {
    const workItem = changedDaysAgo(4);

    const result = isStale(workItem, NOW, STALE_TASK_DAYS);

    assert.equal(result, true);
  });

  it("3 días o más (límite 2, 3 y 4 días)", () => {
    const workItems = [2, 3, 4].map((days) => changedDaysAgo(days));

    const results = workItems.map((workItem) => isStale(workItem, NOW, STALE_TASK_DAYS));

    assert.deepEqual(results, [false, true, true]);
  });

  it("el umbral es configurable (STALE_TASK_DAYS)", () => {
    const fourDaysOld = changedDaysAgo(4);

    const results = [4, 5].map((staleTaskDays) => isStale(fourDaysOld, NOW, staleTaskDays));

    assert.deepEqual(results, [true, false]);
  });

  it("solo en categoría InProgress", () => {
    const workItems = (["Proposed", "Resolved", "Completed", "Removed"] as const).map((stateCategory) => changedDaysAgo(10, stateCategory));

    const results = workItems.map((workItem) => isStale(workItem, NOW, STALE_TASK_DAYS));

    assert.deepEqual(results, [false, false, false, false]);
  });
});
