// Salvaguardas del seed: si alguna falla, no se hace ninguna escritura. Sin red: clientes falsos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { organizationName, runSeed, type SeedDependencies } from "../scripts/lib/seed.js";
import type { Method, SeedClient } from "../scripts/lib/write-client.js";
import { loadCases } from "../src/adapters/fixtures/cases.js";

interface Call {
  method: Method;
  path: string;
}

/** La consulta WIQL es un POST, pero solo lee. Todo lo demás que no sea GET es escritura. */
const isWrite = (call: Call) => call.method !== "GET" && !call.path.endsWith("/_apis/wit/wiql");

class WriteAttempted extends Error {}

interface FakeAccount {
  userId: string;
  /** Repositorios que ve la cuenta. */
  repositoryCount: number;
  /** Work items que ya tiene el proyecto. */
  workItemCount?: number;
}

/** Lista de `count` elementos construidos a partir de su posición. */
const listOf = <T>(count: number, build: (position: number) => T) => Array.from({ length: count }, (_value, position) => build(position));

/** Cliente falso: responde a las lecturas del seed y lanza WriteAttempted ante la primera escritura. */
function fakeClient(account: FakeAccount, calls: Call[]): SeedClient {
  const respond = (method: Method, path: string): unknown => {
    calls.push({ method, path });
    if (isWrite({ method, path })) throw new WriteAttempted(`${method} ${path}`);
    if (path === "_apis/connectionData") {
      return {
        authenticatedUser: { id: account.userId, providerDisplayName: account.userId, properties: { Account: { $value: `${account.userId}@demo.test` } } },
      };
    }
    if (path.endsWith("/_apis/git/repositories")) {
      return { value: listOf(account.repositoryCount, (position) => ({ id: `repo-${position}`, name: "TFM Demo" })) };
    }
    if (path.startsWith("_apis/projects/")) return { defaultTeam: { name: "TFM Demo Team" } };
    if (path.endsWith("/_apis/wit/wiql")) return { workItems: listOf(account.workItemCount ?? 0, (position) => ({ id: position + 1 })) };
    return {};
  };
  return {
    async get<T>(path: string) {
      return respond("GET", path) as T;
    },
    async request<T>(method: Method, path: string) {
      return respond(method, path) as T;
    },
  };
}

interface Scenario {
  answers?: [string, string];
  currentUserAccount?: Partial<FakeAccount>;
  /** `null`: sin compañero configurado. */
  teammateAccount?: Partial<FakeAccount> | null;
}

function buildScenario({ answers = ["TFM-Demo", "TFM Demo"], currentUserAccount = {}, teammateAccount = {} }: Scenario) {
  const calls: Call[] = [];
  const pendingAnswers = [...answers];
  const dependencies: SeedDependencies = {
    orgUrl: "https://dev.azure.com/TFM-Demo",
    project: "TFM Demo",
    cases: loadCases(),
    currentUserClient: fakeClient({ userId: "me", repositoryCount: 1, ...currentUserAccount }, calls),
    teammateClient: teammateAccount === null ? undefined : fakeClient({ userId: "mate", repositoryCount: 1, ...teammateAccount }, calls),
    async ask() {
      return pendingAnswers.shift() ?? "";
    },
    saveDemoIds() {
      throw new Error("no debería llegar a guardar IDs");
    },
  };
  return { dependencies, calls };
}

test("organización incorrecta: no hace ninguna petición", async () => {
  const { dependencies, calls } = buildScenario({ answers: ["otra-org", "TFM Demo"] });

  await assert.rejects(runSeed(dependencies), /Confirmación incorrecta/);
  assert.equal(calls.length, 0);
});

test("proyecto incorrecto: no hace ninguna petición", async () => {
  const { dependencies, calls } = buildScenario({ answers: ["TFM-Demo", "Otro"] });

  await assert.rejects(runSeed(dependencies), /Confirmación incorrecta/);
  assert.equal(calls.length, 0);
});

test("compañero con la misma cuenta: no escribe", async () => {
  const { dependencies, calls } = buildScenario({ teammateAccount: { userId: "me" } });

  await assert.rejects(runSeed(dependencies), /misma cuenta/);
  assert.equal(calls.filter(isWrite).length, 0);
});

test("compañero sin acceso a repositorios: no escribe", async () => {
  const { dependencies, calls } = buildScenario({ teammateAccount: { repositoryCount: 0 } });

  await assert.rejects(runSeed(dependencies), /compañero no ve ningún repositorio/);
  assert.equal(calls.filter(isWrite).length, 0);
});

test("proyecto sin repositorio: avisa de eso, no de permisos, y no escribe", async () => {
  const { dependencies, calls } = buildScenario({ currentUserAccount: { repositoryCount: 0 }, teammateAccount: { repositoryCount: 0 } });

  await assert.rejects(runSeed(dependencies), /no tiene ningún repositorio Git/);
  assert.equal(calls.filter(isWrite).length, 0);
});

test("proyecto con work items: no escribe", async () => {
  const { dependencies, calls } = buildScenario({ currentUserAccount: { workItemCount: 3 } });

  await assert.rejects(runSeed(dependencies), /ya tiene 3 work items/);
  assert.equal(calls.filter(isWrite).length, 0);
});

test("control: si todo es correcto, sí llega a escribir", async () => {
  const { dependencies, calls } = buildScenario({});

  await assert.rejects(runSeed(dependencies), WriteAttempted);
  assert.equal(calls.filter(isWrite).length, 1);
});

test("nombre de la organización a partir de la URL", () => {
  assert.equal(organizationName("https://dev.azure.com/TFM-Demo"), "TFM-Demo");
  assert.equal(organizationName("https://dev.azure.com/TFM-Demo/"), "TFM-Demo");
  assert.equal(organizationName("https://mi-org.visualstudio.com"), "mi-org");
});
