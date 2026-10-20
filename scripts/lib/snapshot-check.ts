// Compara un snapshot con el `expected` de cada caso de fixtures/expected.json. La usan `npm run collect` (contra
// la demo, con los IDs de demo-ids.json) y su test (con el adaptador falso), para no repetir la comprobación.
import type { Case } from "../../src/adapters/fixtures/cases.js";
import type { Snapshot, SnapshotPullRequest, SnapshotTask } from "../../src/domain/types.js";

/** IDs con los que aparece un caso en el snapshot: su work item, su PR o los dos. */
export interface CaseIds {
  workItemId?: number;
  pullRequestId?: number;
}

export interface Check {
  passed: boolean;
  description: string;
}

type Observe = (snapshot: Snapshot, ids: CaseIds) => unknown;

/** Cómo se lee en el snapshot cada clave de `expected`. `undefined` = el caso no aparece donde debería. */
const OBSERVERS: Record<string, Observe> = {
  inMyTasks: (snapshot, ids) => withId(ids.workItemId, (id) => findTask(snapshot, id) !== undefined),
  nextStep: (snapshot, ids) => withId(ids.workItemId, (id) => findTask(snapshot, id)?.nextStep),
  stale: (snapshot, ids) => withId(ids.workItemId, (id) => findTask(snapshot, id)?.stale),
  taskBlocked: (snapshot, ids) => withId(ids.workItemId, (id) => findTask(snapshot, id)?.blocked),
  lockReason: (snapshot, ids) => withId(ids.workItemId, (id) => findTask(snapshot, id)?.lockReason),
  prIsMine: (snapshot, ids) => withId(ids.pullRequestId, (id) => includesId(snapshot.myPullRequests, id)),
  prBlocked: (snapshot, ids) => withId(ids.pullRequestId, (id) => findPullRequest(snapshot, id)?.blocked),
  prApproved: (snapshot, ids) => withId(ids.pullRequestId, (id) => findPullRequest(snapshot, id)?.approved),
  aged: (snapshot, ids) => withId(ids.pullRequestId, (id) => findPullRequest(snapshot, id)?.aged),
  pendingMyReview: (snapshot, ids) => withId(ids.pullRequestId, (id) => includesId(snapshot.pullRequestsPendingMyReview, id)),
  pendingTeamReview: (snapshot, ids) =>
    withId(ids.pullRequestId, (id) => includesId(snapshot.pullRequestsPendingTeamReview, id)),
};

/** Una comprobación por clave de `expected`. Una clave sin forma de comprobarla es un fallo, no se salta. */
export function checkCase(snapshot: Snapshot, testCase: Case, ids: CaseIds): Check[] {
  return Object.entries(testCase.expected).map(([field, expected]) => {
    const observe = OBSERVERS[field];
    if (!observe) return { passed: false, description: `${testCase.key} → ${field}: sin comprobación definida` };
    const observed = observe(snapshot, ids);
    return {
      passed: observed === expected,
      description: `${testCase.key} → ${field}: esperado ${describeValue(expected)}, obtenido ${describeValue(observed)}`,
    };
  });
}

function withId(id: number | undefined, read: (id: number) => unknown): unknown {
  return id === undefined ? undefined : read(id);
}

/** JSON para que se vea la diferencia entre `null` y "null"; `undefined` es que el caso no aparece. */
function describeValue(value: unknown): string {
  return value === undefined ? "sin datos" : JSON.stringify(value);
}

function findTask(snapshot: Snapshot, workItemId: number): SnapshotTask | undefined {
  return snapshot.myTasks.find((task) => task.id === workItemId);
}

function includesId(pullRequests: SnapshotPullRequest[], id: number): boolean {
  return pullRequests.some((pullRequest) => pullRequest.id === id);
}

/** Todas las PRs del snapshot: las de cada lista y la PR de cada tarea (puede haber repetidas). */
export function allPullRequests(snapshot: Snapshot): SnapshotPullRequest[] {
  return [
    ...snapshot.pullRequestsPendingMyReview,
    ...snapshot.pullRequestsPendingTeamReview,
    ...snapshot.myPullRequests,
    ...snapshot.myTasks.flatMap((task) => (task.pullRequest ? [task.pullRequest] : [])),
  ];
}

/** La PR en cualquier parte del snapshot: en una lista o como PR de una tarea. */
function findPullRequest(snapshot: Snapshot, id: number): SnapshotPullRequest | undefined {
  return allPullRequests(snapshot).find((pullRequest) => pullRequest.id === id);
}
