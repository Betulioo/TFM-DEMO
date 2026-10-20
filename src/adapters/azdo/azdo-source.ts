// Adaptador real: lee Azure DevOps con un cliente que solo tiene GET.
import { AzdoHttpError, type AzdoReader } from "./read-only-client.js";
import { getAuthenticatedUser } from "./identity.js";
import type { Iteration, PullRequest, PullRequestStatus, StateCategory, Team, User, Vote, WorkItem } from "../../domain/types.js";
import type { DevOpsSource } from "../../ports/devops-source.js";

const PAGE_SIZE = 100;
/** Máximo de IDs por llamada a `_apis/wit/workitems`. */
const WORK_ITEMS_BATCH = 200;
/** Enlace a PR: `vstfs:///Git/PullRequestId/{proyecto}%2F{repo}%2F{id}` (la API lo devuelve con `%2f`). */
const PR_LINK = /^vstfs:\/\/\/Git\/PullRequestId\/[^/]+%2f[^/]+%2f(\d+)$/i;

/** Forma de una PR en la API 7.1 (solo los campos que usamos). */
export interface ApiPullRequest {
  pullRequestId: number;
  title: string;
  status: string;
  isDraft?: boolean;
  createdBy: { id: string; displayName: string };
  creationDate: string;
  sourceRefName: string;
  reviewers?: { id: string; displayName: string; vote: number }[];
  repository: { name: string };
}

/** Forma de un work item con `$expand=relations` (solo los campos que usamos). */
export interface ApiWorkItem {
  id: number;
  fields: {
    "System.Title": string;
    "System.WorkItemType": string;
    "System.State": string;
    "System.ChangedDate": string;
    "System.AssignedTo"?: { id: string; displayName: string };
    /** Etiquetas separadas por "; " (p. ej. `"tfm-seed; Blocked"`); la API omite el campo si no hay ninguna. */
    "System.Tags"?: string;
    /** Campos del proceso del cliente, como el del motivo del bloqueo (`LOCK_REASON_FIELD`). */
    [referenceName: string]: unknown;
  };
  relations?: { rel: string; url: string; attributes?: { name?: string } }[];
}

/** Forma de un equipo en `_apis/projects/{project}/teams` (solo los campos que usamos). */
interface ApiTeam {
  id: string;
  name: string;
}

interface ApiIteration {
  id: string;
  name: string;
  attributes?: { startDate?: string | null; finishDate?: string | null };
}

export class AzdoSource implements DevOpsSource {
  private user?: User;
  private team?: string;
  /** Categoría de cada estado, por tipo de work item: tipo → estado → categoría. */
  private readonly categories = new Map<string, Map<string, StateCategory>>();
  /** Base de las URLs web del proyecto, p. ej. `https://dev.azure.com/org/Mi%20Proyecto`. */
  private readonly webBaseUrl: string;

  constructor(
    private readonly reader: AzdoReader,
    private readonly project: string,
    orgUrl: string,
    /** Nombre de referencia del campo con el motivo del bloqueo; sin él, ningún work item lleva motivo. */
    private readonly lockReasonField?: string,
  ) {
    this.webBaseUrl = projectWebBaseUrl(orgUrl, project);
  }

  async currentUser(): Promise<User> {
    if (!this.user) {
      const { id, displayName } = await getAuthenticatedUser(this.reader);
      this.user = { id, displayName };
    }
    return this.user;
  }

  async pullRequestsToReview(): Promise<PullRequest[]> {
    const { id } = await this.currentUser();
    return this.listActive({ "searchCriteria.reviewerId": id });
  }

  async myTeams(): Promise<Team[]> {
    const result = await this.reader.get<{ value: ApiTeam[] }>(`_apis/projects/${this.encodedProject}/teams`, { $mine: "true" });
    return result.value.map((team) => ({ id: team.id, name: team.name }));
  }

  async pullRequestsToReviewByTeam(teamId: string): Promise<PullRequest[]> {
    return this.listActive({ "searchCriteria.reviewerId": teamId });
  }

  async myPullRequests(): Promise<PullRequest[]> {
    const { id } = await this.currentUser();
    return this.listActive({ "searchCriteria.creatorId": id });
  }

  async pullRequestById(id: number): Promise<PullRequest | undefined> {
    try {
      return toPullRequest(await this.reader.get<ApiPullRequest>(`${this.encodedProject}/_apis/git/pullrequests/${id}`), this.webBaseUrl);
    } catch (error) {
      if (error instanceof AzdoHttpError && error.status === 404) return undefined;
      throw error;
    }
  }

  async currentIteration(): Promise<Iteration | undefined> {
    const result = await this.reader.get<{ value: ApiIteration[] }>(`${this.encodedProject}/${await this.teamPath()}/_apis/work/teamsettings/iterations`, {
      $timeframe: "current",
    });
    const iteration = result.value[0];
    if (!iteration) return undefined;
    return {
      id: iteration.id,
      name: iteration.name,
      startDate: iteration.attributes?.startDate ?? undefined,
      finishDate: iteration.attributes?.finishDate ?? undefined,
    };
  }

  async workItemsInIteration(iterationId: string): Promise<WorkItem[]> {
    const links = await this.reader.get<{ workItemRelations: { target?: { id: number } }[] }>(
      `${this.encodedProject}/${await this.teamPath()}/_apis/work/teamsettings/iterations/${iterationId}/workitems`,
    );
    const ids = [...new Set(links.workItemRelations.flatMap((relation) => (relation.target ? [relation.target.id] : [])))];

    const result: WorkItem[] = [];
    for (let i = 0; i < ids.length; i += WORK_ITEMS_BATCH) {
      // `$expand` no se puede combinar con `fields` (la API responde 400): se piden los work items completos.
      const batch = await this.reader.get<{ value: ApiWorkItem[] }>(`${this.encodedProject}/_apis/wit/workitems`, {
        ids: ids.slice(i, i + WORK_ITEMS_BATCH).join(","),
        $expand: "relations",
      });
      for (const api of batch.value) result.push(toWorkItem(api, await this.stateCategory(api), this.webBaseUrl, this.lockReasonField));
    }
    return result;
  }

  /** La categoría depende del tipo (en Agile, "Resolved" es InProgress en User Story y Resolved en Bug). */
  private async stateCategory(api: ApiWorkItem): Promise<StateCategory> {
    const type = api.fields["System.WorkItemType"];
    let states = this.categories.get(type);
    if (!states) {
      const result = await this.reader.get<{ value: { name: string; category: string }[] }>(
        `${this.encodedProject}/_apis/wit/workitemtypes/${encodeURIComponent(type)}/states`,
      );
      states = new Map(result.value.map((state) => [state.name, state.category as StateCategory]));
      this.categories.set(type, states);
    }
    const category = states.get(api.fields["System.State"]);
    if (!category) throw new Error(`Estado "${api.fields["System.State"]}" sin categoría en el tipo "${type}" (WI #${api.id}).`);
    return category;
  }

  private async teamPath(): Promise<string> {
    if (!this.team) {
      const project = await this.reader.get<{ defaultTeam?: { name?: string } }>(`_apis/projects/${this.encodedProject}`);
      if (!project.defaultTeam?.name) throw new Error(`El proyecto ${this.project} no tiene equipo por defecto.`);
      this.team = project.defaultTeam.name;
    }
    return encodeURIComponent(this.team);
  }

  private get encodedProject(): string {
    return encodeURIComponent(this.project);
  }

  /** Lista PRs activas de todos los repositorios del proyecto, página a página. */
  private async listActive(criteria: Record<string, string>): Promise<PullRequest[]> {
    const result: PullRequest[] = [];
    for (let skip = 0; ; skip += PAGE_SIZE) {
      const page = await this.reader.get<{ value: ApiPullRequest[] }>(`${this.encodedProject}/_apis/git/pullrequests`, {
        ...criteria,
        "searchCriteria.status": "active",
        $top: String(PAGE_SIZE),
        $skip: String(skip),
      });
      result.push(...page.value.map((api) => toPullRequest(api, this.webBaseUrl)));
      if (page.value.length < PAGE_SIZE) return result;
    }
  }
}

/** `orgUrl` llega sin barra final (`loadConfig` la quita). */
function projectWebBaseUrl(orgUrl: string, project: string): string {
  return `${orgUrl}/${encodeURIComponent(project)}`;
}

export function toPullRequest(api: ApiPullRequest, webBaseUrl: string): PullRequest {
  return {
    id: api.pullRequestId,
    title: api.title,
    status: api.status as PullRequestStatus,
    isDraft: api.isDraft ?? false,
    author: { id: api.createdBy.id, displayName: api.createdBy.displayName },
    createdAt: api.creationDate,
    sourceBranch: api.sourceRefName.replace(/^refs\/heads\//, ""),
    reviewers: (api.reviewers ?? []).map((reviewer) => ({ id: reviewer.id, displayName: reviewer.displayName, vote: reviewer.vote as Vote })),
    webUrl: `${webBaseUrl}/_git/${encodeURIComponent(api.repository.name)}/pullrequest/${api.pullRequestId}`,
  };
}

/** `"tfm-seed; Blocked"` → `["tfm-seed", "Blocked"]`. */
function parseTags(tags: string | undefined): string[] {
  return (tags ?? "")
    .split(";")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");
}

/** Texto del campo del motivo; `undefined` si no está configurado, falta o viene vacío. */
function lockReasonFrom(fields: ApiWorkItem["fields"], lockReasonField: string | undefined): string | undefined {
  const value = lockReasonField === undefined ? undefined : fields[lockReasonField];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

export function toWorkItem(api: ApiWorkItem, stateCategory: StateCategory, webBaseUrl: string, lockReasonField?: string): WorkItem {
  const fields = api.fields;
  const assigned = fields["System.AssignedTo"];
  return {
    id: api.id,
    title: fields["System.Title"],
    type: fields["System.WorkItemType"],
    state: fields["System.State"],
    stateCategory,
    assignedTo: assigned ? { id: assigned.id, displayName: assigned.displayName } : undefined,
    changedAt: fields["System.ChangedDate"],
    pullRequestIds: (api.relations ?? []).flatMap((relation) => {
      const match = relation.rel === "ArtifactLink" ? PR_LINK.exec(relation.url) : null;
      return match?.[1] ? [Number(match[1])] : [];
    }),
    tags: parseTags(fields["System.Tags"]),
    lockReason: lockReasonFrom(fields, lockReasonField),
    webUrl: `${webBaseUrl}/_workitems/edit/${api.id}`,
  };
}
