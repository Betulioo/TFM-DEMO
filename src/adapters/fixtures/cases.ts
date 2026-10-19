import { readFileSync } from "node:fs";

export type VerifiedIn = "demo" | "demo-teammate" | "fixtures";

export interface WorkItemSetup {
  entity: "workItem";
  type: string;
  title: string;
  state: string;
  iteration: "current" | "previous";
  assignedToMe: boolean;
  branch: boolean;
  pr: null | { status: "active" | "completed"; vote: null | -10 | -5 | 0 | 5 | 10 };
  changedDaysAgo?: number;
}

export interface PullRequestSetup {
  entity: "pullRequest";
  author: "teammate";
  title: string;
  myVote: -10 | -5 | 0 | 5 | 10;
  createdDaysAgo?: number;
}

export interface Case {
  key: string;
  verifiedIn: VerifiedIn;
  setup: WorkItemSetup | PullRequestSetup;
  expected: Record<string, unknown>;
}

export function loadCases(path = "fixtures/expected.json"): Case[] {
  const data = JSON.parse(readFileSync(path, "utf8")) as { cases?: Case[] };
  if (!Array.isArray(data.cases)) throw new Error(`${path} no tiene una lista "cases".`);

  for (const c of data.cases) {
    if (c.setup.entity === "workItem" && c.setup.pr && !c.setup.branch) {
      throw new Error(`Caso ${c.key}: una PR necesita rama ("branch": true).`);
    }
  }
  return data.cases;
}
