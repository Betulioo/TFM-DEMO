import { test } from "node:test";
import assert from "node:assert/strict";
import { myTasks } from "../src/domain/rules.js";
import type { StateCategory, WorkItem } from "../src/domain/types.js";

const ME = { id: "me", displayName: "Yo" };
const OTHER = { id: "other", displayName: "Otra" };

function wi(id: number, stateCategory: StateCategory, assignedTo = ME, type = "Task"): WorkItem {
  return { id, title: `WI ${id}`, type, state: "x", stateCategory, assignedTo, changedAt: "2026-10-19T00:00:00Z", pullRequestIds: [] };
}

test("mis tareas: asignadas a mí y no cerradas", () => {
  const items = [wi(1, "Proposed"), wi(2, "InProgress"), wi(3, "Resolved"), wi(4, "Completed"), wi(5, "Removed"), wi(6, "InProgress", OTHER)];
  assert.deepEqual(myTasks(items, ME).map((w) => w.id), [1, 2, 3]);
});

test("mis tareas: sin asignar no cuenta", () => {
  const unassigned: WorkItem = { ...wi(7, "Proposed"), assignedTo: undefined };
  assert.deepEqual(myTasks([unassigned], ME), []);
});

test("mis tareas: el tipo no filtra (procesos personalizados)", () => {
  const items = [wi(8, "InProgress", ME, "Bug desarrollo"), wi(9, "InProgress", ME, "Epic")];
  assert.deepEqual(myTasks(items, ME).map((w) => w.id), [8, 9]);
});
