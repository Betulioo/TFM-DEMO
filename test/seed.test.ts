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
const isWrite = (c: Call) => c.method !== "GET" && !c.path.endsWith("/_apis/wit/wiql");

class WriteAttempted extends Error {}

interface FakeOptions {
  userId: string;
  repos: number;
  workItems?: number;
}

/** Cliente falso: responde a las lecturas del seed y lanza WriteAttempted ante la primera escritura. */
function fakeClient(opts: FakeOptions, calls: Call[]): SeedClient {
  const respond = (method: Method, path: string): unknown => {
    calls.push({ method, path });
    if (isWrite({ method, path })) throw new WriteAttempted(`${method} ${path}`);
    if (path === "_apis/connectionData") {
      return { authenticatedUser: { id: opts.userId, providerDisplayName: opts.userId, properties: { Account: { $value: `${opts.userId}@demo.test` } } } };
    }
    if (path.endsWith("/_apis/git/repositories")) return { value: Array.from({ length: opts.repos }, (_, i) => ({ id: `repo-${i}`, name: "TFM Demo" })) };
    if (path.startsWith("_apis/projects/")) return { defaultTeam: { name: "TFM Demo Team" } };
    if (path.endsWith("/_apis/wit/wiql")) return { workItems: Array.from({ length: opts.workItems ?? 0 }, (_, i) => ({ id: i + 1 })) };
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
  me?: Partial<FakeOptions>;
  mate?: Partial<FakeOptions> | null;
}

function setup({ answers = ["TFM-Demo", "TFM Demo"], me = {}, mate = {} }: Scenario) {
  const calls: Call[] = [];
  const pending = [...answers];
  const deps: SeedDependencies = {
    orgUrl: "https://dev.azure.com/TFM-Demo",
    project: "TFM Demo",
    cases: loadCases(),
    currentUserClient: fakeClient({ userId: "me", repos: 1, ...me }, calls),
    teammateClient: mate === null ? undefined : fakeClient({ userId: "mate", repos: 1, ...mate }, calls),
    async ask() {
      return pending.shift() ?? "";
    },
    saveDemoIds() {
      throw new Error("no debería llegar a guardar IDs");
    },
  };
  return { deps, calls };
}

test("organización incorrecta: no hace ninguna petición", async () => {
  const { deps, calls } = setup({ answers: ["otra-org", "TFM Demo"] });
  await assert.rejects(runSeed(deps), /Confirmación incorrecta/);
  assert.equal(calls.length, 0);
});

test("proyecto incorrecto: no hace ninguna petición", async () => {
  const { deps, calls } = setup({ answers: ["TFM-Demo", "Otro"] });
  await assert.rejects(runSeed(deps), /Confirmación incorrecta/);
  assert.equal(calls.length, 0);
});

test("compañero con la misma cuenta: no escribe", async () => {
  const { deps, calls } = setup({ mate: { userId: "me" } });
  await assert.rejects(runSeed(deps), /misma cuenta/);
  assert.equal(calls.filter(isWrite).length, 0);
});

test("compañero sin acceso a repositorios: no escribe", async () => {
  const { deps, calls } = setup({ mate: { repos: 0 } });
  await assert.rejects(runSeed(deps), /compañero no ve ningún repositorio/);
  assert.equal(calls.filter(isWrite).length, 0);
});

test("proyecto sin repositorio: avisa de eso, no de permisos, y no escribe", async () => {
  const { deps, calls } = setup({ me: { repos: 0 }, mate: { repos: 0 } });
  await assert.rejects(runSeed(deps), /no tiene ningún repositorio Git/);
  assert.equal(calls.filter(isWrite).length, 0);
});

test("proyecto con work items: no escribe", async () => {
  const { deps, calls } = setup({ me: { workItems: 3 } });
  await assert.rejects(runSeed(deps), /ya tiene 3 work items/);
  assert.equal(calls.filter(isWrite).length, 0);
});

test("control: si todo es correcto, sí llega a escribir", async () => {
  const { deps, calls } = setup({});
  await assert.rejects(runSeed(deps), WriteAttempted);
  assert.equal(calls.filter(isWrite).length, 1);
});

test("nombre de la organización a partir de la URL", () => {
  assert.equal(organizationName("https://dev.azure.com/TFM-Demo"), "TFM-Demo");
  assert.equal(organizationName("https://dev.azure.com/TFM-Demo/"), "TFM-Demo");
  assert.equal(organizationName("https://mi-org.visualstudio.com"), "mi-org");
});
