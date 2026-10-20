// Lógica del seed del proyecto demo (la entrada es scripts/seed-demo.ts).
// Recibe los clientes y la pregunta de confirmación como dependencias para poder probarla sin red.
//
// Salvaguardas para no tocar nunca un proyecto real (todas antes de la primera escritura):
//   1. Pide escribir la organización y el proyecto para confirmar.
//   2. Si hay compañero, comprueba que ve el repositorio (acceso Basic).
//   3. Se niega a seguir si el proyecto ya tiene algún work item (un proyecto real nunca está vacío).
//   4. Usa tokens propios de la demo (AZDO_PAT_SEED / AZDO_PAT_TEAMMATE), nunca el de lectura.
//
// Si falla a medias, lo más rápido es borrar el proyecto demo, crearlo de nuevo y repetir.
import { getAuthenticatedUser, type AuthenticatedUser } from "../../src/adapters/azdo/identity.js";
import type { SeedClient } from "./write-client.js";
import type { DemoIds } from "./demo.js";
import type { Case, PullRequestSetup, WorkItemSetup } from "../../src/adapters/fixtures/cases.js";

const SEED_TAG = "tfm-seed";
const ZERO_SHA = "0".repeat(40);

export interface SeedDependencies {
  orgUrl: string;
  project: string;
  cases: Case[];
  currentUserClient: SeedClient;
  teammateClient?: SeedClient;
  /** Correo del usuario si Azure DevOps no lo devuelve (AZDO_USER_EMAIL). */
  userEmail?: string;
  /** Hace una pregunta a la persona y devuelve su respuesta. */
  ask(question: string): Promise<string>;
  /** Guarda los IDs creados (fixtures/demo-ids.json). */
  saveDemoIds(data: DemoIds): void;
}

interface SeedContext {
  currentUserClient: SeedClient;
  teammateClient?: SeedClient;
  currentUser: AuthenticatedUser;
  teammate?: AuthenticatedUser;
  myEmail: string;
  project: string;
  /** Nombre del proyecto codificado para URLs. */
  encodedProject: string;
  repositoryId: string;
  mainSha: string;
  iterationPaths: Record<"current" | "previous", string>;
}

interface CreatedPullRequest {
  pullRequestId: number;
  lastMergeSourceCommit?: { commitId?: string };
}

export async function runSeed(dependencies: SeedDependencies): Promise<DemoIds> {
  const { currentUserClient, teammateClient, project, cases } = dependencies;
  await confirm(dependencies);

  const encodedProject = encodeURIComponent(project);

  const currentUser = await getAuthenticatedUser(currentUserClient);
  const teammate = teammateClient ? await getAuthenticatedUser(teammateClient) : undefined;
  if (teammate && teammate.id === currentUser.id) {
    throw new Error("AZDO_PAT_TEAMMATE pertenece a tu misma cuenta. Debe ser el token de una segunda cuenta.");
  }
  const myEmail = currentUser.email ?? dependencies.userEmail;
  if (!myEmail) throw new Error("No se pudo averiguar tu correo. Añade AZDO_USER_EMAIL en .env.");

  console.log(`Tú:         ${currentUser.displayName}`);
  console.log(`Compañero:  ${teammate?.displayName ?? "no configurado (se omiten los casos K y L)"}`);

  if (teammateClient) await ensureTeammateSeesRepos(currentUserClient, teammateClient, encodedProject);
  await ensureProjectIsEmpty(currentUserClient, encodedProject);

  log("Creando iteraciones");
  const iterationPaths = await createIterations(currentUserClient, project, encodedProject);

  log("Preparando el repositorio");
  const { repositoryId, mainSha } = await ensureMainBranch(currentUserClient, project, encodedProject);

  const context: SeedContext = { currentUserClient, teammateClient, currentUser, teammate, myEmail, project, encodedProject, repositoryId, mainSha, iterationPaths };
  const workItems: Record<string, number> = {};
  const pullRequests: Record<string, number> = {};
  const skipped: string[] = [];

  for (const testCase of cases) {
    if (testCase.verifiedIn === "fixtures") continue;
    if (testCase.verifiedIn === "demo-teammate" && !teammateClient) {
      skipped.push(testCase.key);
      continue;
    }

    if (testCase.setup.entity === "workItem") {
      const result = await seedWorkItemCase(context, testCase, testCase.setup);
      workItems[testCase.key] = result.workItemId;
      if (result.pullRequestId) pullRequests[testCase.key] = result.pullRequestId;
    } else {
      pullRequests[testCase.key] = await seedTeammatePrCase(context, testCase, testCase.setup);
    }
  }

  const demoIds: DemoIds = { generatedAt: new Date().toISOString(), project, workItems, pullRequests, skipped };
  dependencies.saveDemoIds(demoIds);

  console.log("\nSeed completado.");
  console.log(`Work items: ${Object.entries(workItems).map(([caseKey, id]) => `${caseKey}=#${id}`).join(", ")}`);
  console.log(`PRs:        ${Object.entries(pullRequests).map(([caseKey, id]) => `${caseKey}=!${id}`).join(", ") || "ninguna"}`);
  if (skipped.length) console.log(`Omitidos:   ${skipped.join(", ")} (falta AZDO_PAT_TEAMMATE)`);
  return demoIds;
}

// --- Salvaguardas --------------------------------------------------------------

async function confirm(dependencies: SeedDependencies): Promise<void> {
  const organization = organizationName(dependencies.orgUrl);
  console.log(`Vas a crear datos de prueba en:\n  ${dependencies.orgUrl}\n  Proyecto: ${dependencies.project}\n`);
  const organizationAnswer = (await dependencies.ask("Escribe el nombre de la organización para confirmar: ")).trim();
  const projectAnswer = (await dependencies.ask("Escribe el nombre del proyecto para confirmar: ")).trim();
  if (organizationAnswer !== organization || projectAnswer !== dependencies.project) {
    throw new Error("Confirmación incorrecta. No se ha creado nada.");
  }
}

/** `https://dev.azure.com/mi-org` → `mi-org`; `https://mi-org.visualstudio.com` → `mi-org`. */
export function organizationName(orgUrl: string): string {
  const url = new URL(orgUrl);
  return url.pathname.split("/").find(Boolean) ?? url.hostname.split(".")[0] ?? orgUrl;
}

async function ensureProjectIsEmpty(currentUserClient: SeedClient, encodedProject: string): Promise<void> {
  const result = await currentUserClient.request<{ workItems?: { id: number }[] }>("POST", `${encodedProject}/_apis/wit/wiql`, {
    body: { query: "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project" },
  });
  const count = result.workItems?.length ?? 0;
  if (count > 0) {
    throw new Error(`El proyecto ya tiene ${count} work items. El seed solo se ejecuta sobre un proyecto vacío.`);
  }
}

// Con acceso Stakeholder la cuenta ve el proyecto pero no los repositorios, y el seed fallaría a medias
// al añadirla como revisora. Se compara con lo que ves tú para distinguir "sin permisos" de "sin repositorio".
// Se comprueba antes de escribir nada.
async function ensureTeammateSeesRepos(currentUserClient: SeedClient, teammateClient: SeedClient, encodedProject: string): Promise<void> {
  const path = `${encodedProject}/_apis/git/repositories`;
  const [ownRepositories, teammateRepositories] = await Promise.all([
    currentUserClient.get<{ value: unknown[] }>(path),
    teammateClient.get<{ value: unknown[] }>(path),
  ]);
  if (ownRepositories.value.length === 0) {
    throw new Error("El proyecto no tiene ningún repositorio Git. Crea uno en Repos. No se ha creado nada.");
  }
  if (teammateRepositories.value.length === 0) {
    throw new Error(
      "El compañero no ve ningún repositorio del proyecto. Dale nivel de acceso Basic (no Stakeholder) " +
        "y añádelo a Contributors. No se ha creado nada.",
    );
  }
}

// --- Iteraciones ---------------------------------------------------------------

async function createIterations(currentUserClient: SeedClient, project: string, encodedProject: string): Promise<SeedContext["iterationPaths"]> {
  const team = (await currentUserClient.get<{ defaultTeam?: { name?: string } }>(`_apis/projects/${encodedProject}`)).defaultTeam?.name;
  if (!team) throw new Error("El proyecto no tiene equipo por defecto.");

  const today = startOfDay(new Date());
  const sprints = {
    previous: { name: "Sprint anterior", start: addDays(today, -21), finish: addDays(today, -8) },
    current: { name: "Sprint actual", start: addDays(today, -7), finish: addDays(today, 7) },
  };

  for (const sprint of Object.values(sprints)) {
    const node = await currentUserClient.request<{ identifier: string }>("POST", `${encodedProject}/_apis/wit/classificationnodes/Iterations`, {
      body: { name: sprint.name, attributes: { startDate: sprint.start.toISOString(), finishDate: sprint.finish.toISOString() } },
    });
    // La iteración solo cuenta como "actual" si el equipo la tiene seleccionada.
    await currentUserClient.request("POST", `${encodedProject}/${encodeURIComponent(team)}/_apis/work/teamsettings/iterations`, {
      body: { id: node.identifier },
    });
  }

  return {
    previous: `${project}\\${sprints.previous.name}`,
    current: `${project}\\${sprints.current.name}`,
  };
}

// --- Repositorio ---------------------------------------------------------------

async function ensureMainBranch(currentUserClient: SeedClient, project: string, encodedProject: string): Promise<{ repositoryId: string; mainSha: string }> {
  const repositories = await currentUserClient.get<{ value: { id: string; name: string; defaultBranch?: string }[] }>(`${encodedProject}/_apis/git/repositories`);
  const repository = repositories.value.find((repository) => repository.name === project) ?? repositories.value[0];
  if (!repository) throw new Error("El proyecto no tiene repositorio Git.");

  const references = await currentUserClient.get<{ value: { name: string; objectId: string }[] }>(`${encodedProject}/_apis/git/repositories/${repository.id}/refs`, {
    filter: "heads/main",
  });
  const main = references.value.find((reference) => reference.name === "refs/heads/main");
  if (main) return { repositoryId: repository.id, mainSha: main.objectId };

  // Repositorio vacío: primer commit en main.
  const push = await currentUserClient.request<{ refUpdates: { newObjectId: string }[] }>("POST", `${encodedProject}/_apis/git/repositories/${repository.id}/pushes`, {
    body: {
      refUpdates: [{ name: "refs/heads/main", oldObjectId: ZERO_SHA }],
      commits: [{ comment: "Inicio del proyecto demo", changes: [addFile("/README.md", "# TFM Demo\n\nProyecto de datos ficticios.\n")] }],
    },
  });
  const sha = push.refUpdates[0]?.newObjectId;
  if (!sha) throw new Error("No se pudo crear la rama main.");
  return { repositoryId: repository.id, mainSha: sha };
}

async function createBranch(client: SeedClient, context: SeedContext, branch: string, fileName: string): Promise<void> {
  const ref = `refs/heads/${branch}`;
  await client.request("POST", `${context.encodedProject}/_apis/git/repositories/${context.repositoryId}/refs`, {
    body: [{ name: ref, oldObjectId: ZERO_SHA, newObjectId: context.mainSha }],
  });
  // Un commit propio para que la PR tenga cambios.
  await client.request("POST", `${context.encodedProject}/_apis/git/repositories/${context.repositoryId}/pushes`, {
    body: {
      refUpdates: [{ name: ref, oldObjectId: context.mainSha }],
      commits: [{ comment: `Trabajo en ${branch}`, changes: [addFile(`/src/${fileName}.txt`, `Cambio ficticio para ${branch}\n`)] }],
    },
  });
}

function addFile(path: string, content: string) {
  return { changeType: "add", item: { path }, newContent: { content, contentType: "rawtext" } };
}

// --- Casos ---------------------------------------------------------------------

async function seedWorkItemCase(context: SeedContext, testCase: Case, setup: WorkItemSetup): Promise<{ workItemId: number; pullRequestId?: number }> {
  log(`Caso ${testCase.key}: ${setup.type} "${setup.title}"`);

  const fields: [string, string][] = [
    ["System.Title", setup.title],
    ["System.IterationPath", context.iterationPaths[setup.iteration]],
    ["System.Tags", SEED_TAG],
  ];
  if (setup.assignedToMe) fields.push(["System.AssignedTo", context.myEmail]);

  const workItem = await context.currentUserClient.request<{ id: number }>("POST", `${context.encodedProject}/_apis/wit/workitems/$${encodeURIComponent(setup.type)}`, {
    contentType: "application/json-patch+json",
    body: fields.map(([field, value]) => ({ op: "add", path: `/fields/${field}`, value })),
  });

  // Se crea en el estado inicial y después se mueve al estado del caso.
  if (setup.state !== "New") {
    await context.currentUserClient.request("PATCH", `${context.encodedProject}/_apis/wit/workitems/${workItem.id}`, {
      contentType: "application/json-patch+json",
      body: [{ op: "add", path: "/fields/System.State", value: setup.state }],
    });
  }

  if (!setup.branch) return { workItemId: workItem.id };

  const branch = `feat/${workItem.id}_${slug(setup.title)}`;
  await createBranch(context.currentUserClient, context, branch, slug(setup.title));
  if (!setup.pr) return { workItemId: workItem.id };

  // Revisor: el compañero si existe; si no, tú mismo.
  const reviewer = setup.pr.vote === null ? undefined : context.teammate ? { client: context.teammateClient!, user: context.teammate } : { client: context.currentUserClient, user: context.currentUser };

  const pullRequest = await context.currentUserClient.request<CreatedPullRequest>("POST", `${context.encodedProject}/_apis/git/repositories/${context.repositoryId}/pullrequests`, {
    body: {
      sourceRefName: `refs/heads/${branch}`,
      targetRefName: "refs/heads/main",
      title: setup.title,
      description: "PR ficticia del proyecto demo.",
      reviewers: reviewer ? [{ id: reviewer.user.id }] : [],
      workItemRefs: [{ id: String(workItem.id) }],
    },
  });

  if (reviewer && setup.pr.vote !== null) await vote(reviewer.client, context, pullRequest.pullRequestId, reviewer.user.id, setup.pr.vote);
  if (setup.pr.status === "completed") await completePullRequest(context, pullRequest);

  return { workItemId: workItem.id, pullRequestId: pullRequest.pullRequestId };
}

async function seedTeammatePrCase(context: SeedContext, testCase: Case, setup: PullRequestSetup): Promise<number> {
  // `validateCases` ya rechaza este caso fuera de fixtures; aquí solo acota el tipo para leer `myVote`.
  if (setup.reviewer === "myTeam") throw new Error(`Caso ${testCase.key}: el seed no crea PRs con el equipo como revisor (solo fixtures).`);
  log(`Caso ${testCase.key}: PR del compañero "${setup.title}"`);
  const teammateClient = context.teammateClient!;
  // Sin ID en la rama: no está vinculada a ninguna de tus tareas.
  const branch = `feat/revision-${testCase.key.toLowerCase()}_${slug(setup.title)}`;
  await createBranch(teammateClient, context, branch, slug(setup.title));

  const pullRequest = await teammateClient.request<CreatedPullRequest>("POST", `${context.encodedProject}/_apis/git/repositories/${context.repositoryId}/pullrequests`, {
    body: {
      sourceRefName: `refs/heads/${branch}`,
      targetRefName: "refs/heads/main",
      title: setup.title,
      description: "PR ficticia de un compañero.",
      reviewers: [{ id: context.currentUser.id }],
    },
  });
  if (setup.myVote !== 0) await vote(context.currentUserClient, context, pullRequest.pullRequestId, context.currentUser.id, setup.myVote);
  return pullRequest.pullRequestId;
}

async function vote(client: SeedClient, context: SeedContext, pullRequestId: number, reviewerId: string, value: number): Promise<void> {
  // Cada usuario solo puede emitir su propio voto: por eso se usa el cliente del revisor.
  await client.request("PUT", `${context.encodedProject}/_apis/git/repositories/${context.repositoryId}/pullrequests/${pullRequestId}/reviewers/${reviewerId}`, {
    body: { vote: value },
  });
}

async function completePullRequest(context: SeedContext, pullRequest: CreatedPullRequest): Promise<void> {
  let commitId = pullRequest.lastMergeSourceCommit?.commitId;
  for (let attempt = 0; !commitId && attempt < 10; attempt++) {
    await sleep(1000);
    const fresh = await context.currentUserClient.get<CreatedPullRequest>(`${context.encodedProject}/_apis/git/repositories/${context.repositoryId}/pullrequests/${pullRequest.pullRequestId}`);
    commitId = fresh.lastMergeSourceCommit?.commitId;
  }
  if (!commitId) throw new Error(`La PR ${pullRequest.pullRequestId} no tiene commit de origen; no se puede completar.`);

  await context.currentUserClient.request("PATCH", `${context.encodedProject}/_apis/git/repositories/${context.repositoryId}/pullrequests/${pullRequest.pullRequestId}`, {
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

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function log(message: string): void {
  console.log(`· ${message}`);
}
