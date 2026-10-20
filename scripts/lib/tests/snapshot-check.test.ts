// Recogida sobre el adaptador falso: cada caso A–O de fixtures/expected.json acaba en el snapshot como dice `expected`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadCases, type Case } from "../../../src/adapters/fixtures/cases.js";
import { FixtureSource, fixtureCaseIds, fixturePullRequestId } from "../../../src/adapters/fixtures/fixture-source.js";
import { collectSnapshot } from "../../../src/application/collect-snapshot.js";
import { DEFAULT_THRESHOLDS } from "../../../src/config.js";
import { checkCase } from "../snapshot-check.js";
import { NOW_ISO } from "#test-helpers/test-data.js";

const NOW = new Date(NOW_ISO);
const cases = loadCases();
const snapshot = await collectSnapshot(new FixtureSource(cases, NOW), NOW, DEFAULT_THRESHOLDS);

/** Caso de expected.json por su clave, con su posición. Falla si la clave no existe. */
function caseByKey(key: string): { testCase: Case; index: number } {
  const index = cases.findIndex((testCase) => testCase.key === key);
  const testCase = cases[index];
  if (testCase === undefined) throw new Error(`No existe el caso ${key} en fixtures/expected.json`);
  return { testCase, index };
}

function failedChecks(testCase: Case, index: number, checkedSnapshot = snapshot): string[] {
  return checkCase(checkedSnapshot, testCase, fixtureCaseIds(testCase, index))
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
    const { testCase: caseK, index: indexK } = caseByKey("K");
    const pullRequestIdK = fixturePullRequestId(indexK);
    const withoutK = {
      ...snapshot,
      pullRequestsPendingMyReview: snapshot.pullRequestsPendingMyReview.filter((pullRequest) => pullRequest.id !== pullRequestIdK),
    };

    const result = failedChecks(caseK, indexK, withoutK);

    assert.deepEqual(result, ["K → pendingMyReview: esperado true, obtenido false"]);
  });

  it("una clave de expected sin comprobación definida es un fallo, no se salta", () => {
    const { testCase: caseA, index: indexA } = caseByKey("A");
    const unknownCase: Case = { ...caseA, expected: { claveNueva: true } };

    const result = failedChecks(unknownCase, indexA);

    assert.deepEqual(result, ["A → claveNueva: sin comprobación definida"]);
  });
});
