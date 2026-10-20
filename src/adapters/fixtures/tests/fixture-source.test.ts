// Adaptador falso: cada caso de fixtures/expected.json acaba donde dice `expected`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FIXTURE_ME, FixtureSource, fixturePullRequestId } from "../fixture-source.js";
import { loadCases } from "../cases.js";
import { isPendingMyReview, isPendingTeamReview, myTasks } from "../../../domain/rules.js";
import { NOW } from "../../../../test/helpers/test-data.js";

const cases = loadCases();
const source = new FixtureSource(cases, NOW);

/** Los títulos de los casos empiezan por su clave: "[K] Paginación…" → "K". */
const caseKeys = (items: { title: string }[]) => items.map((item) => item.title.slice(1, 2)).sort();
const hasCaseKey = (key: string) => (item: { title: string }) => item.title.startsWith(`[${key}]`);

async function currentIterationWorkItems() {
  const iteration = await source.currentIteration();
  return source.workItemsInIteration(iteration!.id);
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

    const pullRequestM = pullRequests.find(hasCaseKey("M"));

    assert.equal(pullRequestM?.createdAt, "2026-10-14T09:00:00.000Z");
  });

  it("los votos salen de expected.json", async () => {
    const myPullRequests = await source.myPullRequests();

    const votes = ["D", "E", "F"].map((key) => myPullRequests.find(hasCaseKey(key))?.reviewers.map((reviewer) => reviewer.vote));

    assert.deepEqual(votes, [[], [-5], [10]]);
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
  it("iteración actual: A-H, J y N; I está en el sprint anterior", async () => {
    const iteration = await source.currentIteration();

    const workItems = await source.workItemsInIteration(iteration!.id);

    assert.equal(iteration?.name, "Sprint actual");
    assert.deepEqual(caseKeys(workItems), ["A", "B", "C", "D", "E", "F", "G", "H", "J", "N"]);
  });

  it("mis tareas: A-G y N (H cerrada, J sin asignar)", async () => {
    const workItems = await currentIterationWorkItems();

    const tasks = myTasks(workItems, FIXTURE_ME);

    assert.deepEqual(caseKeys(tasks), ["A", "B", "C", "D", "E", "F", "G", "N"]);
  });

  it("N tiene la antigüedad de expected.json", async () => {
    const workItems = await currentIterationWorkItems();

    const workItemN = workItems.find(hasCaseKey("N"));

    assert.equal(workItemN?.changedAt, "2026-10-15T09:00:00.000Z");
  });

  it("G enlaza su PR completada", async () => {
    const workItemG = (await currentIterationWorkItems()).find(hasCaseKey("G"));

    const linkedPullRequests = await Promise.all((workItemG?.pullRequestIds ?? []).map((id) => source.pullRequestById(id)));

    assert.deepEqual(linkedPullRequests.map((pullRequest) => pullRequest?.status), ["completed"]);
  });
});
