// Prueba el adaptador real con un lector falso: sin red y sin token.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AzdoSource, type ApiPullRequest } from "../src/adapters/azdo-source.js";
import { AzdoHttpError, type AzdoReader } from "../src/azdo/read-only-client.js";

interface Call {
  path: string;
  params: Record<string, string>;
}

function apiPr(id: number, overrides: Partial<ApiPullRequest> = {}): ApiPullRequest {
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

test("PRs donde soy revisor: filtra por mi ID y por activas, y traduce al dominio", async () => {
  const { reader, calls } = fakeReader(() => ({ value: [apiPr(7, { isDraft: true })] }));
  const prs = await new AzdoSource(reader, "TFM Demo").pullRequestsToReview();

  const list = calls.find((c) => c.path.endsWith("/_apis/git/pullrequests"));
  assert.equal(list?.path, "TFM%20Demo/_apis/git/pullrequests");
  assert.equal(list?.params["searchCriteria.reviewerId"], "me-id");
  assert.equal(list?.params["searchCriteria.status"], "active");

  assert.deepEqual(prs, [
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

test("mis PRs: filtra por creador", async () => {
  const { reader, calls } = fakeReader(() => ({ value: [] }));
  await new AzdoSource(reader, "TFM Demo").myPullRequests();
  assert.equal(calls.at(-1)?.params["searchCriteria.creatorId"], "me-id");
});

test("pide páginas hasta que una viene incompleta", async () => {
  const { reader, calls } = fakeReader(({ params }) => {
    const skip = Number(params.$skip);
    const size = skip === 0 ? 100 : 3;
    return { value: Array.from({ length: size }, (_, i) => apiPr(skip + i + 1)) };
  });
  const prs = await new AzdoSource(reader, "P").myPullRequests();
  assert.equal(prs.length, 103);
  assert.deepEqual(calls.filter((c) => c.path.endsWith("pullrequests")).map((c) => c.params.$skip), ["0", "100"]);
});

test("PR por ID: devuelve undefined si no existe (404)", async () => {
  const { reader } = fakeReader(() => {
    throw new AzdoHttpError(404, "/x", "no existe");
  });
  assert.equal(await new AzdoSource(reader, "P").pullRequestById(99), undefined);
});

test("PR por ID: otros errores se propagan", async () => {
  const { reader } = fakeReader(() => {
    throw new AzdoHttpError(401, "/x", "sin permisos");
  });
  await assert.rejects(new AzdoSource(reader, "P").pullRequestById(1), AzdoHttpError);
});
