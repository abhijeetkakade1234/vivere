export type ExperienceRequest = {
  occasion: string;
  location: string;
  budgetRange?: { min?: number; max?: number };
  timeWindow?: { start?: string; end?: string };
  partySize?: number;
  foodPreferences?: string[];
  constraints?: string[];
  notes?: string;
};

export type PlanStep = {
  id: string;
  kind: "gift" | "reservation" | "food" | "dessert" | "travel" | "note";
  title: string;
  rationale?: string;
  scheduledFor?: string;
  estimatedCost?: number;
  executionStatus?: "pending" | "ready" | "running" | "done" | "failed";
};

export type Plan = {
  id: string;
  status: "planned";
  request: ExperienceRequest;
  summary: string;
  plannerPromptVersion: string;
  providerCandidates: string[];
  timeline: PlanStep[];
};

export type ChatResponse = {
  reply: string;
  plan: Plan;
};
