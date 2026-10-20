// Paso 6: recogida. Escribe output/snapshot.json y, sobre la demo, lo compara con expected.json usando los IDs de
// fixtures/demo-ids.json.
//   npm run collect               → API real (token de solo lectura)
//   npm run collect -- --fixtures → adaptador falso
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadCases } from "../src/adapters/fixtures/cases.js";
import { collectSnapshot } from "../src/application/collect-snapshot.js";
import { loadThresholds } from "../src/config.js";
import type { Snapshot } from "../src/domain/types.js";
import { DEMO_IDS_PATH, checkLine, readDemoIds, reportFailures, runScript, sourceFromArguments } from "./lib/demo.js";
import { checkCase } from "./lib/snapshot-check.js";

const SNAPSHOT_PATH = "output/snapshot.json";

async function main(): Promise<void> {
  const now = new Date();
  const thresholds = loadThresholds();
  const { source, usesFixtures } = sourceFromArguments(process.argv, now);

  const snapshot = await collectSnapshot(source, now, thresholds);
  mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
  writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);

  printSummary(snapshot);
  if (!usesFixtures) compareWithDemoIds(snapshot);
}

function printSummary(snapshot: Snapshot): void {
  console.log(`Snapshot escrito en ${SNAPSHOT_PATH}`);
  console.log(`Usuario:   ${snapshot.user.displayName}`);
  console.log(`Iteración: ${snapshot.iteration?.name ?? "sin datos"}`);
  console.log(`Umbrales:  PR envejecida ${snapshot.thresholds.agedPrDays} días, tarea estancada ${snapshot.thresholds.staleTaskDays} días`);
  console.log(`Mis tareas: ${snapshot.myTasks.length}`);
  console.log(`PRs pendientes de mi revisión: ${snapshot.pullRequestsPendingMyReview.length}`);
  console.log(`PRs pendientes del equipo: ${snapshot.pullRequestsPendingTeamReview.length}`);
  console.log(`Mis PRs: ${snapshot.myPullRequests.length}\n`);
}

/** Comprueba cada caso sembrado (los que tienen ID en demo-ids.json) contra su `expected`. */
function compareWithDemoIds(snapshot: Snapshot): void {
  const demoIds = readDemoIds();
  if (!demoIds) return;
  let failures = 0;

  console.log(`Comparación con ${DEMO_IDS_PATH} y expected.json:`);
  for (const testCase of loadCases()) {
    const ids = { workItemId: demoIds.workItems[testCase.key], pullRequestId: demoIds.pullRequests[testCase.key] };
    if (ids.workItemId === undefined && ids.pullRequestId === undefined) continue;

    for (const check of checkCase(snapshot, testCase, ids)) {
      if (!check.passed) failures++;
      console.log(checkLine(check.passed, check.description));
    }
  }

  reportFailures(failures);
}

runScript(main);
