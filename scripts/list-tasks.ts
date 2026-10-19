// Paso 5: lista los work items de la iteración actual, marca "Mis tareas" y, sobre la demo,
// los compara con fixtures/demo-ids.json y el campo `inMyTasks` de expected.json.
//   npm run list:tasks               → API real (token de solo lectura)
//   npm run list:tasks -- --fixtures → adaptador falso
import { existsSync, readFileSync } from "node:fs";
import { loadConfig } from "../src/config.js";
import { AzdoReadOnlyClient } from "../src/adapters/azdo/read-only-client.js";
import { AzdoSource } from "../src/adapters/azdo/azdo-source.js";
import { FixtureSource } from "../src/adapters/fixtures/fixture-source.js";
import { loadCases } from "../src/adapters/fixtures/cases.js";
import { myTasks } from "../src/domain/rules.js";
import type { DevOpsSource } from "../src/ports/devops-source.js";

const DEMO_IDS_PATH = "fixtures/demo-ids.json";

async function main(): Promise<void> {
  const useFixtures = process.argv.includes("--fixtures");
  const source: DevOpsSource = useFixtures ? FixtureSource.fromFile(new Date()) : realSource();

  const user = await source.currentUser();
  const iteration = await source.currentIteration();
  if (!iteration) {
    console.log("Sin iteración actual: el equipo no tiene ninguna iteración que incluya hoy.");
    return;
  }
  const items = await source.workItemsInIteration(iteration.id);
  const mine = new Set(myTasks(items, user).map((w) => w.id));

  console.log(`Usuario:   ${user.displayName}`);
  console.log(`Iteración: ${iteration.name} (${iteration.startDate?.slice(0, 10) ?? "sin datos"} → ${iteration.finishDate?.slice(0, 10) ?? "sin datos"})\n`);
  console.log(`Work items de la iteración (${items.length}); [*] = mis tareas (${mine.size}):`);
  for (const w of items) {
    const prs = w.pullRequestIds.map((id) => `PR #${id}`).join(", ") || "sin PR";
    console.log(`  ${mine.has(w.id) ? "[*]" : "[ ]"} WI #${w.id} ${w.type} | ${w.state} (${w.stateCategory}) | ${w.assignedTo?.displayName ?? "sin asignar"} | ${prs} | ${w.title}`);
  }
  console.log("");

  if (!useFixtures) compareWithDemoIds(mine);
}

function realSource(): DevOpsSource {
  const config = loadConfig("AZDO_PAT");
  return new AzdoSource(new AzdoReadOnlyClient(config), config.project);
}

/** Comprueba cada work item sembrado contra `expected.inMyTasks`. */
function compareWithDemoIds(mine: Set<number>): void {
  if (!existsSync(DEMO_IDS_PATH)) {
    console.log(`No existe ${DEMO_IDS_PATH}: ejecuta antes el seed.`);
    return;
  }
  const demoIds = JSON.parse(readFileSync(DEMO_IDS_PATH, "utf8")) as { workItems: Record<string, number> };
  let failures = 0;

  console.log(`Comparación con ${DEMO_IDS_PATH}:`);
  for (const c of loadCases()) {
    const id = demoIds.workItems[c.key];
    if (id === undefined || typeof c.expected.inMyTasks !== "boolean") continue;
    const ok = mine.has(id) === c.expected.inMyTasks;
    if (!ok) failures++;
    console.log(`  ${ok ? "OK   " : "FALLO"} ${c.key} → WI #${id} (${c.expected.inMyTasks ? "en" : "fuera de"} mis tareas)`);
  }

  console.log(failures === 0 ? "\nTodo coincide." : `\n${failures} caso(s) no coinciden.`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
