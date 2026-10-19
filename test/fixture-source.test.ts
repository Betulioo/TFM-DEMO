import { test } from "node:test";
import assert from "node:assert/strict";
import { FIXTURE_ME, FixtureSource, fixturePullRequestId } from "../src/adapters/fixtures/fixture-source.js";
import { myTasks } from "../src/domain/rules.js";
import { loadCases } from "../src/adapters/fixtures/cases.js";

const NOW = new Date("2026-10-19T09:00:00Z");
const cases = loadCases();
const source = new FixtureSource(cases, NOW);

/** Los títulos de los casos empiezan por su clave: "[K] Paginación…" → "K". */
const caseKeys = (items: { title: string }[]) => items.map((item) => item.title.slice(1, 2)).sort();
const hasCaseKey = (key: string) => (item: { title: string }) => item.title.startsWith(`[${key}]`);

async function currentIterationWorkItems() {
  const iteration = await source.currentIteration();
  return source.workItemsInIteration(iteration!.id);
}

test("PRs donde soy revisor: K, L y M (PRs del compañero)", async () => {
  assert.deepEqual(caseKeys(await source.pullRequestsToReview()), ["K", "L", "M"]);
});

test("mis PRs activas: D, E y F (G está completada)", async () => {
  assert.deepEqual(caseKeys(await source.myPullRequests()), ["D", "E", "F"]);
});

test("la PR completada de G se encuentra por ID", async () => {
  const caseIndexG = cases.findIndex((testCase) => testCase.key === "G");

  const pullRequestG = await source.pullRequestById(fixturePullRequestId(caseIndexG));

  assert.equal(pullRequestG?.status, "completed");
  assert.equal(await source.pullRequestById(9999), undefined);
});

test("M se crea con la antigüedad de expected.json", async () => {
  const pullRequestM = (await source.pullRequestsToReview()).find(hasCaseKey("M"));

  assert.equal(pullRequestM?.createdAt, "2026-10-14T09:00:00.000Z");
});

test("los votos salen de expected.json", async () => {
  const myPullRequests = await source.myPullRequests();
  const votesOf = (key: string) => myPullRequests.find(hasCaseKey(key))?.reviewers.map((reviewer) => reviewer.vote);

  assert.deepEqual(votesOf("D"), []);
  assert.deepEqual(votesOf("E"), [-5]);
  assert.deepEqual(votesOf("F"), [10]);
});

test("iteración actual: A-H, J y N; I está en el sprint anterior", async () => {
  const iteration = await source.currentIteration();

  assert.equal(iteration?.name, "Sprint actual");
  assert.deepEqual(caseKeys(await source.workItemsInIteration(iteration.id)), ["A", "B", "C", "D", "E", "F", "G", "H", "J", "N"]);
});

test("mis tareas con el adaptador falso: A-G y N (H cerrada, J sin asignar)", async () => {
  const workItems = await currentIterationWorkItems();

  assert.deepEqual(caseKeys(myTasks(workItems, FIXTURE_ME)), ["A", "B", "C", "D", "E", "F", "G", "N"]);
});

test("N tiene la antigüedad de expected.json y G enlaza su PR", async () => {
  const workItems = await currentIterationWorkItems();
  const workItemN = workItems.find(hasCaseKey("N"));
  const workItemG = workItems.find(hasCaseKey("G"));

  assert.equal(workItemN?.changedAt, "2026-10-15T09:00:00.000Z");
  assert.equal(workItemG?.pullRequestIds.length, 1);
  assert.equal((await source.pullRequestById(workItemG.pullRequestIds[0]!))?.status, "completed");
});
