// Compara un informe diario (output/brief-AAAA-MM-DD.md) con el `expected` de cada caso de fixtures/expected.json.
// Lo usan `npm run verify:brief` y su test. Los encabezados son los de la plantilla de la skill daily-brief.
import type { Case } from "../../src/adapters/fixtures/cases.js";
import type { Snapshot } from "../../src/domain/types.js";
import { allPullRequests, type CaseIds, type Check } from "./snapshot-check.js";

export const SECTIONS = {
  pendingMyReview: "PRs pendientes de mi revisión",
  pendingTeamReview: "PRs pendientes del equipo",
  myPullRequests: "Mis PRs",
  myTasks: "Mis tareas",
  risks: "Riesgos",
  suggestions: "Sugerencias",
} as const;

const FACT_SECTIONS = [
  SECTIONS.pendingMyReview,
  SECTIONS.pendingTeamReview,
  SECTIONS.myPullRequests,
  SECTIONS.myTasks,
  SECTIONS.risks,
];

/** Así se nombran los IDs en el informe, con o sin enlace: "PR #12", "WI #345" (CLAUDE.md, Hechos con ID). */
const ID_PATTERN = /\b(PR|WI) #(\d+)/g;

export interface BriefLine {
  /** El primer ID de la línea: el hecho del que habla. En Mis tareas, la PR que va detrás es de la tarea. */
  ownId: string | undefined;
  text: string;
}

/** Líneas de cada sección, por su encabezado (`##` o `###`). */
export type ParsedBrief = Map<string, BriefLine[]>;

/** Lo que un caso exige en el informe: un ID dentro o fuera de una sección y, si está, un texto en su línea. */
export interface Expectation {
  caseKey: string;
  field: string;
  section: string;
  id: string;
  appears: boolean;
  lineIncludes?: string;
  lineExcludes?: string;
}

export interface SectionResult {
  section: string;
  hits: string[];
  omissions: string[];
  /** IDs que existen en el snapshot pero no tocan en esta sección. */
  misplaced: string[];
  /** IDs que no existen en el snapshot. */
  invented: string[];
}

export interface GlobalResult {
  hits: string[];
  omissions: string[];
  invented: string[];
}

export interface BriefReport {
  caseChecks: Check[];
  sections: SectionResult[];
  /** IDs de las Sugerencias que no salen en Hechos (skill daily-brief: no aportan hechos nuevos). */
  suggestionsWithoutFact: string[];
  global: GlobalResult;
  /** Fallos de la medida por sección: decide el código de salida. La global solo se informa. */
  failures: number;
}

export interface CaseWithIds {
  testCase: Case;
  ids: CaseIds;
}

type Requirement = Omit<Expectation, "caseKey" | "field">;
type Rule = (value: unknown, testCase: Case, ids: CaseIds) => Requirement[];

/** Qué exige en el informe cada clave de `expected`, según la tabla de secciones de la skill daily-brief. */
const RULES: Record<string, Rule> = {
  inMyTasks: (value, testCase, ids) => [{ section: SECTIONS.myTasks, id: workItemRef(testCase, ids), appears: value === true }],
  nextStep: (value, testCase, ids) => [
    value === null
      ? { section: SECTIONS.myTasks, id: workItemRef(testCase, ids), appears: true, lineExcludes: "Siguiente paso" }
      : { section: SECTIONS.myTasks, id: workItemRef(testCase, ids), appears: true, lineIncludes: `Siguiente paso: ${asText(value)}` },
  ],
  stale: (value, testCase, ids) => signalWithRisk(value, SECTIONS.myTasks, workItemRef(testCase, ids), "tarea estancada"),
  taskBlocked: (value, testCase, ids) => taskBlockedRequirements(value, testCase, workItemRef(testCase, ids)),
  lockReason: (value, testCase, ids) => [
    { section: SECTIONS.myTasks, id: workItemRef(testCase, ids), appears: true, lineIncludes: `motivo: ${asText(value)}` },
  ],
  prIsMine: (value, testCase, ids) => [{ section: SECTIONS.myPullRequests, id: pullRequestRef(testCase, ids), appears: value === true }],
  pendingMyReview: (value, testCase, ids) => [
    { section: SECTIONS.pendingMyReview, id: pullRequestRef(testCase, ids), appears: value === true },
  ],
  pendingTeamReview: (value, testCase, ids) => [
    { section: SECTIONS.pendingTeamReview, id: pullRequestRef(testCase, ids), appears: value === true },
  ],
  prBlocked: (value, testCase, ids) =>
    signalWithRisk(value, SECTIONS.myPullRequests, pullRequestRef(testCase, ids), "PR bloqueada", "PR propia bloqueada"),
  prApproved: (value, testCase, ids) => signal(value, SECTIONS.myPullRequests, pullRequestRef(testCase, ids), "PR aprobada"),
  aged: (value, testCase, ids) => agedRequirements(value, testCase, pullRequestRef(testCase, ids)),
};

/** Lee el informe por secciones. Fuera de una sección (título, cabecera) no hay hechos. */
export function parseBrief(markdown: string): ParsedBrief {
  const sections: ParsedBrief = new Map();
  let currentLines: BriefLine[] | undefined;
  for (const text of markdown.split("\n")) {
    const heading = /^#{2,3} (.+)$/.exec(text)?.[1];
    if (heading !== undefined) {
      currentLines = [];
      sections.set(heading.trim(), currentLines);
    } else if (currentLines && text.trim() !== "") {
      currentLines.push({ ownId: idsIn(text)[0], text });
    }
  }
  return sections;
}

/** Todos los IDs de un texto, en orden: "PR #6", "WI #12"… */
export function idsIn(text: string): string[] {
  return [...text.matchAll(ID_PATTERN)].map((match) => `${match[1]} #${match[2]}`);
}

/** La fecha del título "# Informe diario — AAAA-MM-DD", o `undefined` si no la tiene. */
export function briefDate(markdown: string): string | undefined {
  return /^# .*(\d{4}-\d{2}-\d{2})/m.exec(markdown)?.[1];
}

/** Las exigencias de cada caso. Una clave de `expected` sin regla se devuelve aparte: es un fallo, no se salta. */
export function caseExpectations(casesWithIds: CaseWithIds[]): { expectations: Expectation[]; undefinedKeys: Check[] } {
  const expectations: Expectation[] = [];
  const undefinedKeys: Check[] = [];
  for (const { testCase, ids } of casesWithIds) {
    for (const [field, value] of Object.entries(testCase.expected)) {
      const rule = RULES[field];
      if (!rule) {
        undefinedKeys.push({ passed: false, description: `${testCase.key} → ${field}: sin comprobación definida` });
        continue;
      }
      expectations.push(...rule(value, testCase, ids).map((requirement) => ({ caseKey: testCase.key, field, ...requirement })));
    }
  }
  return { expectations, undefinedKeys };
}

/** Informe completo: comprobaciones por caso, por sección, de las Sugerencias y la medida global. */
export function verifyBrief(markdown: string, snapshot: Snapshot, casesWithIds: CaseWithIds[]): BriefReport {
  const brief = parseBrief(markdown);
  const { expectations, undefinedKeys } = caseExpectations(casesWithIds);
  const existingIds = snapshotIds(snapshot);

  const caseChecks = [...expectations.map((expectation) => checkExpectation(brief, expectation)), ...undefinedKeys];
  const sections = FACT_SECTIONS.map((section) => checkSection(brief, section, expectations, existingIds));
  const suggestionsWithoutFact = checkSuggestions(brief);
  const global = checkGlobal(markdown, expectations, existingIds);

  const failedCaseChecks = caseChecks.filter((check) => !check.passed).length;
  const sectionFailures = sections.reduce(
    (total, result) => total + result.omissions.length + result.misplaced.length + result.invented.length,
    0,
  );
  return {
    caseChecks,
    sections,
    suggestionsWithoutFact,
    global,
    failures: failedCaseChecks + sectionFailures + suggestionsWithoutFact.length,
  };
}

function checkExpectation(brief: ParsedBrief, expectation: Expectation): Check {
  const lines = linesOf(brief, expectation.section).filter((line) => line.ownId === expectation.id);
  const description = describeExpectation(expectation);
  if (!expectation.appears) {
    return { passed: lines.length === 0, description: lines.length === 0 ? description : `${description} — está` };
  }
  if (lines.length === 0) return { passed: false, description: `${description} — no está` };

  const { lineIncludes, lineExcludes } = expectation;
  if (lineIncludes !== undefined && !lines.some((line) => line.text.includes(lineIncludes))) {
    return { passed: false, description: `${description} — la línea no dice «${lineIncludes}»` };
  }
  if (lineExcludes !== undefined && lines.some((line) => line.text.includes(lineExcludes))) {
    return { passed: false, description: `${description} — la línea dice «${lineExcludes}»` };
  }
  return { passed: true, description };
}

function describeExpectation(expectation: Expectation): string {
  const place = `${expectation.id} ${expectation.appears ? "en" : "fuera de"} «${expectation.section}»`;
  const lineText = expectation.lineIncludes
    ? ` con «${expectation.lineIncludes}»`
    : expectation.lineExcludes
      ? ` sin «${expectation.lineExcludes}»`
      : "";
  return `${expectation.caseKey} → ${expectation.field}: ${place}${lineText}`;
}

function checkSection(brief: ParsedBrief, section: string, expectations: Expectation[], existingIds: Set<string>): SectionResult {
  const expected = expectedIdsIn(expectations, section);
  const present = new Set(linesOf(brief, section).flatMap((line) => (line.ownId ? [line.ownId] : [])));
  const extra = [...present].filter((id) => !expected.has(id));
  return {
    section,
    hits: [...expected].filter((id) => present.has(id)),
    omissions: [...expected].filter((id) => !present.has(id)),
    misplaced: extra.filter((id) => existingIds.has(id)),
    invented: extra.filter((id) => !existingIds.has(id)),
  };
}

/** IDs de las Sugerencias que no aparecen en ninguna línea de Hechos (como hecho o como PR de una tarea). */
function checkSuggestions(brief: ParsedBrief): string[] {
  const factIds = new Set(FACT_SECTIONS.flatMap((section) => linesOf(brief, section).flatMap((line) => idsIn(line.text))));
  const suggestionIds = new Set(linesOf(brief, SECTIONS.suggestions).flatMap((line) => idsIn(line.text)));
  return [...suggestionIds].filter((id) => !factIds.has(id));
}

/** Sin mirar encabezados: qué IDs esperados salen en el texto y cuáles no existen en el snapshot. */
function checkGlobal(markdown: string, expectations: Expectation[], existingIds: Set<string>): GlobalResult {
  const expected = new Set(FACT_SECTIONS.flatMap((section) => [...expectedIdsIn(expectations, section)]));
  const found = new Set(idsIn(markdown));
  return {
    hits: [...expected].filter((id) => found.has(id)),
    omissions: [...expected].filter((id) => !found.has(id)),
    invented: [...found].filter((id) => !existingIds.has(id)),
  };
}

function expectedIdsIn(expectations: Expectation[], section: string): Set<string> {
  return new Set(
    expectations.filter((expectation) => expectation.section === section && expectation.appears).map((expectation) => expectation.id),
  );
}

function linesOf(brief: ParsedBrief, section: string): BriefLine[] {
  return brief.get(section) ?? [];
}

/** Los IDs que existen en el snapshot: cualquier PR (también la de una tarea) y las tareas de Mis tareas. */
function snapshotIds(snapshot: Snapshot): Set<string> {
  return new Set([
    ...allPullRequests(snapshot).map((pullRequest) => `PR #${pullRequest.id}`),
    ...snapshot.myTasks.map((task) => `WI #${task.id}`),
  ]);
}

/** Una señal en la línea del ID dentro de su sección. Con `false` no se exige nada. */
function signal(value: unknown, section: string, id: string, text: string): Requirement[] {
  return value === true ? [{ section, id, appears: true, lineIncludes: text }] : [];
}

/**
 * Una señal de riesgo del glosario: `text` en la línea de su sección y `riskText` en Riesgos (la plantilla dice
 * "PR propia bloqueada" en Riesgos y "PR bloqueada" en Mis PRs). Con `false`, fuera de Riesgos.
 */
function signalWithRisk(value: unknown, section: string, id: string, text: string, riskText = text): Requirement[] {
  if (value !== true) return [{ section: SECTIONS.risks, id, appears: false }];
  return [...signal(value, section, id, text), { section: SECTIONS.risks, id, appears: true, lineIncludes: riskText }];
}

/** "tarea bloqueada" lleva su motivo; si `expected` no trae `lockReason`, el motivo es "sin datos" (caso P). */
function taskBlockedRequirements(value: unknown, testCase: Case, id: string): Requirement[] {
  const requirements = signalWithRisk(value, SECTIONS.myTasks, id, "tarea bloqueada");
  if (value === true && testCase.expected.lockReason === undefined) {
    requirements.push({ section: SECTIONS.myTasks, id, appears: true, lineIncludes: "motivo: sin datos" });
  }
  return requirements;
}

/** "PR envejecida" se marca en su lista; solo es riesgo si está pendiente de mi revisión (glosario). */
function agedRequirements(value: unknown, testCase: Case, id: string): Requirement[] {
  if (testCase.expected.pendingTeamReview === true) return signal(value, SECTIONS.pendingTeamReview, id, "PR envejecida");
  return signalWithRisk(value, SECTIONS.pendingMyReview, id, "PR envejecida", "PR envejecida pendiente de mi revisión");
}

/** El valor de `expected` tal como lo escribe el informe: un texto va sin comillas. */
function asText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function workItemRef(testCase: Case, ids: CaseIds): string {
  if (ids.workItemId === undefined) throw new Error(`El caso ${testCase.key} exige un work item y no tiene su ID.`);
  return `WI #${ids.workItemId}`;
}

function pullRequestRef(testCase: Case, ids: CaseIds): string {
  if (ids.pullRequestId === undefined) throw new Error(`El caso ${testCase.key} exige una PR y no tiene su ID.`);
  return `PR #${ids.pullRequestId}`;
}
