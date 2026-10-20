// Prueba el adaptador real con un lector falso: sin red y sin token.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AzdoSource, type ApiPullRequest, type ApiWorkItem } from "../azdo-source.js";
import { AzdoHttpError, type AzdoReader } from "../read-only-client.js";
import { listOf } from "#test-helpers/test-data.js";

interface Call {
  path: string;
  params: Record<string, string>;
}

function buildApiPullRequest(id: number, overrides: Partial<ApiPullRequest> = {}): ApiPullRequest {
  return {
    pullRequestId: id,
    title: `PR ${id}`,
    status: "active",
    createdBy: { id: "author-id", displayName: "Autor" },
    creationDate: "2026-10-15T08:00:00Z",
    sourceRefName: `refs/heads/feat/${id}_tarea`,
    reviewers: [{ id: "me-id", displayName: "Yo", vote: 0 }],
    ...overrides,
  };
}

/** Lector falso: responde según la ruta y guarda las llamadas. */
function fakeReader(respond: (call: Call) => unknown): { reader: AzdoReader; calls: Call[] } {
  const calls: Call[] = [];
  const reader: AzdoReader = {
    async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
      const call = { path, params };
      calls.push(call);
      if (path === "_apis/connectionData") return { authenticatedUser: { id: "me-id", providerDisplayName: "Yo" } } as T;
      return respond(call) as T;
    },
  };
  return { reader, calls };
}

/** Lista de `count` números consecutivos desde `first`. */
const numbersFrom = (first: number, count: number) => listOf(count, (position) => first + position);

/** IDs del parámetro `ids` de una petición de detalle de work items. Falla si la petición no lo lleva. */
function requestedIds(params: Record<string, string>): string[] {
  if (params.ids === undefined) throw new Error("La petición de detalle no lleva el parámetro ids");
  return params.ids.split(",");
}

describe("Adaptador Azure DevOps: pull requests", () => {
  it("PRs donde soy revisor: pide las PRs activas del proyecto con mi ID como revisor", async () => {
    const { reader, calls } = fakeReader(() => ({ value: [] }));

    await new AzdoSource(reader, "TFM Demo").pullRequestsToReview();

    const listCall = calls.find((call) => call.path.endsWith("/_apis/git/pullrequests"));
    assert.equal(listCall?.path, "TFM%20Demo/_apis/git/pullrequests");
    assert.equal(listCall?.params["searchCriteria.reviewerId"], "me-id");
    assert.equal(listCall?.params["searchCriteria.status"], "active");
  });

  it("PRs donde soy revisor: traduce la respuesta al dominio", async () => {
    const { reader } = fakeReader(() => ({ value: [buildApiPullRequest(7, { isDraft: true })] }));

    const pullRequests = await new AzdoSource(reader, "TFM Demo").pullRequestsToReview();

    assert.deepEqual(pullRequests, [
      {
        id: 7,
        title: "PR 7",
        status: "active",
        isDraft: true,
        author: { id: "author-id", displayName: "Autor" },
        createdAt: "2026-10-15T08:00:00Z",
        sourceBranch: "feat/7_tarea",
        reviewers: [{ id: "me-id", displayName: "Yo", vote: 0 }],
      },
    ]);
  });

  it("mis PRs: filtra por creador", async () => {
    const { reader, calls } = fakeReader(() => ({ value: [] }));

    await new AzdoSource(reader, "TFM Demo").myPullRequests();

    assert.equal(calls.at(-1)?.params["searchCriteria.creatorId"], "me-id");
  });

  it("pide páginas hasta que una viene incompleta", async () => {
    const { reader, calls } = fakeReader(({ params }) => {
      const skip = Number(params.$skip);
      const pageSize = skip === 0 ? 100 : 3;
      return { value: numbersFrom(skip + 1, pageSize).map((id) => buildApiPullRequest(id)) };
    });

    const pullRequests = await new AzdoSource(reader, "P").myPullRequests();

    assert.equal(pullRequests.length, 103);
    assert.deepEqual(calls.filter((call) => call.path.endsWith("pullrequests")).map((call) => call.params.$skip), ["0", "100"]);
  });

  it("PR por ID: devuelve undefined si no existe (404)", async () => {
    const { reader } = fakeReader(() => {
      throw new AzdoHttpError(404, "/x", "no existe");
    });

    const result = await new AzdoSource(reader, "P").pullRequestById(99);

    assert.equal(result, undefined);
  });

  it("PR por ID: otros errores se propagan", async () => {
    const { reader } = fakeReader(() => {
      throw new AzdoHttpError(401, "/x", "sin permisos");
    });

    const result = new AzdoSource(reader, "P").pullRequestById(1);

    await assert.rejects(result, AzdoHttpError);
  });
});

function buildApiWorkItem(id: number, type: string, state: string, overrides: Partial<ApiWorkItem> = {}): ApiWorkItem {
  return {
    id,
    fields: { "System.Title": `WI ${id}`, "System.WorkItemType": type, "System.State": state, "System.ChangedDate": "2026-10-19T13:49:41Z" },
    ...overrides,
  };
}

/** Respuestas con la forma real de la API (probada contra la demo el 2026-10-19). */
function iterationReader(workItemIds: number[], workItemsFor: (ids: number[]) => ApiWorkItem[]) {
  return fakeReader(({ path, params }) => {
    if (path === "_apis/projects/TFM%20Demo") return { defaultTeam: { name: "TFM Demo Team" } };
    if (path.endsWith("/_apis/work/teamsettings/iterations")) {
      return { value: [{ id: "it-1", name: "Sprint actual", attributes: { startDate: "2026-10-12T00:00:00Z", finishDate: "2026-10-26T00:00:00Z" } }] };
    }
    if (path.endsWith("/iterations/it-1/workitems")) {
      // Un mismo WI puede aparecer varias veces (relaciones padre-hijo): se deduplica.
      return { workItemRelations: [...workItemIds, workItemIds[0]].map((id) => ({ target: { id } })) };
    }
    if (path.endsWith("/_apis/wit/workitems")) return { value: workItemsFor(requestedIds(params).map(Number)) };
    if (path.endsWith("/User%20Story/states")) return { value: [{ name: "New", category: "Proposed" }, { name: "Resolved", category: "InProgress" }] };
    if (path.endsWith("/Bug/states")) return { value: [{ name: "Resolved", category: "Resolved" }] };
    throw new Error(`ruta inesperada: ${path}`);
  });
}

describe("Adaptador Azure DevOps: iteración y work items", () => {
  it("iteración actual: traduce nombre y fechas", async () => {
    const { reader } = iterationReader([], () => []);

    const iteration = await new AzdoSource(reader, "TFM Demo").currentIteration();

    assert.deepEqual(iteration, { id: "it-1", name: "Sprint actual", startDate: "2026-10-12T00:00:00Z", finishDate: "2026-10-26T00:00:00Z" });
  });

  it("iteración actual: la pide al equipo por defecto con $timeframe=current", async () => {
    const { reader, calls } = iterationReader([], () => []);

    await new AzdoSource(reader, "TFM Demo").currentIteration();

    const iterationCall = calls.find((call) => call.path.endsWith("/iterations"));
    assert.equal(iterationCall?.path, "TFM%20Demo/TFM%20Demo%20Team/_apis/work/teamsettings/iterations");
    assert.equal(iterationCall?.params.$timeframe, "current");
  });

  it("la categoría sale de la API y depende del tipo", async () => {
    const { reader } = iterationReader([1, 2], () => [buildApiWorkItem(1, "User Story", "Resolved"), buildApiWorkItem(2, "Bug", "Resolved")]);

    const workItems = await new AzdoSource(reader, "TFM Demo").workItemsInIteration("it-1");

    assert.deepEqual(workItems.map((workItem) => [workItem.id, workItem.stateCategory]), [[1, "InProgress"], [2, "Resolved"]]);
  });

  it("detalles en lotes de 200: con 201 work items hace dos peticiones y los devuelve todos", async () => {
    const { reader, calls } = iterationReader(numbersFrom(1, 201), (batch) => batch.map((id) => buildApiWorkItem(id, "Bug", "Resolved")));

    const workItems = await new AzdoSource(reader, "TFM Demo").workItemsInIteration("it-1");

    const detailCalls = calls.filter((call) => call.path.endsWith("/_apis/wit/workitems"));
    assert.deepEqual(detailCalls.map((call) => requestedIds(call.params).length), [200, 1]);
    assert.equal(workItems.length, 201);
  });

  it("detalles: pide las relaciones sin `fields` (la API no admite los dos a la vez)", async () => {
    const { reader, calls } = iterationReader([1], (batch) => batch.map((id) => buildApiWorkItem(id, "Bug", "Resolved")));

    await new AzdoSource(reader, "TFM Demo").workItemsInIteration("it-1");

    const detailCall = calls.find((call) => call.path.endsWith("/_apis/wit/workitems"));
    assert.deepEqual([detailCall?.params.$expand, detailCall?.params.fields], ["relations", undefined]);
  });

  it("asignación: sale de System.AssignedTo", async () => {
    const apiWorkItem = buildApiWorkItem(10, "Bug", "Resolved");
    apiWorkItem.fields["System.AssignedTo"] = { id: "me-id", displayName: "Yo" };
    const { reader } = iterationReader([10], () => [apiWorkItem]);

    const [workItem] = await new AzdoSource(reader, "TFM Demo").workItemsInIteration("it-1");

    assert.deepEqual(workItem?.assignedTo, { id: "me-id", displayName: "Yo" });
  });

  it("PRs vinculadas: solo los enlaces Pull Request (forma real, con %2f); los demás se ignoran", async () => {
    const apiWorkItem = buildApiWorkItem(10, "Bug", "Resolved", {
      relations: [
        { rel: "ArtifactLink", url: "vstfs:///Git/PullRequestId/e0b10b96%2f46e352da%2f3", attributes: { name: "Pull Request" } },
        { rel: "ArtifactLink", url: "vstfs:///Git/Commit/e0b10b96%2f46e352da%2fe0d6c7eb", attributes: { name: "Fixed in Commit" } },
      ],
    });
    const { reader } = iterationReader([10], () => [apiWorkItem]);

    const [workItem] = await new AzdoSource(reader, "TFM Demo").workItemsInIteration("it-1");

    assert.deepEqual(workItem?.pullRequestIds, [3]);
  });

  it("un estado sin categoría es un error explícito", async () => {
    const { reader } = iterationReader([5], () => [buildApiWorkItem(5, "Bug", "Inventado")]);

    const result = new AzdoSource(reader, "TFM Demo").workItemsInIteration("it-1");

    await assert.rejects(result, /sin categoría/);
  });
});

describe("Adaptador Azure DevOps: equipos", () => {
  it("mis equipos: pide los equipos del proyecto con $mine=true", async () => {
    const { reader, calls } = fakeReader(() => ({ value: [], count: 0 }));

    await new AzdoSource(reader, "TFM Demo").myTeams();

    assert.equal(calls.at(-1)?.path, "_apis/projects/TFM%20Demo/teams");
    assert.deepEqual(calls.at(-1)?.params, { $mine: "true" });
  });

  it("mis equipos: traduce la respuesta al dominio (solo ID y nombre)", async () => {
    const { reader } = fakeReader(() => ({ value: [{ id: "team-id", name: "TFM Demo Team", description: "The default project team." }], count: 1 }));

    const teams = await new AzdoSource(reader, "TFM Demo").myTeams();

    assert.deepEqual(teams, [{ id: "team-id", name: "TFM Demo Team" }]);
  });

  it("PRs donde mi equipo es revisor: filtra por el ID del equipo y por activas", async () => {
    const { reader, calls } = fakeReader(() => ({ value: [] }));

    await new AzdoSource(reader, "TFM Demo").pullRequestsToReviewByTeam("team-id");

    assert.equal(calls.at(-1)?.params["searchCriteria.reviewerId"], "team-id");
    assert.equal(calls.at(-1)?.params["searchCriteria.status"], "active");
  });
});
