// Valores configurables del glosario: umbrales (AGED_PR_DAYS, STALE_TASK_DAYS) y tarea bloqueada (BLOCKED_TAG,
// BLOCKED_STATE). Valor por defecto y valores no válidos.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blockedTaskCriteriaFrom, thresholdsFrom } from "../config.js";

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

describe("Tarea bloqueada configurable", () => {
  it("sin BLOCKED_TAG ni BLOCKED_STATE: etiqueta Blocked y estado Locked (glosario)", () => {
    const result = blockedTaskCriteriaFrom({});

    assert.deepEqual(result, { tag: "Blocked", state: "Locked" });
  });

  it("se leen los valores configurados, sin espacios alrededor", () => {
    const result = blockedTaskCriteriaFrom({ BLOCKED_TAG: " bloqueada ", BLOCKED_STATE: "Bloqueado" });

    assert.deepEqual(result, { tag: "bloqueada", state: "Bloqueado" });
  });
});
