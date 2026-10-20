// Validación de fixtures/expected.json: rechaza los casos que el seed no podría crear.
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateCases, type Case } from "../src/adapters/fixtures/cases.js";

function buildTeamReviewCase(verifiedIn: Case["verifiedIn"]): Case {
  return {
    key: "X",
    verifiedIn,
    setup: { entity: "pullRequest", author: "teammate", title: "[X] PR del equipo", reviewer: "myTeam" },
    expected: { pendingTeamReview: true },
  };
}

test("casos: una PR con el equipo como revisor solo vale en fixtures (el seed no sabe crearla)", () => {
  assert.doesNotThrow(() => validateCases([buildTeamReviewCase("fixtures")]));
  assert.throws(() => validateCases([buildTeamReviewCase("demo-teammate")]), /solo puede ser "verifiedIn": "fixtures"/);
});

test("casos: una PR de una tarea necesita rama", () => {
  const withoutBranch: Case = {
    key: "Y",
    verifiedIn: "demo",
    setup: { entity: "workItem", type: "Task", title: "[Y] Sin rama", state: "Active", iteration: "current", assignedToMe: true, branch: false, pr: { status: "active", vote: null } },
    expected: {},
  };

  assert.throws(() => validateCases([withoutBranch]), /una PR necesita rama/);
});
