// Recogida sobre el adaptador falso: cada caso A–O de fixtures/expected.json acaba en el snapshot como dice `expected`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadCases, type Case } from "../../../src/adapters/fixtures/cases.js";
import { FixtureSource, fixturePullRequestId, fixtureWorkItemId } from "../../../src/adapters/fixtures/fixture-source.js";
import { collectSnapshot } from "../../../src/application/collect-snapshot.js";
import { checkCase, type CaseIds } from "../snapshot-check.js";
import { NOW_ISO } from "#test-helpers/test-data.js";

const NOW = new Date(NOW_ISO);
/** Umbrales por defecto del glosario. */
const THRESHOLDS = { agedPrDays: 3, staleTaskDays: 3 };
const cases = loadCases();
const snapshot = await collectSnapshot(new FixtureSource(cases, NOW), NOW, THRESHOLDS);

/** IDs deterministas del adaptador falso para el caso en la posición `index`. */
function fixtureIds(testCase: Case, index: number): CaseIds {
  const setup = testCase.setup;
  const hasPullRequest = setup.entity === "pullRequest" || setup.pr !== null;
  return {
    workItemId: setup.entity === "workItem" ? fixtureWorkItemId(index) : undefined,
    pullRequestId: hasPullRequest ? fixturePullRequestId(index) : undefined,
  };
}

function failedChecks(testCase: Case, index: number, checkedSnapshot = snapshot): string[] {
  return checkCase(checkedSnapshot, testCase, fixtureIds(testCase, index))
    .filter((check) => !check.passed)
    .map((check) => check.description);
}

describe("Snapshot con el adaptador falso: casos de expected.json", () => {
  it("están los 15 casos (A–O)", () => {
    const keys = cases.map((testCase) => testCase.key);

    assert.deepEqual(keys, ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"]);
  });

  cases.forEach((testCase, index) => {
    it(`caso ${testCase.key}: coincide con su expected`, () => {
      const result = failedChecks(testCase, index);

      assert.deepEqual(result, []);
    });
  });

  it("control: si K falta de pendientes de mi revisión, el caso K falla", () => {
    const indexK = cases.findIndex((testCase) => testCase.key === "K");
    const pullRequestIdK = fixturePullRequestId(indexK);
    const withoutK = {
      ...snapshot,
      pullRequestsPendingMyReview: snapshot.pullRequestsPendingMyReview.filter((pullRequest) => pullRequest.id !== pullRequestIdK),
    };

    const result = failedChecks(cases[indexK]!, indexK, withoutK);

    assert.deepEqual(result, ["K → pendingMyReview: esperado true, obtenido false"]);
  });

  it("una clave de expected sin comprobación definida es un fallo, no se salta", () => {
    const unknownCase: Case = { ...cases[0]!, expected: { claveNueva: true } };

    const result = failedChecks(unknownCase, 0);

    assert.deepEqual(result, ["A → claveNueva: sin comprobación definida"]);
  });
});
