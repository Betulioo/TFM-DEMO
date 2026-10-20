// Recogida: lee la fuente a través del puerto y aplica las reglas del glosario. No sabe qué adaptador recibe.
import {
  isActive,
  isAged,
  isApproved,
  isBlocked,
  isBlockedTask,
  isPendingMyReview,
  isPendingTeamReview,
  isStale,
  myTasks,
  nextStep,
  taskPullRequest,
} from "../domain/rules.js";
import type { BlockedTaskCriteria, PullRequest, Snapshot, SnapshotPullRequest, SnapshotTask, Team, Thresholds, WorkItem } from "../domain/types.js";
import type { DevOpsSource } from "../ports/devops-source.js";

export async function collectSnapshot(
  source: DevOpsSource,
  now: Date,
  thresholds: Thresholds,
  blockedTaskCriteria: BlockedTaskCriteria,
): Promise<Snapshot> {
  const user = await source.currentUser();
  const teams = await source.myTeams();
  const iteration = await source.currentIteration();
  const tasks = iteration ? myTasks(await source.workItemsInIteration(iteration.id), user) : [];
  const reviewCandidates = await pullRequestsToReviewWithoutDuplicates(source, teams);
  const toSnapshot = (pullRequest: PullRequest) => toSnapshotPullRequest(pullRequest, now, thresholds);

  return {
    generatedAt: now.toISOString(),
    thresholds,
    blockedTaskCriteria,
    user,
    teams,
    iteration: iteration ?? null,
    myTasks: await Promise.all(tasks.map((task) => toSnapshotTask(source, task, now, thresholds, blockedTaskCriteria))),
    pullRequestsPendingMyReview: reviewCandidates.filter((pullRequest) => isPendingMyReview(pullRequest, user)).map(toSnapshot),
    pullRequestsPendingTeamReview: reviewCandidates
      .filter((pullRequest) => isPendingTeamReview(pullRequest, user, teams))
      .map(toSnapshot),
    myPullRequests: (await source.myPullRequests()).filter(isActive).map(toSnapshot),
  };
}

/**
 * PRs donde soy revisor y PRs de cada uno de mis equipos, una sola vez cada una: la misma PR puede llegar por las
 * dos vías o por dos equipos. Después las reglas deciden si es "pendiente de mi revisión" o "del equipo".
 */
async function pullRequestsToReviewWithoutDuplicates(source: DevOpsSource, teams: Team[]): Promise<PullRequest[]> {
  const lists = await Promise.all([
    source.pullRequestsToReview(),
    ...teams.map((team) => source.pullRequestsToReviewByTeam(team.id)),
  ]);
  const byId = new Map<number, PullRequest>();
  for (const pullRequest of lists.flat()) if (!byId.has(pullRequest.id)) byId.set(pullRequest.id, pullRequest);
  return [...byId.values()];
}

async function toSnapshotTask(
  source: DevOpsSource,
  task: WorkItem,
  now: Date,
  thresholds: Thresholds,
  blockedTaskCriteria: BlockedTaskCriteria,
): Promise<SnapshotTask> {
  const linkedPullRequests = await Promise.all(task.pullRequestIds.map((id) => source.pullRequestById(id)));
  const pullRequest = taskPullRequest(linkedPullRequests);
  return {
    ...task,
    pullRequest: pullRequest ? toSnapshotPullRequest(pullRequest, now, thresholds) : null,
    nextStep: nextStep(pullRequest),
    stale: isStale(task, now, thresholds.staleTaskDays),
    blocked: isBlockedTask(task, blockedTaskCriteria),
  };
}

function toSnapshotPullRequest(pullRequest: PullRequest, now: Date, thresholds: Thresholds): SnapshotPullRequest {
  return {
    ...pullRequest,
    aged: isAged(pullRequest, now, thresholds.agedPrDays),
    blocked: isBlocked(pullRequest),
    approved: isApproved(pullRequest),
  };
}
