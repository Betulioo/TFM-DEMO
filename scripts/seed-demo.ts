// Paso 3: siembra el proyecto demo con los casos de fixtures/expected.json.
//
// Salvaguardas para no tocar nunca un proyecto real:
//   1. Pide escribir el nombre del proyecto para confirmar.
//   2. Se niega a seguir si el proyecto ya tiene algún work item (un proyecto real nunca está vacío).
//   3. Usa tokens propios de la demo (AZDO_PAT_SEED / AZDO_PAT_TEAMMATE), nunca el de lectura.
//
// Si falla a medias, lo más rápido es borrar el proyecto demo, crearlo de nuevo y repetir.
import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { loadConfig, optionalEnv } from "../src/config.js";
import { getAuthenticatedUser, type AuthenticatedUser } from "../src/azdo/identity.js";
import { AzdoWriteClient } from "./lib/write-client.js";
import { loadCases, type Case, type PullRequestSetup, type WorkItemSetup } from "./lib/cases.js";

const SEED_TAG = "tfm-seed";
const ZERO_SHA = "0".repeat(40);
const DEMO_IDS_PATH = "fixtures/demo-ids.json";

interface Ctx {
  me: AzdoWriteClient;
  mate?: AzdoWriteClient;
  meUser: AuthenticatedUser;
  mateUser?: AuthenticatedUser;
  myEmail: string;
  project: string;
  p: string; // nombre del proyecto codificado para URLs
  repoId: string;
  mainSha: string;
  iterationPaths: Record<"current" | "previous", string>;
}

interface PullRequest {
  pullRequestId: number;
  lastMergeSourceCommit?: { commitId?: string };
}

async function main(): Promise<void> {
  const config = loadConfig("AZDO_PAT_SEED");
  const teammatePat = optionalEnv("AZDO_PAT_TEAMMATE");
  const cases = loadCases();

  await confirm(config.orgUrl, config.project);

  const me = new AzdoWriteClient(config.orgUrl, config.pat);
  const mate = teammatePat ? new AzdoWriteClient(config.orgUrl, teammatePat) : undefined;
  const p = encodeURIComponent(config.project);

  const meUser = await getAuthenticatedUser(me);
  const mateUser = mate ? await getAuthenticatedUser(mate) : undefined;
  if (mateUser && mateUser.id === meUser.id) {
    throw new Error("AZDO_PAT_TEAMMATE pertenece a tu misma cuenta. Debe ser el token de una segunda cuenta.");
  }
  const myEmail = meUser.email ?? optionalEnv("AZDO_USER_EMAIL");
  if (!myEmail) throw new Error("No se pudo averiguar tu correo. Añade AZDO_USER_EMAIL en .env.");

  console.log(`Tú:         ${meUser.displayName}`);
  console.log(`Compañero:  ${mateUser?.displayName ?? "no configurado (se omiten los casos K y L)"}`);

  await ensureProjectIsEmpty(me, p);

  log("Creando iteraciones");
  const iterationPaths = await createIterations(me, config.project, p);

  log("Preparando el repositorio");
  const { repoId, mainSha } = await ensureMainBranch(me, config.project, p);

  const ctx: Ctx = { me, mate, meUser, mateUser, myEmail, project: config.project, p, repoId, mainSha, iterationPaths };
  const workItems: Record<string, number> = {};
  const pullRequests: Record<string, number> = {};
  const skipped: string[] = [];

  for (const c of cases) {
    if (c.verifiedIn === "fixtures") continue;
    if (c.verifiedIn === "demo-teammate" && !mate) {
      skipped.push(c.key);
      continue;
    }

    if (c.setup.entity === "workItem") {
      const result = await seedWorkItemCase(ctx, c, c.setup);
      workItems[c.key] = result.workItemId;
      if (result.pullRequestId) pullRequests[c.key] = result.pullRequestId;
    } else {
      pullRequests[c.key] = await seedTeammatePrCase(ctx, c, c.setup);
    }
  }

  writeFileSync(
    DEMO_IDS_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), project: config.project, workItems, pullRequests, skipped }, null, 2)}\n`,
  );

  console.log("\nSeed completado.");
  console.log(`Work items: ${Object.entries(workItems).map(([k, id]) => `${k}=#${id}`).join(", ")}`);
  console.log(`PRs:        ${Object.entries(pullRequests).map(([k, id]) => `${k}=!${id}`).join(", ") || "ninguna"}`);
  if (skipped.length) console.log(`Omitidos:   ${skipped.join(", ")} (falta AZDO_PAT_TEAMMATE)`);
  console.log(`IDs guardados en ${DEMO_IDS_PATH}`);
}

// --- Salvaguardas --------------------------------------------------------------

async function confirm(orgUrl: string, project: string): Promise<void> {
  console.log(`Vas a crear datos de prueba en:\n  ${orgUrl}\n  Proyecto: ${project}\n`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question("Escribe el nombre del proyecto para confirmar: ")).trim();
  rl.close();
  if (answer !== project) throw new Error("Confirmación incorrecta. No se ha creado nada.");
}

async function ensureProjectIsEmpty(me: AzdoWriteClient, p: string): Promise<void> {
  const result = await me.request<{ workItems?: { id: number }[] }>("POST", `${p}/_apis/wit/wiql`, {
    body: { query: "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project" },
  });
  const count = result.workItems?.length ?? 0;
  if (count > 0) {
    throw new Error(`El proyecto ya tiene ${count} work items. El seed solo se ejecuta sobre un proyecto vacío.`);
  }
}

// --- Iteraciones ---------------------------------------------------------------

async function createIterations(me: AzdoWriteClient, project: string, p: string): Promise<Ctx["iterationPaths"]> {
  const team = (await me.get<{ defaultTeam?: { name?: string } }>(`_apis/projects/${p}`)).defaultTeam?.name;
  if (!team) throw new Error("El proyecto no tiene equipo por defecto.");

  const today = startOfDay(new Date());
  const sprints = {
    previous: { name: "Sprint anterior", start: addDays(today, -21), finish: addDays(today, -8) },
    current: { name: "Sprint actual", start: addDays(today, -7), finish: addDays(today, 7) },
  };

  for (const sprint of Object.values(sprints)) {
    const node = await me.request<{ identifier: string }>("POST", `${p}/_apis/wit/classificationnodes/Iterations`, {
      body: { name: sprint.name, attributes: { startDate: sprint.start.toISOString(), finishDate: sprint.finish.toISOString() } },
    });
    // La iteración solo cuenta como "actual" si el equipo la tiene seleccionada.
    await me.request("POST", `${p}/${encodeURIComponent(team)}/_apis/work/teamsettings/iterations`, {
      body: { id: node.identifier },
    });
  }

  return {
    previous: `${project}\\${sprints.previous.name}`,
    current: `${project}\\${sprints.current.name}`,
  };
}

// --- Repositorio ---------------------------------------------------------------

async function ensureMainBranch(me: AzdoWriteClient, project: string, p: string): Promise<{ repoId: string; mainSha: string }> {
  const repos = await me.get<{ value: { id: string; name: string; defaultBranch?: string }[] }>(`${p}/_apis/git/repositories`);
  const repo = repos.value.find((r) => r.name === project) ?? repos.value[0];
  if (!repo) throw new Error("El proyecto no tiene repositorio Git.");

  const refs = await me.get<{ value: { name: string; objectId: string }[] }>(`${p}/_apis/git/repositories/${repo.id}/refs`, {
    filter: "heads/main",
  });
  const main = refs.value.find((r) => r.name === "refs/heads/main");
  if (main) return { repoId: repo.id, mainSha: main.objectId };

  // Repositorio vacío: primer commit en main.
  const push = await me.request<{ refUpdates: { newObjectId: string }[] }>("POST", `${p}/_apis/git/repositories/${repo.id}/pushes`, {
    body: {
      refUpdates: [{ name: "refs/heads/main", oldObjectId: ZERO_SHA }],
      commits: [{ comment: "Inicio del proyecto demo", changes: [addFile("/README.md", "# TFM Demo\n\nProyecto de datos ficticios.\n")] }],
    },
  });
  const sha = push.refUpdates[0]?.newObjectId;
  if (!sha) throw new Error("No se pudo crear la rama main.");
  return { repoId: repo.id, mainSha: sha };
}

async function createBranch(client: AzdoWriteClient, ctx: Ctx, branch: string, fileName: string): Promise<void> {
  const ref = `refs/heads/${branch}`;
  await client.request("POST", `${ctx.p}/_apis/git/repositories/${ctx.repoId}/refs`, {
    body: [{ name: ref, oldObjectId: ZERO_SHA, newObjectId: ctx.mainSha }],
  });
  // Un commit propio para que la PR tenga cambios.
  await client.request("POST", `${ctx.p}/_apis/git/repositories/${ctx.repoId}/pushes`, {
    body: {
      refUpdates: [{ name: ref, oldObjectId: ctx.mainSha }],
      commits: [{ comment: `Trabajo en ${branch}`, changes: [addFile(`/src/${fileName}.txt`, `Cambio ficticio para ${branch}\n`)] }],
    },
  });
}

function addFile(path: string, content: string) {
  return { changeType: "add", item: { path }, newContent: { content, contentType: "rawtext" } };
}

// --- Casos ---------------------------------------------------------------------

async function seedWorkItemCase(ctx: Ctx, c: Case, s: WorkItemSetup): Promise<{ workItemId: number; pullRequestId?: number }> {
  log(`Caso ${c.key}: ${s.type} "${s.title}"`);

  const fields: [string, string][] = [
    ["System.Title", s.title],
    ["System.IterationPath", ctx.iterationPaths[s.iteration]],
    ["System.Tags", SEED_TAG],
  ];
  if (s.assignedToMe) fields.push(["System.AssignedTo", ctx.myEmail]);

  const workItem = await ctx.me.request<{ id: number }>("POST", `${ctx.p}/_apis/wit/workitems/$${encodeURIComponent(s.type)}`, {
    contentType: "application/json-patch+json",
    body: fields.map(([field, value]) => ({ op: "add", path: `/fields/${field}`, value })),
  });

  // Se crea en el estado inicial y después se mueve al estado del caso.
  if (s.state !== "New") {
    await ctx.me.request("PATCH", `${ctx.p}/_apis/wit/workitems/${workItem.id}`, {
      contentType: "application/json-patch+json",
      body: [{ op: "add", path: "/fields/System.State", value: s.state }],
    });
  }

  if (!s.branch) return { workItemId: workItem.id };

  const branch = `feat/${workItem.id}_${slug(s.title)}`;
  await createBranch(ctx.me, ctx, branch, slug(s.title));
  if (!s.pr) return { workItemId: workItem.id };

  // Revisor: el compañero si existe; si no, tú mismo.
  const reviewer = s.pr.vote === null ? undefined : ctx.mateUser ? { client: ctx.mate!, user: ctx.mateUser } : { client: ctx.me, user: ctx.meUser };

  const pr = await ctx.me.request<PullRequest>("POST", `${ctx.p}/_apis/git/repositories/${ctx.repoId}/pullrequests`, {
    body: {
      sourceRefName: `refs/heads/${branch}`,
      targetRefName: "refs/heads/main",
      title: s.title,
      description: "PR ficticia del proyecto demo.",
      reviewers: reviewer ? [{ id: reviewer.user.id }] : [],
      workItemRefs: [{ id: String(workItem.id) }],
    },
  });

  if (reviewer && s.pr.vote !== null) await vote(reviewer.client, ctx, pr.pullRequestId, reviewer.user.id, s.pr.vote);
  if (s.pr.status === "completed") await completePullRequest(ctx, pr);

  return { workItemId: workItem.id, pullRequestId: pr.pullRequestId };
}

async function seedTeammatePrCase(ctx: Ctx, c: Case, s: PullRequestSetup): Promise<number> {
  log(`Caso ${c.key}: PR del compañero "${s.title}"`);
  const mate = ctx.mate!;
  // Sin ID en la rama: no está vinculada a ninguna de tus tareas.
  const branch = `feat/revision-${c.key.toLowerCase()}_${slug(s.title)}`;
  await createBranch(mate, ctx, branch, slug(s.title));

  const pr = await mate.request<PullRequest>("POST", `${ctx.p}/_apis/git/repositories/${ctx.repoId}/pullrequests`, {
    body: {
      sourceRefName: `refs/heads/${branch}`,
      targetRefName: "refs/heads/main",
      title: s.title,
      description: "PR ficticia de un compañero.",
      reviewers: [{ id: ctx.meUser.id }],
    },
  });
  if (s.myVote !== 0) await vote(ctx.me, ctx, pr.pullRequestId, ctx.meUser.id, s.myVote);
  return pr.pullRequestId;
}

async function vote(client: AzdoWriteClient, ctx: Ctx, prId: number, reviewerId: string, value: number): Promise<void> {
  // Cada usuario solo puede emitir su propio voto: por eso se usa el cliente del revisor.
  await client.request("PUT", `${ctx.p}/_apis/git/repositories/${ctx.repoId}/pullrequests/${prId}/reviewers/${reviewerId}`, {
    body: { vote: value },
  });
}

async function completePullRequest(ctx: Ctx, pr: PullRequest): Promise<void> {
  let commitId = pr.lastMergeSourceCommit?.commitId;
  for (let attempt = 0; !commitId && attempt < 10; attempt++) {
    await sleep(1000);
    const fresh = await ctx.me.get<PullRequest>(`${ctx.p}/_apis/git/repositories/${ctx.repoId}/pullrequests/${pr.pullRequestId}`);
    commitId = fresh.lastMergeSourceCommit?.commitId;
  }
  if (!commitId) throw new Error(`La PR ${pr.pullRequestId} no tiene commit de origen; no se puede completar.`);

  await ctx.me.request("PATCH", `${ctx.p}/_apis/git/repositories/${ctx.repoId}/pullrequests/${pr.pullRequestId}`, {
    body: {
      status: "completed",
      lastMergeSourceCommit: { commitId },
      // El work item debe seguir abierto: es justo el caso "Cerrar la tarea".
      completionOptions: { deleteSourceBranch: false, transitionWorkItems: false },
    },
  });
}

// --- Utilidades ----------------------------------------------------------------

function slug(title: string): string {
  return title
    .replace(/^\[[A-Z]\]\s*/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message: string): void {
  console.log(`· ${message}`);
}

main().catch((error: unknown) => {
  console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
