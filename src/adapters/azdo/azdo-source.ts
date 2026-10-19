// Adaptador real: lee Azure DevOps con un cliente que solo tiene GET.
import { AzdoHttpError, type AzdoReader } from "./read-only-client.js";
import { getAuthenticatedUser } from "./identity.js";
import type { PullRequest, PullRequestStatus, User, Vote } from "../../domain/types.js";
import type { DevOpsSource } from "../../ports/devops-source.js";

const PAGE_SIZE = 100;

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
}

export class AzdoSource implements DevOpsSource {
  private user?: User;

  constructor(
    private readonly reader: AzdoReader,
    private readonly project: string,
  ) {}

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

  async myPullRequests(): Promise<PullRequest[]> {
    const { id } = await this.currentUser();
    return this.listActive({ "searchCriteria.creatorId": id });
  }

  async pullRequestById(id: number): Promise<PullRequest | undefined> {
    try {
      return toPullRequest(await this.reader.get<ApiPullRequest>(`${this.p}/_apis/git/pullrequests/${id}`));
    } catch (error) {
      if (error instanceof AzdoHttpError && error.status === 404) return undefined;
      throw error;
    }
  }

  private get p(): string {
    return encodeURIComponent(this.project);
  }

  /** Lista PRs activas de todos los repositorios del proyecto, página a página. */
  private async listActive(criteria: Record<string, string>): Promise<PullRequest[]> {
    const result: PullRequest[] = [];
    for (let skip = 0; ; skip += PAGE_SIZE) {
      const page = await this.reader.get<{ value: ApiPullRequest[] }>(`${this.p}/_apis/git/pullrequests`, {
        ...criteria,
        "searchCriteria.status": "active",
        $top: String(PAGE_SIZE),
        $skip: String(skip),
      });
      result.push(...page.value.map(toPullRequest));
      if (page.value.length < PAGE_SIZE) return result;
    }
  }
}

export function toPullRequest(api: ApiPullRequest): PullRequest {
  return {
    id: api.pullRequestId,
    title: api.title,
    status: api.status as PullRequestStatus,
    isDraft: api.isDraft ?? false,
    author: { id: api.createdBy.id, displayName: api.createdBy.displayName },
    createdAt: api.creationDate,
    sourceBranch: api.sourceRefName.replace(/^refs\/heads\//, ""),
    reviewers: (api.reviewers ?? []).map((r) => ({ id: r.id, displayName: r.displayName, vote: r.vote as Vote })),
  };
}
