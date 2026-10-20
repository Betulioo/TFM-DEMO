// Validación de fixtures/expected.json: rechaza los casos que el seed no podría crear.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateCases, type Case } from "../cases.js";

function buildTeamReviewCase(verifiedIn: Case["verifiedIn"]): Case {
  return {
    key: "X",
    verifiedIn,
    setup: { entity: "pullRequest", author: "teammate", title: "[X] PR del equipo", reviewer: "myTeam" },
    expected: { pendingTeamReview: true },
  };
}

describe("Validación de casos", () => {
  it("una PR con el equipo como revisor vale en fixtures", () => {
    const fixturesCase = buildTeamReviewCase("fixtures");

    const validate = () => validateCases([fixturesCase]);

    assert.doesNotThrow(validate);
  });

  it("una PR con el equipo como revisor no vale en la demo (el seed no sabe crearla)", () => {
    const demoCase = buildTeamReviewCase("demo-teammate");

    const validate = () => validateCases([demoCase]);

    assert.throws(validate, /solo puede ser "verifiedIn": "fixtures"/);
  });

  it("una PR de una tarea necesita rama", () => {
    const withoutBranch: Case = {
      key: "Y",
      verifiedIn: "demo",
      setup: { entity: "workItem", type: "Task", title: "[Y] Sin rama", state: "Active", iteration: "current", assignedToMe: true, branch: false, pr: { status: "active", vote: null } },
      expected: {},
    };

    const validate = () => validateCases([withoutBranch]);

    assert.throws(validate, /una PR necesita rama/);
  });
});
