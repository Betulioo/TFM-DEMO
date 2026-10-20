// Verificador del informe (paso 8) sobre el adaptador falso: un informe que sigue la plantilla de la skill
// daily-brief con los datos del snapshot cumple los casos A–Q de expected.json, y cada tipo de error se detecta.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadCases, type Case } from "../../../src/adapters/fixtures/cases.js";
import { FixtureSource, fixtureCaseIds } from "../../../src/adapters/fixtures/fixture-source.js";
import { collectSnapshot } from "../../../src/application/collect-snapshot.js";
import { DEFAULT_BLOCKED_TASK_CRITERIA, DEFAULT_THRESHOLDS } from "../../../src/config.js";
import type { Snapshot, SnapshotPullRequest, SnapshotTask } from "../../../src/domain/types.js";
import { SECTIONS, verifyBrief, type BriefReport, type CaseWithIds } from "../brief-check.js";
import { NOW_ISO } from "#test-helpers/test-data.js";

const NOW = new Date(NOW_ISO);
const cases = loadCases();
const snapshot = await collectSnapshot(new FixtureSource(cases, NOW), NOW, DEFAULT_THRESHOLDS, DEFAULT_BLOCKED_TASK_CRITERIA);
const casesWithIds: CaseWithIds[] = cases.map((testCase, index) => ({ testCase, ids: fixtureCaseIds(testCase, index) }));
const correctBrief = renderBrief(snapshot);

/** Informe con la plantilla de la skill daily-brief, rellenado con el snapshot como lo haría la skill. */
function renderBrief(source: Snapshot): string {
  const pullRequestLine = (pullRequest: SnapshotPullRequest): string =>
    `- ${link("PR", pullRequest)} — ${pullRequest.title} (autor: ${pullRequest.author.displayName})${pullRequest.aged ? " — PR envejecida" : ""}`;
  const myPullRequestLine = (pullRequest: SnapshotPullRequest): string => {
    const status = pullRequest.blocked ? "PR bloqueada" : pullRequest.approved ? "PR aprobada" : "sin votos";
    return `- ${link("PR", pullRequest)} — ${pullRequest.title} — ${status}`;
  };
  const risks = [
    ...source.pullRequestsPendingMyReview.filter((pullRequest) => pullRequest.aged).map((pullRequest) => `- ${link("PR", pullRequest)} — PR envejecida pendiente de mi revisión`),
    ...source.myPullRequests.filter((pullRequest) => pullRequest.blocked).map((pullRequest) => `- ${link("PR", pullRequest)} — PR propia bloqueada`),
    ...source.myTasks.filter((task) => task.blocked).map((task) => `- ${link("WI", task)} — tarea bloqueada (motivo: ${task.lockReason ?? "sin datos"})`),
    ...source.myTasks.filter((task) => task.stale).map((task) => `- ${link("WI", task)} — tarea estancada`),
  ];
  return [
    `# Informe diario — ${source.generatedAt.slice(0, 10)}`,
    "",
    `Usuario: ${source.user.displayName}`,
    "",
    "## Hechos",
    `### ${SECTIONS.pendingMyReview}`,
    ...linesOrNone(source.pullRequestsPendingMyReview.map(pullRequestLine)),
    `### ${SECTIONS.pendingTeamReview}`,
    ...linesOrNone(source.pullRequestsPendingTeamReview.map(pullRequestLine)),
    `### ${SECTIONS.myPullRequests}`,
    ...linesOrNone(source.myPullRequests.map(myPullRequestLine)),
    `### ${SECTIONS.myTasks}`,
    ...linesOrNone(source.myTasks.map(taskLine)),
    `### ${SECTIONS.risks}`,
    ...linesOrNone(risks),
    "",
    `## ${SECTIONS.suggestions}`,
    ...source.myTasks.filter((task) => task.blocked).map((task, position) => `${position + 1}. Desbloquear ${link("WI", task)}.`),
  ].join("\n");
}

function taskLine(task: SnapshotTask): string {
  const pullRequestPart = task.pullRequest ? `${link("PR", task.pullRequest)} — Siguiente paso: ${task.nextStep ?? "sin datos"}` : "sin PR";
  const stalePart = task.stale ? " — tarea estancada" : "";
  const blockedPart = task.blocked ? ` — tarea bloqueada (motivo: ${task.lockReason ?? "sin datos"})` : "";
  return `- ${link("WI", task)} — ${task.title} (${task.state}) — ${pullRequestPart}${stalePart}${blockedPart}`;
}

function link(kind: "PR" | "WI", item: { id: number; webUrl: string }): string {
  return `[${kind} #${item.id}](${item.webUrl})`;
}

function linesOrNone(lines: string[]): string[] {
  return lines.length === 0 ? ["- Ninguna."] : lines;
}

/** IDs del caso con esa clave, como los escribe el informe. Falla si la clave no existe. */
function caseRefs(key: string): { workItem: string; pullRequest: string } {
  const entry = casesWithIds.find(({ testCase }) => testCase.key === key);
  if (entry === undefined) throw new Error(`No existe el caso ${key} en fixtures/expected.json`);
  return { workItem: `WI #${entry.ids.workItemId}`, pullRequest: `PR #${entry.ids.pullRequestId}` };
}

/** La línea del informe que empieza por ese ID en la sección dada. */
function lineOf(markdown: string, section: string, id: string): string {
  const sectionText = markdown.split(new RegExp(`^#{2,3} ${section}$`, "m"))[1]?.split(/^#{2,3} /m)[0] ?? "";
  const line = sectionText.split("\n").find((text) => text.startsWith(`- [${id}]`));
  if (line === undefined) throw new Error(`No hay línea de ${id} en «${section}»`);
  return line;
}

function failedChecks(report: BriefReport): string[] {
  return report.caseChecks.filter((check) => !check.passed).map((check) => check.description);
}

function sectionResult(report: BriefReport, section: string): BriefReport["sections"][number] {
  const result = report.sections.find((entry) => entry.section === section);
  if (result === undefined) throw new Error(`No hay resultado de «${section}»`);
  return result;
}

describe("Informe que sigue la plantilla con los datos del snapshot", () => {
  it("cumple los casos A–Q de expected.json sin ningún fallo", () => {
    const result = verifyBrief(correctBrief, snapshot, casesWithIds);

    assert.deepEqual(failedChecks(result), []);
    assert.equal(result.failures, 0);
  });

  it("P y Q: su línea de Mis tareas y la de Riesgos dicen \"tarea bloqueada\" con su motivo", () => {
    const result = verifyBrief(correctBrief, snapshot, casesWithIds);

    const blockedChecks = result.caseChecks
      .filter((check) => /^[PQ] → (taskBlocked|lockReason)/.test(check.description))
      .map((check) => `${check.passed ? "OK" : "FALLO"} ${check.description}`);
    assert.deepEqual(blockedChecks, [
      `OK P → taskBlocked: ${caseRefs("P").workItem} en «Mis tareas» con «tarea bloqueada»`,
      `OK P → taskBlocked: ${caseRefs("P").workItem} en «Riesgos» con «tarea bloqueada»`,
      `OK P → taskBlocked: ${caseRefs("P").workItem} en «Mis tareas» con «motivo: sin datos»`,
      `OK Q → taskBlocked: ${caseRefs("Q").workItem} en «Mis tareas» con «tarea bloqueada»`,
      `OK Q → taskBlocked: ${caseRefs("Q").workItem} en «Riesgos» con «tarea bloqueada»`,
      `OK Q → lockReason: ${caseRefs("Q").workItem} en «Mis tareas» con «motivo: Esperando credenciales del entorno de pruebas»`,
    ]);
  });
});

describe("Errores del informe por sección", () => {
  it("omisión: si K falta de PRs pendientes de mi revisión, se cuenta y el caso K falla", () => {
    const pullRequestK = caseRefs("K").pullRequest;
    const withoutK = correctBrief.replace(`${lineOf(correctBrief, SECTIONS.pendingMyReview, pullRequestK)}\n`, "");

    const result = verifyBrief(withoutK, snapshot, casesWithIds);

    assert.deepEqual(sectionResult(result, SECTIONS.pendingMyReview).omissions, [pullRequestK]);
    assert.deepEqual(failedChecks(result), [`K → pendingMyReview: ${pullRequestK} en «PRs pendientes de mi revisión» — no está`]);
  });

  it("mal clasificado: la PR de D (sin votos) en Riesgos existe en el snapshot pero no es un riesgo", () => {
    const pullRequestD = caseRefs("D").pullRequest;
    const withDInRisks = correctBrief.replace(`### ${SECTIONS.risks}\n`, `### ${SECTIONS.risks}\n- [${pullRequestD}](url) — PR propia bloqueada\n`);

    const result = verifyBrief(withDInRisks, snapshot, casesWithIds);

    const risks = sectionResult(result, SECTIONS.risks);
    assert.deepEqual({ misplaced: risks.misplaced, invented: risks.invented }, { misplaced: [pullRequestD], invented: [] });
  });

  it("inventado: una PR que no existe en el snapshot", () => {
    const withInvented = correctBrief.replace(`### ${SECTIONS.myPullRequests}\n`, `### ${SECTIONS.myPullRequests}\n- PR #999 — Inventada — sin votos\n`);

    const result = verifyBrief(withInvented, snapshot, casesWithIds);

    const myPullRequests = sectionResult(result, SECTIONS.myPullRequests);
    assert.deepEqual({ misplaced: myPullRequests.misplaced, invented: myPullRequests.invented }, { misplaced: [], invented: ["PR #999"] });
  });

  it("un ID sin enlace (\"PR #n\" a secas) cuenta igual que enlazado", () => {
    const pullRequestK = caseRefs("K").pullRequest;
    const lineK = lineOf(correctBrief, SECTIONS.pendingMyReview, pullRequestK);
    const withoutLink = correctBrief.replace(lineK, lineK.replace(/\[(PR #\d+)\]\([^)]*\)/, "$1"));

    const result = verifyBrief(withoutLink, snapshot, casesWithIds);

    assert.equal(result.failures, 0);
  });
});

describe("Señales de cada línea", () => {
  it("P sin \"tarea bloqueada\" en Mis tareas: falla su comprobación", () => {
    const workItemP = caseRefs("P").workItem;
    const lineP = lineOf(correctBrief, SECTIONS.myTasks, workItemP);
    const withoutSignal = correctBrief.replace(lineP, lineP.replace(/ — tarea bloqueada.*$/, ""));

    const result = verifyBrief(withoutSignal, snapshot, casesWithIds);

    assert.deepEqual(failedChecks(result), [
      `P → taskBlocked: ${workItemP} en «Mis tareas» con «tarea bloqueada» — la línea no dice «tarea bloqueada»`,
      `P → taskBlocked: ${workItemP} en «Mis tareas» con «motivo: sin datos» — la línea no dice «motivo: sin datos»`,
    ]);
  });

  it("Q con otro motivo de bloqueo: falla lockReason", () => {
    const workItemQ = caseRefs("Q").workItem;
    const lineQ = lineOf(correctBrief, SECTIONS.myTasks, workItemQ);
    const withOtherReason = correctBrief.replace(lineQ, lineQ.replace(/motivo: [^)]*/, "motivo: sin datos"));

    const result = verifyBrief(withOtherReason, snapshot, casesWithIds);

    assert.deepEqual(failedChecks(result), [
      `Q → lockReason: ${workItemQ} en «Mis tareas» con «motivo: Esperando credenciales del entorno de pruebas» — la línea no dice «motivo: Esperando credenciales del entorno de pruebas»`,
    ]);
  });

  it("siguiente paso de E distinto del esperado: falla nextStep", () => {
    const workItemE = caseRefs("E").workItem;
    const lineE = lineOf(correctBrief, SECTIONS.myTasks, workItemE);
    const withOtherStep = correctBrief.replace(lineE, lineE.replace("Atender cambios solicitados", "Esperar revisión"));

    const result = verifyBrief(withOtherStep, snapshot, casesWithIds);

    assert.deepEqual(failedChecks(result), [
      `E → nextStep: ${workItemE} en «Mis tareas» con «Siguiente paso: Atender cambios solicitados» — la línea no dice «Siguiente paso: Atender cambios solicitados»`,
    ]);
  });
});

describe("Sugerencias: no aportan hechos nuevos (skill daily-brief)", () => {
  it("una sugerencia con un ID que no está en Hechos es un fallo", () => {
    const pullRequestL = caseRefs("L").pullRequest;
    const withNewFact = `${correctBrief}\n9. Revisar ${pullRequestL}.`;

    const result = verifyBrief(withNewFact, snapshot, casesWithIds);

    assert.deepEqual(result.suggestionsWithoutFact, [pullRequestL]);
  });
});

describe("Claves de expected", () => {
  it("una clave de expected sin comprobación definida es un fallo, no se salta", () => {
    const caseA = casesWithIds.find(({ testCase }) => testCase.key === "A");
    if (caseA === undefined) throw new Error("No existe el caso A en fixtures/expected.json");
    const unknownCase: Case = { ...caseA.testCase, expected: { claveNueva: true } };

    const result = verifyBrief(correctBrief, snapshot, [{ testCase: unknownCase, ids: caseA.ids }]);

    assert.deepEqual(failedChecks(result), ["A → claveNueva: sin comprobación definida"]);
  });
});

describe("Medida global (sin encabezados, para el prompt plano)", () => {
  it("un texto sin la plantilla con todos los IDs esperados no tiene omisiones; uno inventado se cuenta", () => {
    const plainText = `Hoy: ${correctBrief.replace(/^#.*$/gm, "")}\nAdemás, WI #999.`;

    const result = verifyBrief(plainText, snapshot, casesWithIds);

    assert.deepEqual({ omissions: result.global.omissions, invented: result.global.invented }, { omissions: [], invented: ["WI #999"] });
  });

  it("sin la línea de K, K es una omisión global", () => {
    const pullRequestK = caseRefs("K").pullRequest;
    const withoutK = correctBrief.replace(`${lineOf(correctBrief, SECTIONS.pendingMyReview, pullRequestK)}\n`, "");

    const result = verifyBrief(withoutK, snapshot, casesWithIds);

    assert.deepEqual(result.global.omissions, [pullRequestK]);
  });
});
