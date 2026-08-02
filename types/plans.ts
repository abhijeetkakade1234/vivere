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

export type PlanOptionProvider = "dineout" | "food" | "instamart";

export type PlanOption = {
  provider: PlanOptionProvider;
  title: string;
  subtitle?: string;
  why?: string;
  mustTry?: string[];
  searchQuery?: string;
  url?: string;
};

export type Plan = {
  id: string;
  status: "planned";
  request: ExperienceRequest;
  summary: string;
  plannerPromptVersion: string;
  providerCandidates: string[];
  timeline: PlanStep[];
  options?: PlanOption[];
  tips?: string[];
};

export type PullPlan = {
  dineout?: string[];
  food?: string[];
  instamart?: string[];
};

export type ChatMode = "clarify" | "plan";

export type ChatHistoryMessage = {
  content: string;
  role: "assistant" | "user";
};

export type ChatResponse = {
  mode: ChatMode;
  needFromUser?: string[];
  plan?: Plan;
  pullPlan?: PullPlan;
  reply: string;
};
