import { test } from "node:test";
import assert from "node:assert/strict";
import { FIXTURE_ME, FixtureSource } from "../src/adapters/fixtures/fixture-source.js";
import { myTasks } from "../src/domain/rules.js";
import { loadCases } from "../src/adapters/fixtures/cases.js";

const NOW = new Date("2026-10-19T09:00:00Z");
const cases = loadCases();
const source = new FixtureSource(cases, NOW);

const titles = (prs: { title: string }[]) => prs.map((pr) => pr.title.slice(1, 2)).sort();

test("PRs donde soy revisor: K, L y M (PRs del compañero)", async () => {
  assert.deepEqual(titles(await source.pullRequestsToReview()), ["K", "L", "M"]);
});

test("mis PRs activas: D, E y F (G está completada)", async () => {
  assert.deepEqual(titles(await source.myPullRequests()), ["D", "E", "F"]);
});

test("la PR completada de G se encuentra por ID", async () => {
  const index = cases.findIndex((c) => c.key === "G");
  const pr = await source.pullRequestById(index + 1);
  assert.equal(pr?.status, "completed");
  assert.equal(await source.pullRequestById(9999), undefined);
});

test("M se crea con la antigüedad de expected.json", async () => {
  const m = (await source.pullRequestsToReview()).find((pr) => pr.title.startsWith("[M]"));
  assert.equal(m?.createdAt, "2026-10-14T09:00:00.000Z");
});

test("los votos salen de expected.json", async () => {
  const mine = await source.myPullRequests();
  const vote = (key: string) => mine.find((pr) => pr.title.startsWith(`[${key}]`))?.reviewers.map((r) => r.vote);
  assert.deepEqual(vote("D"), []);
  assert.deepEqual(vote("E"), [-5]);
  assert.deepEqual(vote("F"), [10]);
});

test("iteración actual: A-H, J y N; I está en el sprint anterior", async () => {
  const it = await source.currentIteration();
  assert.equal(it?.name, "Sprint actual");
  assert.deepEqual(titles(await source.workItemsInIteration(it.id)), ["A", "B", "C", "D", "E", "F", "G", "H", "J", "N"]);
});

test("mis tareas con el adaptador falso: A-G y N (H cerrada, J sin asignar)", async () => {
  const it = await source.currentIteration();
  const items = await source.workItemsInIteration(it!.id);
  assert.deepEqual(titles(myTasks(items, FIXTURE_ME)), ["A", "B", "C", "D", "E", "F", "G", "N"]);
});

test("N tiene la antigüedad de expected.json y G enlaza su PR", async () => {
  const items = await source.workItemsInIteration((await source.currentIteration())!.id);
  const byKey = (key: string) => items.find((w) => w.title.startsWith(`[${key}]`));
  assert.equal(byKey("N")?.changedAt, "2026-10-15T09:00:00.000Z");
  const g = byKey("G");
  assert.equal(g?.pullRequestIds.length, 1);
  assert.equal((await source.pullRequestById(g.pullRequestIds[0]!))?.status, "completed");
});
