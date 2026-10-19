import { test } from "node:test";
import assert from "node:assert/strict";
import { myTasks } from "../src/domain/rules.js";
import type { StateCategory, WorkItem } from "../src/domain/types.js";

const CURRENT_USER = { id: "me", displayName: "Yo" };
const OTHER_USER = { id: "other", displayName: "Otra" };

function buildWorkItem(id: number, stateCategory: StateCategory, assignedTo = CURRENT_USER, type = "Task"): WorkItem {
  return { id, title: `WI ${id}`, type, state: "x", stateCategory, assignedTo, changedAt: "2026-10-19T00:00:00Z", pullRequestIds: [] };
}

const ids = (workItems: WorkItem[]) => workItems.map((workItem) => workItem.id);

test("mis tareas: asignadas a mí y no cerradas", () => {
  const workItems = [
    buildWorkItem(1, "Proposed"),
    buildWorkItem(2, "InProgress"),
    buildWorkItem(3, "Resolved"),
    buildWorkItem(4, "Completed"),
    buildWorkItem(5, "Removed"),
    buildWorkItem(6, "InProgress", OTHER_USER),
  ];

  assert.deepEqual(ids(myTasks(workItems, CURRENT_USER)), [1, 2, 3]);
});

test("mis tareas: sin asignar no cuenta", () => {
  const unassigned: WorkItem = { ...buildWorkItem(7, "Proposed"), assignedTo: undefined };

  assert.deepEqual(myTasks([unassigned], CURRENT_USER), []);
});

test("mis tareas: el tipo no filtra (procesos personalizados)", () => {
  const workItems = [buildWorkItem(8, "InProgress", CURRENT_USER, "Bug desarrollo"), buildWorkItem(9, "InProgress", CURRENT_USER, "Epic")];

  assert.deepEqual(ids(myTasks(workItems, CURRENT_USER)), [8, 9]);
});
