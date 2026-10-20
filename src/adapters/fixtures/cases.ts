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

interface PullRequestSetupBase {
  entity: "pullRequest";
  author: "teammate";
  title: string;
  createdDaysAgo?: number;
}

/** PR del compañero. Revisor: el usuario (con `myVote`, por defecto) o uno de sus equipos (sin el usuario). */
export type PullRequestSetup =
  | (PullRequestSetupBase & { reviewer?: "me"; myVote: -10 | -5 | 0 | 5 | 10 })
  | (PullRequestSetupBase & { reviewer: "myTeam" });

export interface Case {
  key: string;
  verifiedIn: VerifiedIn;
  setup: WorkItemSetup | PullRequestSetup;
  expected: Record<string, unknown>;
}

export function loadCases(path = "fixtures/expected.json"): Case[] {
  const data = JSON.parse(readFileSync(path, "utf8")) as { cases?: Case[] };
  if (!Array.isArray(data.cases)) throw new Error(`${path} no tiene una lista "cases".`);

  for (const testCase of data.cases) {
    if (testCase.setup.entity === "workItem" && testCase.setup.pr && !testCase.setup.branch) {
      throw new Error(`Caso ${testCase.key}: una PR necesita rama ("branch": true).`);
    }
  }
  return data.cases;
}
