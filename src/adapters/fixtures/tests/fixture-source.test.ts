// Adaptador falso: cada caso de fixtures/expected.json acaba donde dice `expected`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FIXTURE_ME, FixtureSource, fixturePullRequestId } from "../fixture-source.js";
import { loadCases } from "../cases.js";
import { isPendingMyReview, isPendingTeamReview, isStale, myTasks, nextStep, taskPullRequest } from "../../../domain/rules.js";
import type { WorkItem } from "../../../domain/types.js";
import { DEFAULT_THRESHOLDS } from "../../../config.js";
import { NOW_ISO } from "#test-helpers/test-data.js";

const NOW = new Date(NOW_ISO);
/** Umbral por defecto del glosario ("Tarea estancada"). */
const STALE_TASK_DAYS = DEFAULT_THRESHOLDS.staleTaskDays;
const cases = loadCases();
const source = new FixtureSource(cases, NOW);

/** Los títulos de los casos empiezan por su clave: "[K] Paginación…" → "K". */
const caseKey = (item: { title: string }) => item.title.slice(1, 2);
const caseKeys = (items: { title: string }[]) => items.map(caseKey).sort();
const hasCaseKey = (key: string) => (item: { title: string }) => item.title.startsWith(`[${key}]`);

async function currentIterationWorkItems() {
  const iteration = await source.currentIteration();
  if (iteration === undefined) throw new Error("El adaptador falso no tiene iteración actual");
  return source.workItemsInIteration(iteration.id);
}

describe("Adaptador falso: pull requests", () => {
  it("PRs donde soy revisor: K, L y M (PRs del compañero)", async () => {
    const pullRequests = await source.pullRequestsToReview();

    assert.deepEqual(caseKeys(pullRequests), ["K", "L", "M"]);
  });

  it("mis PRs activas: D, E y F (G está completada)", async () => {
    const pullRequests = await source.myPullRequests();

    assert.deepEqual(caseKeys(pullRequests), ["D", "E", "F"]);
  });

  it("la PR completada de G se encuentra por ID", async () => {
    const caseIndexG = cases.findIndex((testCase) => testCase.key === "G");

    const pullRequestG = await source.pullRequestById(fixturePullRequestId(caseIndexG));

    assert.equal(pullRequestG?.status, "completed");
  });

  it("una PR que no existe devuelve undefined", async () => {
    const unknownId = 9999;

    const result = await source.pullRequestById(unknownId);

    assert.equal(result, undefined);
  });

  it("M se crea con la antigüedad de expected.json", async () => {
    const pullRequests = await source.pullRequestsToReview();

    assert.equal(pullRequests.find(hasCaseKey("M"))?.createdAt, "2026-10-14T09:00:00.000Z");
  });

  it("los votos salen de expected.json", async () => {
    const myPullRequests = await source.myPullRequests();

    const votesOf = (key: string) => myPullRequests.find(hasCaseKey(key))?.reviewers.map((reviewer) => reviewer.vote);
    assert.deepEqual(["D", "E", "F"].map(votesOf), [[], [-5], [10]]);
  });

  it("PRs pendientes del equipo: solo O", async () => {
    const teams = await source.myTeams();
    const teamPullRequests = (await Promise.all(teams.map((team) => source.pullRequestsToReviewByTeam(team.id)))).flat();

    const pendingTeamReview = teamPullRequests.filter((pullRequest) => isPendingTeamReview(pullRequest, FIXTURE_ME, teams));

    assert.deepEqual(caseKeys(pendingTeamReview), ["O"]);
  });

  it("PRs pendientes de mi revisión: K y M (L ya votada, O es del equipo)", async () => {
    const pullRequests = await source.pullRequestsToReview();

    const pendingMyReview = pullRequests.filter((pullRequest) => isPendingMyReview(pullRequest, FIXTURE_ME));

    assert.deepEqual(caseKeys(pendingMyReview), ["K", "M"]);
  });
});

describe("Adaptador falso: iteración y work items", () => {
  it("iteración actual: Sprint actual", async () => {
    const iteration = await source.currentIteration();

    assert.equal(iteration?.name, "Sprint actual");
  });

  it("work items de la iteración actual: A-H, J y N (I está en el sprint anterior)", async () => {
    const workItems = await currentIterationWorkItems();

    assert.deepEqual(caseKeys(workItems), ["A", "B", "C", "D", "E", "F", "G", "H", "J", "N"]);
  });

  it("mis tareas: A-G y N (H cerrada, J sin asignar)", async () => {
    const workItems = await currentIterationWorkItems();

    const tasks = myTasks(workItems, FIXTURE_ME);

    assert.deepEqual(caseKeys(tasks), ["A", "B", "C", "D", "E", "F", "G", "N"]);
  });

  it("N tiene la antigüedad de expected.json", async () => {
    const workItems = await currentIterationWorkItems();

    assert.equal(workItems.find(hasCaseKey("N"))?.changedAt, "2026-10-15T09:00:00.000Z");
  });

  it("G enlaza su PR completada", async () => {
    const workItemG = (await currentIterationWorkItems()).find(hasCaseKey("G"));

    const linkedPullRequests = await Promise.all((workItemG?.pullRequestIds ?? []).map((id) => source.pullRequestById(id)));

    assert.deepEqual(linkedPullRequests.map((pullRequest) => pullRequest?.status), ["completed"]);
  });
});

/** Siguiente paso de una tarea con el adaptador falso: busca sus PRs vinculadas, elige la suya y aplica la regla. */
async function nextStepOf(task: WorkItem) {
  const linkedPullRequests = await Promise.all(task.pullRequestIds.map((id) => source.pullRequestById(id)));
  return nextStep(taskPullRequest(linkedPullRequests));
}

/** Claves de los casos de expected.json que cumplen `matches`, con el valor esperado de `field`. */
function expectedByCase(field: string, matches: (value: unknown) => boolean): Record<string, unknown> {
  const entries = cases.filter((testCase) => field in testCase.expected && matches(testCase.expected[field]));
  return Object.fromEntries(entries.map((testCase) => [testCase.key, testCase.expected[field]]));
}

describe("Adaptador falso con las reglas: resultado de expected.json", () => {
  it("siguiente paso de mis tareas: el de expected.json (D–G con PR; A, B, C y N sin siguiente paso)", async () => {
    const tasks = myTasks(await currentIterationWorkItems(), FIXTURE_ME);

    const nextSteps = Object.fromEntries(await Promise.all(tasks.map(async (task) => [caseKey(task), await nextStepOf(task)] as const)));

    assert.deepEqual(nextSteps, expectedByCase("nextStep", () => true));
  });

  it("tareas estancadas: las de expected.json (N)", async () => {
    const tasks = myTasks(await currentIterationWorkItems(), FIXTURE_ME);

    const staleTasks = tasks.filter((task) => isStale(task, NOW, STALE_TASK_DAYS));

    assert.deepEqual(caseKeys(staleTasks), Object.keys(expectedByCase("stale", (value) => value === true)));
  });
});
