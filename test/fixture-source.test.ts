import { test } from "node:test";
import assert from "node:assert/strict";
import { FixtureSource } from "../src/adapters/fixture-source.js";
import { loadCases } from "../src/fixtures/cases.js";

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
