// Paso 8: comprueba un informe diario contra fixtures/expected.json. Solo lee archivos locales; no llama a la API.
//   npm run verify:brief                      → output/brief-<fecha del snapshot>.md, IDs de demo-ids.json
//   npm run verify:brief -- <ruta>            → otro informe (p. ej. una ejecución del eval)
//   npm run verify:brief -- --fixtures [ruta] → snapshot del adaptador falso, IDs de fixtureCaseIds
import { existsSync, readFileSync } from "node:fs";
import { loadCases } from "../src/adapters/fixtures/cases.js";
import { FIXTURE_ME, fixtureCaseIds } from "../src/adapters/fixtures/fixture-source.js";
import type { Snapshot } from "../src/domain/types.js";
import { briefDate, verifyBrief, type BriefReport, type CaseWithIds, type SectionResult } from "./lib/brief-check.js";
import { SNAPSHOT_PATH, caseIdsFromDemo, checkLine, readDemoIds, reportFailures, runScript } from "./lib/demo.js";

function main(): void {
  const argumentList = process.argv.slice(2);
  const usesFixtures = argumentList.includes("--fixtures");
  const snapshot = readSnapshot(usesFixtures);
  const briefPath = argumentList.find((argument) => !argument.startsWith("--")) ?? `output/brief-${snapshot.generatedAt.slice(0, 10)}.md`;
  const casesWithIds = usesFixtures ? fixtureCasesWithIds() : demoCasesWithIds();
  if (!casesWithIds) return;

  const markdown = readText(briefPath);
  console.log(`Informe:  ${briefPath}`);
  console.log(`Snapshot: ${SNAPSHOT_PATH} (${snapshot.generatedAt}), IDs de ${usesFixtures ? "fixtures" : "demo-ids.json"}`);
  warnIfDatesDiffer(markdown, snapshot);

  const report = verifyBrief(markdown, snapshot, casesWithIds);
  printReport(report);
  reportFailures(report.failures, "comprobación(es)");
}

/** El snapshot debe venir del mismo adaptador que los IDs; si no, todos los IDs fallarían sin decir por qué. */
function readSnapshot(usesFixtures: boolean): Snapshot {
  const snapshot = JSON.parse(readText(SNAPSHOT_PATH)) as Snapshot;
  const isFixtureSnapshot = snapshot.user.id === FIXTURE_ME.id;
  if (isFixtureSnapshot !== usesFixtures) {
    throw new Error(
      isFixtureSnapshot
        ? `${SNAPSHOT_PATH} viene del adaptador falso: añade --fixtures.`
        : `${SNAPSHOT_PATH} no viene del adaptador falso: quita --fixtures o ejecuta "npm run collect -- --fixtures".`,
    );
  }
  return snapshot;
}

function readText(path: string): string {
  if (!existsSync(path)) throw new Error(`No existe ${path}.`);
  return readFileSync(path, "utf8");
}

function fixtureCasesWithIds(): CaseWithIds[] {
  return loadCases().map((testCase, index) => ({ testCase, ids: fixtureCaseIds(testCase, index) }));
}

/** En la demo solo cuentan los casos que creó el seed (los de fixtures no tienen ID), como en `collect`. */
function demoCasesWithIds(): CaseWithIds[] | undefined {
  const demoIds = readDemoIds();
  if (!demoIds) return undefined;
  return loadCases().flatMap((testCase) => {
    const ids = caseIdsFromDemo(testCase, demoIds);
    return ids ? [{ testCase, ids }] : [];
  });
}

/** Un informe de otra recogida tendría otros datos: se avisa, pero se comprueba igual. */
function warnIfDatesDiffer(markdown: string, snapshot: Snapshot): void {
  const date = briefDate(markdown);
  const snapshotDate = snapshot.generatedAt.slice(0, 10);
  if (date !== snapshotDate) console.log(`AVISO: el informe es de ${date ?? "sin fecha"} y el snapshot de ${snapshotDate}.`);
}

function printReport(report: BriefReport): void {
  console.log("\nCasos (expected.json):");
  for (const check of report.caseChecks) console.log(checkLine(check.passed, check.description));

  console.log("\nPor sección:");
  for (const result of report.sections) console.log(checkLine(sectionPassed(result), describeSection(result)));

  console.log("\nSugerencias (cada ID debe estar en Hechos):");
  const withoutFact = report.suggestionsWithoutFact;
  console.log(checkLine(withoutFact.length === 0, withoutFact.length === 0 ? "todas citan hechos" : `sin hecho: ${withoutFact.join(", ")}`));

  const global = report.global;
  console.log("\nGlobal (IDs en cualquier parte del informe; para comparar con el prompt plano, no cuenta como fallo):");
  console.log(`  aciertos ${global.hits.length}/${global.hits.length + global.omissions.length}`);
  console.log(`  omisiones: ${listOrNone(global.omissions)}`);
  console.log(`  inventados: ${listOrNone(global.invented)}`);
}

function sectionPassed(result: SectionResult): boolean {
  return result.omissions.length + result.misplaced.length + result.invented.length === 0;
}

function describeSection(result: SectionResult): string {
  const counts = `${result.hits.length} aciertos, ${result.omissions.length} omisiones, ${result.misplaced.length} mal clasificados, ${result.invented.length} inventados`;
  const details = [
    ["omisiones", result.omissions],
    ["mal clasificados", result.misplaced],
    ["inventados", result.invented],
  ] as const;
  const listed = details.filter(([, ids]) => ids.length > 0).map(([label, ids]) => `${label}: ${ids.join(", ")}`);
  return `${result.section}: ${counts}${listed.length > 0 ? ` — ${listed.join("; ")}` : ""}`;
}

function listOrNone(ids: string[]): string {
  return ids.length === 0 ? "ninguno" : ids.join(", ");
}

// `main` no espera nada (solo lee archivos); `runScript` recibe una promesa para mostrar los errores igual.
runScript(() => Promise.resolve().then(main));
