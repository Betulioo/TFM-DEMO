// Paso 4: lista las PRs que devuelve el puerto y, sobre la demo, las compara con fixtures/demo-ids.json.
//   npm run list:prs               → API real (token de solo lectura)
//   npm run list:prs -- --fixtures → adaptador falso
import { loadCases } from "../src/adapters/fixtures/cases.js";
import type { PullRequest } from "../src/domain/types.js";
import type { DevOpsSource } from "../src/ports/devops-source.js";
import { DEMO_IDS_PATH, checkLine, readDemoIds, reportFailures, runScript, sourceFromArguments } from "./lib/demo.js";

async function main(): Promise<void> {
  const { source, usesFixtures } = sourceFromArguments(process.argv);

  const user = await source.currentUser();
  const toReview = await source.pullRequestsToReview();
  const mine = await source.myPullRequests();

  console.log(`Usuario: ${user.displayName}\n`);
  printPullRequests("PRs activas donde soy revisor", toReview);
  printPullRequests("Mis PRs activas", mine);

  if (!usesFixtures) await compareWithDemoIds(source, toReview, mine);
}

function printPullRequests(title: string, pullRequests: PullRequest[]): void {
  console.log(`${title} (${pullRequests.length}):`);
  for (const pullRequest of pullRequests) {
    const votes = pullRequest.reviewers.map((reviewer) => `${reviewer.displayName}=${reviewer.vote}`).join(", ") || "sin revisores";
    const draft = pullRequest.isDraft ? " [borrador]" : "";
    console.log(
      `  PR #${pullRequest.id}${draft} ${pullRequest.title} | ${pullRequest.author.displayName} | ${pullRequest.createdAt.slice(0, 10)} | ${votes}`,
    );
  }
  console.log("");
}

/** Comprueba que cada PR sembrada aparece donde debe, según los casos de expected.json. */
async function compareWithDemoIds(source: DevOpsSource, toReview: PullRequest[], mine: PullRequest[]): Promise<void> {
  const demoIds = readDemoIds();
  if (!demoIds) return;
  const reviewIds = new Set(toReview.map((pullRequest) => pullRequest.id));
  const mineIds = new Set(mine.map((pullRequest) => pullRequest.id));
  let failures = 0;

  console.log(`Comparación con ${DEMO_IDS_PATH}:`);
  for (const testCase of loadCases()) {
    const id = demoIds.pullRequests[testCase.key];
    if (id === undefined) continue;

    let expected: string;
    let passed: boolean;
    if (testCase.setup.entity === "pullRequest") {
      expected = "activa, soy revisor";
      passed = reviewIds.has(id) && !mineIds.has(id);
    } else if (testCase.setup.pr?.status === "completed") {
      expected = "completada";
      passed = (await source.pullRequestById(id))?.status === "completed" && !mineIds.has(id);
    } else {
      expected = "activa, mía";
      passed = mineIds.has(id) && !reviewIds.has(id);
    }
    if (!passed) failures++;
    console.log(checkLine(passed, `${testCase.key} → PR #${id} (${expected})`));
  }

  reportFailures(failures);
}

runScript(main);
