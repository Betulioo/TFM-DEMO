// Utilidades compartidas por los scripts que trabajan sobre el proyecto demo (list-prs, list-tasks, collect, seed-demo).
import { existsSync, readFileSync } from "node:fs";
import { loadConfig, loadLockReasonField } from "../../src/config.js";
import { AzdoReadOnlyClient } from "../../src/adapters/azdo/read-only-client.js";
import { AzdoSource } from "../../src/adapters/azdo/azdo-source.js";
import { FixtureSource } from "../../src/adapters/fixtures/fixture-source.js";
import type { DevOpsSource } from "../../src/ports/devops-source.js";
import type { Case } from "../../src/adapters/fixtures/cases.js";
import type { CaseIds } from "./snapshot-check.js";

export const DEMO_IDS_PATH = "fixtures/demo-ids.json";
export const SNAPSHOT_PATH = "output/snapshot.json";

/** IDs creados por el seed en el proyecto demo, por clave de caso. */
export interface DemoIds {
  generatedAt: string;
  project: string;
  workItems: Record<string, number>;
  pullRequests: Record<string, number>;
  skipped: string[];
}

/**
 * `--fixtures` elige el adaptador falso; si no, el real con el token de solo lectura. `now` fija las fechas del
 * adaptador falso: quien también calcule con fechas (la recogida) debe pasar el mismo.
 */
export function sourceFromArguments(
  argumentList: string[],
  now = new Date(),
): { source: DevOpsSource; usesFixtures: boolean } {
  const usesFixtures = argumentList.includes("--fixtures");
  return { source: usesFixtures ? FixtureSource.fromFile(now) : createRealSource(), usesFixtures };
}

function createRealSource(): DevOpsSource {
  const config = loadConfig("AZDO_PAT");
  return new AzdoSource(new AzdoReadOnlyClient(config), config.project, config.orgUrl, loadLockReasonField());
}

/** Lee `fixtures/demo-ids.json`, o avisa y devuelve `undefined` si el seed no se ha ejecutado. */
export function readDemoIds(): DemoIds | undefined {
  if (!existsSync(DEMO_IDS_PATH)) {
    console.log(`No existe ${DEMO_IDS_PATH}: ejecuta antes el seed.`);
    return undefined;
  }
  return JSON.parse(readFileSync(DEMO_IDS_PATH, "utf8")) as DemoIds;
}

/** IDs de un caso en la demo, o `undefined` si el seed no lo creó (casos solo de fixtures o saltados). */
export function caseIdsFromDemo(testCase: Case, demoIds: DemoIds): CaseIds | undefined {
  const ids = { workItemId: demoIds.workItems[testCase.key], pullRequestId: demoIds.pullRequests[testCase.key] };
  return ids.workItemId === undefined && ids.pullRequestId === undefined ? undefined : ids;
}

/** Línea de cada comprobación: `OK` o `FALLO` alineados. */
export function checkLine(passed: boolean, text: string): string {
  return `  ${passed ? "OK   " : "FALLO"} ${text}`;
}

/** Resumen final de una comparación; si hay fallos, el script termina con código 1. */
export function reportFailures(failures: number, unit = "caso(s)"): void {
  console.log(failures === 0 ? "\nTodo coincide." : `\n${failures} ${unit} no coinciden.`);
  if (failures > 0) process.exitCode = 1;
}

/** Ejecuta el `main` de un script y muestra los errores sin la traza. */
export function runScript(main: () => Promise<void>): void {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
