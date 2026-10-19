// Paso 4: lista las PRs que devuelve el puerto y, sobre la demo, las compara con fixtures/demo-ids.json.
//   npm run list:prs               → API real (token de solo lectura)
//   npm run list:prs -- --fixtures → adaptador falso
import { existsSync, readFileSync } from "node:fs";
import { loadConfig } from "../src/config.js";
import { AzdoReadOnlyClient } from "../src/azdo/read-only-client.js";
import { AzdoSource } from "../src/adapters/azdo-source.js";
import { FixtureSource } from "../src/adapters/fixture-source.js";
import { loadCases } from "../src/fixtures/cases.js";
import type { PullRequest } from "../src/domain/types.js";
import type { DevOpsSource } from "../src/ports/devops-source.js";

const DEMO_IDS_PATH = "fixtures/demo-ids.json";

async function main(): Promise<void> {
  const useFixtures = process.argv.includes("--fixtures");
  const source: DevOpsSource = useFixtures ? FixtureSource.fromFile(new Date()) : realSource();

  const user = await source.currentUser();
  const toReview = await source.pullRequestsToReview();
  const mine = await source.myPullRequests();

  console.log(`Usuario: ${user.displayName}\n`);
  printList("PRs activas donde soy revisor", toReview);
  printList("Mis PRs activas", mine);

  if (!useFixtures) await compareWithDemoIds(source, toReview, mine);
}

function realSource(): DevOpsSource {
  const config = loadConfig("AZDO_PAT");
  return new AzdoSource(new AzdoReadOnlyClient(config), config.project);
}

function printList(title: string, prs: PullRequest[]): void {
  console.log(`${title} (${prs.length}):`);
  for (const pr of prs) {
    const votes = pr.reviewers.map((r) => `${r.displayName}=${r.vote}`).join(", ") || "sin revisores";
    console.log(`  PR #${pr.id}${pr.isDraft ? " [borrador]" : ""} ${pr.title} | ${pr.author.displayName} | ${pr.createdAt.slice(0, 10)} | ${votes}`);
  }
  console.log("");
}

/** Comprueba que cada PR sembrada aparece donde debe, según los casos de expected.json. */
async function compareWithDemoIds(source: DevOpsSource, toReview: PullRequest[], mine: PullRequest[]): Promise<void> {
  if (!existsSync(DEMO_IDS_PATH)) {
    console.log(`No existe ${DEMO_IDS_PATH}: ejecuta antes el seed.`);
    return;
  }
  const demoIds = JSON.parse(readFileSync(DEMO_IDS_PATH, "utf8")) as { pullRequests: Record<string, number> };
  const reviewIds = new Set(toReview.map((pr) => pr.id));
  const mineIds = new Set(mine.map((pr) => pr.id));
  let failures = 0;

  console.log(`Comparación con ${DEMO_IDS_PATH}:`);
  for (const c of loadCases()) {
    const id = demoIds.pullRequests[c.key];
    if (id === undefined) continue;

    let expected: string;
    let ok: boolean;
    if (c.setup.entity === "pullRequest") {
      expected = "activa, soy revisor";
      ok = reviewIds.has(id) && !mineIds.has(id);
    } else if (c.setup.pr?.status === "completed") {
      expected = "completada";
      ok = (await source.pullRequestById(id))?.status === "completed" && !mineIds.has(id);
    } else {
      expected = "activa, mía";
      ok = mineIds.has(id) && !reviewIds.has(id);
    }
    if (!ok) failures++;
    console.log(`  ${ok ? "OK   " : "FALLO"} ${c.key} → PR #${id} (${expected})`);
  }

  console.log(failures === 0 ? "\nTodo coincide." : `\n${failures} caso(s) no coinciden.`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
