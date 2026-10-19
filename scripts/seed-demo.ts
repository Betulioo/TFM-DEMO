// Paso 3: siembra el proyecto demo con los casos de fixtures/expected.json.
// Entrada fina: lee .env y la terminal, y delega en scripts/lib/seed.ts (salvaguardas descritas allí).
import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { loadConfig, optionalEnv } from "../src/config.js";
import { loadCases } from "../src/adapters/fixtures/cases.js";
import { AzdoWriteClient } from "./lib/write-client.js";
import { runSeed } from "./lib/seed.js";

const DEMO_IDS_PATH = "fixtures/demo-ids.json";

async function main(): Promise<void> {
  const config = loadConfig("AZDO_PAT_SEED");
  const teammatePat = optionalEnv("AZDO_PAT_TEAMMATE");
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    await runSeed({
      orgUrl: config.orgUrl,
      project: config.project,
      cases: loadCases(),
      me: new AzdoWriteClient(config.orgUrl, config.pat),
      mate: teammatePat ? new AzdoWriteClient(config.orgUrl, teammatePat) : undefined,
      userEmail: optionalEnv("AZDO_USER_EMAIL"),
      ask: (question) => rl.question(question),
      saveDemoIds: (data) => {
        writeFileSync(DEMO_IDS_PATH, `${JSON.stringify(data, null, 2)}\n`);
        console.log(`IDs guardados en ${DEMO_IDS_PATH}`);
      },
    });
  } finally {
    rl.close();
  }
}

main().catch((error: unknown) => {
  console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
