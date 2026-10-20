// Umbrales configurables del glosario (AGED_PR_DAYS, STALE_TASK_DAYS): valor por defecto y valores no válidos.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { thresholdsFrom } from "../config.js";

describe("Umbrales configurables", () => {
  it("sin AGED_PR_DAYS ni STALE_TASK_DAYS: 3 días cada uno (glosario)", () => {
    const result = thresholdsFrom({});

    assert.deepEqual(result, { agedPrDays: 3, staleTaskDays: 3 });
  });

  it("se leen los valores configurados", () => {
    const result = thresholdsFrom({ AGED_PR_DAYS: "5", STALE_TASK_DAYS: "2" });

    assert.deepEqual(result, { agedPrDays: 5, staleTaskDays: 2 });
  });

  for (const invalid of ["0", "-1", "2.5", "tres"]) {
    it(`AGED_PR_DAYS="${invalid}" no es válido: error`, () => {
      const loading = () => thresholdsFrom({ AGED_PR_DAYS: invalid });

      assert.throws(loading, /AGED_PR_DAYS debe ser un número entero/);
    });
  }
});
