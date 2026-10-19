// Paso 5: lista los work items de la iteración actual, marca "Mis tareas" y, sobre la demo,
// los compara con fixtures/demo-ids.json y el campo `inMyTasks` de expected.json.
//   npm run list:tasks               → API real (token de solo lectura)
//   npm run list:tasks -- --fixtures → adaptador falso
import { loadCases } from "../src/adapters/fixtures/cases.js";
import { myTasks } from "../src/domain/rules.js";
import type { WorkItem } from "../src/domain/types.js";
import { DEMO_IDS_PATH, checkLine, readDemoIds, reportFailures, runScript, sourceFromArguments } from "./lib/demo.js";

async function main(): Promise<void> {
  const { source, usesFixtures } = sourceFromArguments(process.argv);

  const user = await source.currentUser();
  const iteration = await source.currentIteration();
  if (!iteration) {
    console.log("Sin iteración actual: el equipo no tiene ninguna iteración que incluya hoy.");
    return;
  }
  const workItems = await source.workItemsInIteration(iteration.id);
  const myTaskIds = new Set(myTasks(workItems, user).map((workItem) => workItem.id));

  const startDate = iteration.startDate?.slice(0, 10) ?? "sin datos";
  const finishDate = iteration.finishDate?.slice(0, 10) ?? "sin datos";
  console.log(`Usuario:   ${user.displayName}`);
  console.log(`Iteración: ${iteration.name} (${startDate} → ${finishDate})\n`);
  console.log(`Work items de la iteración (${workItems.length}); [*] = mis tareas (${myTaskIds.size}):`);
  for (const workItem of workItems) console.log(describeWorkItem(workItem, myTaskIds.has(workItem.id)));
  console.log("");

  if (!usesFixtures) compareWithDemoIds(myTaskIds);
}

function describeWorkItem(workItem: WorkItem, isMyTask: boolean): string {
  const pullRequests = workItem.pullRequestIds.map((id) => `PR #${id}`).join(", ") || "sin PR";
  const assignee = workItem.assignedTo?.displayName ?? "sin asignar";
  const state = `${workItem.state} (${workItem.stateCategory})`;
  return `  ${isMyTask ? "[*]" : "[ ]"} WI #${workItem.id} ${workItem.type} | ${state} | ${assignee} | ${pullRequests} | ${workItem.title}`;
}

/** Comprueba cada work item sembrado contra `expected.inMyTasks`. */
function compareWithDemoIds(myTaskIds: Set<number>): void {
  const demoIds = readDemoIds();
  if (!demoIds) return;
  let failures = 0;

  console.log(`Comparación con ${DEMO_IDS_PATH}:`);
  for (const testCase of loadCases()) {
    const id = demoIds.workItems[testCase.key];
    const expectedInMyTasks = testCase.expected.inMyTasks;
    if (id === undefined || typeof expectedInMyTasks !== "boolean") continue;

    const passed = myTaskIds.has(id) === expectedInMyTasks;
    if (!passed) failures++;
    console.log(checkLine(passed, `${testCase.key} → WI #${id} (${expectedInMyTasks ? "en" : "fuera de"} mis tareas)`));
  }

  reportFailures(failures);
}

runScript(main);
