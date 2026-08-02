"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/spinner";
import { OCCASIONS } from "@/lib/app-config";
import type { ChatHistoryMessage, ChatResponse, Plan, PlanOption, PullPlan } from "@/types/plans";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8788";
const SWIGGY_CONNECT_URLS = {
  dineout: `${API_BASE_URL}/api/auth/swiggy/start?server=dineout`,
  food: `${API_BASE_URL}/api/auth/swiggy/start?server=food`,
  im: `${API_BASE_URL}/api/auth/swiggy/start?server=im`
} as const;
const REQUEST_TIMEOUT_MS = 15_000;

type ChatMessage = {
  id: string;
  needFromUser?: string[];
  plan?: Plan;
  pullPlan?: PullPlan;
  role: "assistant" | "user";
  content: string;
};

type SwiggyStatus = {
  connected: boolean;
  connectedServers?: Array<"dineout" | "food" | "im">;
  expiresAt?: number | null;
  server?: string | null;
};

type SubmitPromptOptions = {
  displayPrompt?: string;
  pendingLabel?: string;
};

type PlanAction = "add-on" | "dinner-booking" | "refine";

const QUICK_PROMPTS = [
  "Plan a first date in Pune with dinner and flowers under Rs 3000.",
  "I need a birthday plan in Mumbai for 6 people with cake and dinner.",
  "Help me plan a cozy movie night at home with snacks and dessert.",
  "Plan a rainy evening in Bangalore with comfort food and something small to gift."
];

const FRIENDLY_ERROR =
  "We could not connect right now. Please try again later. If this keeps happening, email abhijeetskakade04@gmail.com.";
const MAX_HISTORY_MESSAGES = 8;

type SuggestedOption = {
  ctaLabel: string;
  href?: string;
  mustTry?: string[];
  provider: PlanOption["provider"];
  providerLabel: string;
  subtitle: string;
  title: string;
  why?: string;
};

function formatNeedLabel(value: string) {
  const labels: Record<string, string> = {
    budget: "final budget",
    location: "exact locality",
    partySize: "party size",
    timeWindow: "dinner time"
  };

  return labels[value] ?? value;
}

function debugLog(event: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info(`[vivere] ${event}`, data ?? {});
}

function debugWarn(event: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.warn(`[vivere] ${event}`, data ?? {});
}

function describeError(caughtError: unknown) {
  if (caughtError instanceof DOMException) {
    return {
      error: caughtError.message,
      name: caughtError.name
    };
  }

  if (caughtError instanceof Error) {
    return {
      error: caughtError.message,
      name: caughtError.name
    };
  }

  return {
    error: String(caughtError)
  };
}

function isExtensionNoise(value: unknown) {
  const text =
    value instanceof Error
      ? `${value.name} ${value.message} ${value.stack ?? ""}`
      : typeof value === "string"
        ? value
        : JSON.stringify(value ?? "");

  return text.includes("MetaMask") || text.includes("chrome-extension://");
}

function messageFromChatError(caughtError: unknown, requestUrl: string) {
  if (caughtError instanceof DOMException && caughtError.name === "TimeoutError") {
    return `Planner timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Check that vivere-api is running and reachable at ${requestUrl}.`;
  }

  if (caughtError instanceof TypeError && caughtError.message === "Failed to fetch") {
    return `Could not reach the planner API at ${requestUrl}. Start vivere-api and try again.`;
  }

  if (caughtError instanceof Error) {
    return caughtError.message;
  }

  return FRIENDLY_ERROR;
}

function swiggyStatusLabel(status: SwiggyStatus | null) {
  if (!status) {
    return "Checking Swiggy...";
  }

  if (!status.connected) {
    return "Swiggy not connected";
  }

  const labels: Record<string, string> = {
    dineout: "Dineout",
    food: "Food",
    im: "Instamart"
  };
  const connected = (status.connectedServers ?? []).map((server) => labels[server]).filter(Boolean);

  if (!connected.length) {
    return "Swiggy connected";
  }

  return `Swiggy: ${connected.join(", ")}`;
}

function isServerConnected(status: SwiggyStatus | null, server: "dineout" | "food" | "im") {
  return status?.connectedServers?.includes(server) ?? false;
}

function buildSearchHref(provider: keyof PullPlan, query: string, location: string) {
  const search = location && location !== "not-specified" ? `${query} ${location}` : query;

  if (provider === "instamart") {
    return `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(query)}`;
  }

  if (provider === "food") {
    return `https://www.swiggy.com/search?query=${encodeURIComponent(search)}`;
  }

  return undefined;
}

function buildOptionHref(option: PlanOption, location: string) {
  if (option.url) {
    return option.url;
  }

  return buildSearchHref(option.provider, option.searchQuery?.trim() || option.title, location);
}

function providerCopy(provider: PlanOption["provider"]) {
  if (provider === "instamart") {
    return {
      ctaLabel: "Open on Instamart",
      providerLabel: "Small gesture idea",
      subtitle: "A soft finishing touch, not the main event."
    };
  }

  if (provider === "food") {
    return {
      ctaLabel: "Open on Swiggy",
      providerLabel: "Food direction",
      subtitle: "A practical fallback if you want to keep the plan simple."
    };
  }

  return {
    ctaLabel: "Open live shortlist",
    providerLabel: "Dinner direction",
    subtitle: "A dinner path that fits the mood without overcomplicating it."
  };
}

function buildSuggestedOptions(pullPlan: PullPlan | undefined, plan: Plan | undefined): SuggestedOption[] {
  if (!plan) {
    return [];
  }

  if (plan.options?.length) {
    return plan.options.slice(0, 4).map((option) => {
      const copy = providerCopy(option.provider);

      return {
        ctaLabel: copy.ctaLabel,
        href: buildOptionHref(option, plan.request.location),
        mustTry: option.mustTry,
        provider: option.provider,
        providerLabel: copy.providerLabel,
        subtitle: option.subtitle || copy.subtitle,
        title: option.title,
        why: option.why
      };
    });
  }

  if (!pullPlan) {
    return [];
  }

  const location = plan.request.location;
  const providerMeta: Record<keyof PullPlan, { ctaLabel: string; providerLabel: string; subtitle: string }> = {
    dineout: providerCopy("dineout"),
    food: providerCopy("food"),
    instamart: providerCopy("instamart")
  };

  return (Object.entries(pullPlan) as Array<[keyof PullPlan, string[] | undefined]>)
    .flatMap(([provider, values]) =>
      (values ?? []).map((value) => ({
        ctaLabel: providerMeta[provider].ctaLabel,
        href: buildSearchHref(provider, value, location),
        providerLabel: providerMeta[provider].providerLabel,
        provider,
        subtitle: providerMeta[provider].subtitle,
        title: value,
        why: undefined
      }))
    )
    .slice(0, 4);
}

function formatBudget(plan: Plan) {
  const budget = plan.request.budgetRange;

  if (!budget?.min && !budget?.max) {
    return null;
  }

  if (budget.min && budget.max) {
    return `Rs ${budget.min} to Rs ${budget.max}`;
  }

  if (budget.max) {
    return `Up to Rs ${budget.max}`;
  }

  return `From Rs ${budget.min}`;
}

function formatTimeWindow(plan: Plan) {
  const timeWindow = plan.request.timeWindow;

  if (!timeWindow?.start && !timeWindow?.end) {
    return null;
  }

  if (timeWindow.start && timeWindow.end) {
    return `${timeWindow.start} to ${timeWindow.end}`;
  }

  return timeWindow.start ?? timeWindow.end ?? null;
}

function formatStepMeta(plan: Plan, index: number) {
  const step = plan.timeline[index];
  const parts = [step.scheduledFor, step.estimatedCost ? `Rs ${step.estimatedCost}` : null].filter(Boolean);

  return parts.length ? parts.join(" | ") : null;
}

function buildPlanContext(plan: Plan, needFromUser?: string[]) {
  const budgetLabel = formatBudget(plan);
  const timeWindowLabel = formatTimeWindow(plan);
  const foodPreferences = plan.request.foodPreferences?.filter(Boolean) ?? [];
  const constraints = plan.request.constraints?.filter(Boolean) ?? [];
  const directions =
    plan.options?.map((option) => `${option.provider}: ${option.title}`).filter(Boolean).join(" | ") ?? null;

  return [
    `Plan summary: ${plan.summary}`,
    `Occasion: ${plan.request.occasion}`,
    `Location: ${plan.request.location}`,
    budgetLabel ? `Budget: ${budgetLabel}` : null,
    plan.request.partySize ? `Party size: ${plan.request.partySize}` : null,
    timeWindowLabel ? `Time window: ${timeWindowLabel}` : null,
    foodPreferences.length ? `Food preferences: ${foodPreferences.join(", ")}` : null,
    constraints.length ? `Constraints: ${constraints.join(", ")}` : null,
    directions ? `Current directions: ${directions}` : null,
    needFromUser?.length ? `Still needed: ${needFromUser.join(", ")}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

function buildAssistantHistoryContent(message: ChatMessage) {
  if (!message.plan) {
    return message.content.trim();
  }

  return [message.content.trim(), buildPlanContext(message.plan, message.needFromUser)]
    .filter(Boolean)
    .join("\n\n");
}

function buildRequestHistory(messages: ChatMessage[]): ChatHistoryMessage[] {
  return messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content:
        message.role === "assistant" ? buildAssistantHistoryContent(message) : message.content.trim()
    }))
    .filter((message) => message.content);
}

function buildPlanActionPrompt(action: PlanAction, plan: Plan, needFromUser?: string[]) {
  const planContext = buildPlanContext(plan, needFromUser);

  if (action === "refine") {
    return [
      "Use the current Vivere plan context below and refine it into a sharper, more specific experience plan.",
      "Keep the same intent, budget, and constraints.",
      "Do not book or order anything yet.",
      "Keep the tone planner-first, grounded, and not salesy.",
      "",
      planContext
    ].join("\n");
  }

  if (action === "dinner-booking") {
    return [
      "Use the current Vivere plan context below.",
      "Prepare the dinner booking path for this plan through Dineout or a strong restaurant direction that fits Swiggy.",
      "Do not book anything yet.",
      "Give me a tight shortlist, what fits about each option, what to try there, and end with the exact confirmation you still need before taking action.",
      "",
      planContext
    ].join("\n");
  }

  return [
    "Use the current Vivere plan context below.",
    "Prepare the best small Instamart add-on path for this plan.",
    "Do not order anything yet.",
    "Suggest a tasteful shortlist that supports the evening instead of overselling it, then end with the exact confirmation you still need before taking action.",
    "",
    planContext
  ].join("\n");
}

function optionFallbackLabel(provider: PlanOption["provider"]) {
  if (provider === "dineout") {
    return "Connect Dineout and ask for the live shortlist.";
  }

  if (provider === "food") {
    return "Live Food shortlist is not available yet.";
  }

  return "Live Instamart shortlist is not available yet.";
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("Building your first draft...");
  const [error, setError] = useState<string | null>(null);
  const [swiggyStatus, setSwiggyStatus] = useState<SwiggyStatus | null>({
    connected: false
  });

  useEffect(() => {
    if (!error) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setError(null);
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [error]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isExtensionNoise(event.reason)) {
        return;
      }

      event.preventDefault();
      debugWarn("ignored-extension-rejection", {
        reason: describeError(event.reason).error
      });
    };

    const handleWindowError = (event: ErrorEvent) => {
      if (!isExtensionNoise(event.error ?? event.message)) {
        return;
      }

      event.preventDefault();
      debugWarn("ignored-extension-error", {
        message: event.message
      });
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleWindowError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleWindowError);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const url = new URL(window.location.href);
    const swiggy = url.searchParams.get("swiggy");
    const reason = url.searchParams.get("reason");

    if (swiggy === "error") {
      setError(reason ? `Swiggy connection failed: ${reason}.` : "Swiggy connection failed.");
    }

    if (swiggy) {
      url.searchParams.delete("swiggy");
      url.searchParams.delete("reason");
      url.searchParams.delete("server");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }

    const loadStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/swiggy/status`, {
          credentials: "include",
          signal: AbortSignal.timeout(6_000)
        });

        if (!response.ok) {
          throw new Error("Could not load Swiggy status.");
        }

        const payload = (await response.json()) as SwiggyStatus;

        if (!isCancelled) {
          setSwiggyStatus(payload);
        }
      } catch (caughtError) {
        debugWarn("swiggy-status:handled-failure", {
          ...describeError(caughtError)
        });

        if (!isCancelled) {
          setSwiggyStatus({
            connected: false
          });
        }
      }
    };

    if (swiggy === "connected" && !isCancelled) {
      debugLog("swiggy-status:from-callback", {
        server: url.searchParams.get("server") || "food"
      });
    }

    void loadStatus();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function submitPrompt(rawPrompt: string, options?: SubmitPromptOptions) {
    const prompt = rawPrompt.trim();
    const displayPrompt = options?.displayPrompt?.trim() || prompt;

    if (!prompt || isSubmitting) {
      return;
    }

    setError(null);
    setInput("");
    const history = buildRequestHistory(messages);
    setPendingMessage(
      options?.pendingLabel?.trim() ||
        (messages.length === 0 ? "Building your first draft..." : "Working through the next step...")
    );
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: displayPrompt
      }
    ]);
    setIsSubmitting(true);

    try {
      const clientRequestId = crypto.randomUUID();
      const requestUrl = `${API_BASE_URL}/api/chat`;

      debugLog("chat:start", {
        clientRequestId,
        prompt
      });

      const response = await fetch(requestUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "x-vivere-client-request-id": clientRequestId
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          history,
          message: prompt
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | (ChatResponse & { error?: string })
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? FRIENDLY_ERROR);
      }

      if (!payload) {
        throw new Error("Planner returned an empty response.");
      }

      debugLog("chat:success", {
        clientRequestId,
        requestId: response.headers.get("x-vivere-request-id"),
        status: response.status
      });

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.reply,
          needFromUser: payload.needFromUser,
          plan: payload.plan,
          pullPlan: payload.pullPlan
        }
      ]);
    } catch (caughtError) {
      const requestUrl = `${API_BASE_URL}/api/chat`;
      const message = messageFromChatError(caughtError, requestUrl);

      debugWarn("chat:handled-failure", {
        requestUrl,
        ...describeError(caughtError)
      });

      setError(message);
    } finally {
      setIsSubmitting(false);
      setPendingMessage("Building your first draft...");
    }
  }

  function handlePlanAction(action: PlanAction, plan: Plan, needFromUser?: string[]) {
    const prompt = buildPlanActionPrompt(action, plan, needFromUser);

    if (action === "refine") {
      void submitPrompt(prompt, {
        displayPrompt: "Refine this plan.",
        pendingLabel: "Refining the plan..."
      });
      return;
    }

    if (action === "dinner-booking") {
      void submitPrompt(prompt, {
        displayPrompt: "Prepare the dinner booking path.",
        pendingLabel: "Preparing the dinner path..."
      });
      return;
    }

    void submitPrompt(prompt, {
      displayPrompt: "Prepare the Instamart add-on path.",
      pendingLabel: "Preparing the add-on path..."
    });
  }

  async function handleSwiggyDisconnect() {
    if (isDisconnecting) {
      return;
    }

    setIsDisconnecting(true);
    setError(null);

    try {
      debugLog("swiggy-logout:start", {
        url: `${API_BASE_URL}/api/auth/swiggy/logout`
      });

      const response = await fetch(`${API_BASE_URL}/api/auth/swiggy/logout`, {
        method: "POST",
        credentials: "include",
        signal: AbortSignal.timeout(8_000)
      });

      if (!response.ok) {
        throw new Error("Could not disconnect Swiggy right now.");
      }

      setSwiggyStatus({
        connected: false
      });

      debugLog("swiggy-logout:success", {
        requestId: response.headers.get("x-vivere-request-id"),
        status: response.status
      });
    } catch (caughtError) {
      debugWarn("swiggy-logout:handled-failure", {
        ...describeError(caughtError)
      });

      setError(caughtError instanceof Error ? caughtError.message : FRIENDLY_ERROR);
    } finally {
      setIsDisconnecting(false);
    }
  }

  function handleResetChat() {
    setMessages([]);
    setInput("");
    setError(null);
    setPendingMessage("Building your first draft...");
    setIsSubmitting(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitPrompt(input);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitPrompt(input);
    }
  }

  const isEmpty = messages.length === 0 && !isSubmitting;
  const latestMessageId = messages.at(-1)?.id;

  return (
    <main className="chat-app">
      {error ? (
        <div className="chat-snackbar" role="alert" aria-live="assertive">
          <div className="chat-snackbar-icon" aria-hidden="true">
            !
          </div>
          <div className="chat-snackbar-copy">
            <p className="chat-snackbar-title">Please try again later</p>
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      <header className="chat-header">
        <div className="chat-header-inner">
          <div className="chat-wordmark">Vivere</div>
          <div className="provider-tags">
            <span className="provider-tag">{swiggyStatusLabel(swiggyStatus)}</span>
            {!isServerConnected(swiggyStatus, "food") ? (
              <a className="chat-header-link" href={SWIGGY_CONNECT_URLS.food}>
                Connect Food
              </a>
            ) : null}
            {!isServerConnected(swiggyStatus, "im") ? (
              <a className="chat-header-link" href={SWIGGY_CONNECT_URLS.im}>
                Connect Instamart
              </a>
            ) : null}
            {!isServerConnected(swiggyStatus, "dineout") ? (
              <a className="chat-header-link" href={SWIGGY_CONNECT_URLS.dineout}>
                Connect Dineout
              </a>
            ) : null}
            {swiggyStatus?.connected ? (
              <button
                className="chat-header-link"
                disabled={isDisconnecting}
                onClick={() => void handleSwiggyDisconnect()}
                type="button"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect Swiggy"}
              </button>
            ) : null}
            {messages.length ? (
              <button className="chat-header-link" onClick={handleResetChat} type="button">
                New chat
              </button>
            ) : null}
            <a className="chat-header-link" href="/">
              Home
            </a>
          </div>
        </div>
      </header>

      <section aria-live="polite" className={isEmpty ? "chat-main chat-main-empty" : "chat-main"}>
        {isEmpty ? (
          <div className="chat-empty-state">
            <h1>What are you planning today?</h1>
            <p>
              Describe the moment, city, budget, and any must-haves. The frontend now talks to the
              Worker directly.
            </p>
            <p>
              {swiggyStatus?.connected
                ? "Swiggy servers are connected. Planning can stay in chat and live actions can stay in the backend."
                : "Connect Food, Instamart, or Dineout when you want live Swiggy options instead of planner-only suggestions."}
            </p>
            <div className="chat-suggestion-row">
              {QUICK_PROMPTS.map((prompt, index) => (
                <button
                  key={prompt}
                  className="chat-suggestion-chip"
                  onClick={() => void submitPrompt(prompt)}
                  type="button"
                >
                  {OCCASIONS[index]?.title ?? "Idea"}
                </button>
              ))}
              {!swiggyStatus?.connected ? (
                <a className="secondary-action" href={SWIGGY_CONNECT_URLS.food}>
                  Connect Food
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="chat-message-list">
            {messages.map((message) => {
              const plan = message.plan;
              const budgetLabel = plan ? formatBudget(plan) : null;
              const timeWindowLabel = plan ? formatTimeWindow(plan) : null;
              const foodPreferences = plan?.request.foodPreferences?.filter(Boolean) ?? [];
              const constraints = plan?.request.constraints?.filter(Boolean) ?? [];
              const suggestedOptions = buildSuggestedOptions(message.pullPlan, plan);
              const hasLiveOptionLinks = suggestedOptions.some((option) => Boolean(option.href));
              const planTips = plan?.tips?.filter(Boolean) ?? [];
              const showPlanActions = message.role === "assistant" && Boolean(plan) && message.id === latestMessageId;

              return (
                <article
                  key={message.id}
                  className={message.role === "assistant" ? "chat-message assistant-message" : "chat-message user-message"}
                >
                  <p className="message-copy">{message.content}</p>

                  {!plan && message.needFromUser?.length ? (
                    <div className="provider-tags">
                      {message.needFromUser.map((value) => (
                        <span key={value} className="provider-tag">
                          {formatNeedLabel(value)}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {plan ? (
                    <section className="plan-card">
                      <div className="plan-copy">
                        <p className="section-kicker">Suggested plan</p>
                        <h2>{plan.summary}</h2>
                        <dl className="plan-meta">
                          <div>
                            <dt>Occasion</dt>
                            <dd>{plan.request.occasion}</dd>
                          </div>
                          <div>
                            <dt>Location</dt>
                            <dd>{plan.request.location}</dd>
                          </div>
                          {budgetLabel ? (
                            <div>
                              <dt>Budget</dt>
                              <dd>{budgetLabel}</dd>
                            </div>
                          ) : null}
                          {plan.request.partySize ? (
                            <div>
                              <dt>Party</dt>
                              <dd>{plan.request.partySize} people</dd>
                            </div>
                          ) : null}
                          {timeWindowLabel ? (
                            <div>
                              <dt>Time</dt>
                              <dd>{timeWindowLabel}</dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>

                      <ul className="timeline-list">
                        {plan.timeline.map((step, index) => {
                          const stepMeta = formatStepMeta(plan, index);

                          return (
                            <li key={step.id} className="timeline-step">
                              <div className="timeline-marker" aria-hidden="true" />
                              <div>
                                <h3>{step.title}</h3>
                                {stepMeta ? <p className="timeline-meta">{stepMeta}</p> : null}
                                {step.rationale ? <p>{step.rationale}</p> : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      {foodPreferences.length ? (
                        <div className="plan-notes">
                          <p className="section-kicker">Food preferences</p>
                          <ul className="plan-note-list">
                            {foodPreferences.map((value) => (
                              <li key={value}>{value}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {constraints.length ? (
                        <div className="plan-notes">
                          <p className="section-kicker">Constraints</p>
                          <ul className="plan-note-list">
                            {constraints.map((value) => (
                              <li key={value}>{value}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {suggestedOptions.length ? (
                        <div className="plan-notes">
                          <p className="section-kicker">{hasLiveOptionLinks ? "Live options" : "Possible directions"}</p>
                          <div className="option-grid">
                            {suggestedOptions.map((option) => (
                              <article key={`${option.providerLabel}-${option.title}`} className="option-card">
                                <p className="option-provider">{option.providerLabel}</p>
                                <h3>{option.title}</h3>
                                <p className="option-copy">{option.subtitle}</p>
                                {option.mustTry?.length ? (
                                  <ul className="option-list">
                                    {option.mustTry.map((item) => (
                                      <li key={item}>{item}</li>
                                    ))}
                                  </ul>
                                ) : null}
                                {option.why ? <p className="option-copy">{option.why}</p> : null}
                                {option.href ? (
                                  <a className="option-link" href={option.href} rel="noreferrer" target="_blank">
                                    {option.ctaLabel}
                                  </a>
                                ) : (
                                  <p className="option-link option-link-muted">
                                    {optionFallbackLabel(option.provider)}
                                  </p>
                                )}
                              </article>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="plan-notes">
                        <p className="section-kicker">What I Can Do Next</p>
                        {showPlanActions ? (
                          <div className="plan-action-row">
                            <button
                              className="plan-action-button"
                              disabled={isSubmitting}
                              onClick={() => handlePlanAction("refine", plan, message.needFromUser)}
                              type="button"
                            >
                              Refine this plan
                            </button>
                            <button
                              className="plan-action-button"
                              disabled={isSubmitting}
                              onClick={() => handlePlanAction("dinner-booking", plan, message.needFromUser)}
                              type="button"
                            >
                              Prepare dinner path
                            </button>
                            <button
                              className="plan-action-button"
                              disabled={isSubmitting}
                              onClick={() => handlePlanAction("add-on", plan, message.needFromUser)}
                              type="button"
                            >
                              Prepare Instamart add-on
                            </button>
                          </div>
                        ) : null}
                        <ul className="plan-note-list">
                          <li>Refine the evening before touching live inventory.</li>
                          <li>Prepare a dinner booking path only when you are ready to narrow the venue.</li>
                          <li>Prepare a small Instamart add-on when you want a finishing touch.</li>
                          <li>Booking or ordering only happens after your explicit go-ahead.</li>
                        </ul>
                      </div>

                      {planTips.length ? (
                        <div className="plan-notes">
                          <p className="section-kicker">How to make it land</p>
                          <ul className="plan-note-list">
                            {planTips.map((value) => (
                              <li key={value}>{value}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {message.needFromUser?.length ? (
                        <div className="plan-notes">
                          <p className="section-kicker">Still needed from you</p>
                          <ul className="plan-note-list">
                            {message.needFromUser.map((value) => (
                              <li key={value}>{formatNeedLabel(value)}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </section>
                  ) : null}
                </article>
              );
            })}

            {isSubmitting ? (
              <article className="chat-message assistant-message pending-message">
                <Spinner />
                <p className="message-copy">{pendingMessage}</p>
              </article>
            ) : null}
          </div>
        )}
      </section>

      <div className="chat-composer-dock">
        <div className="chat-composer-shell">
          <form className="chat-composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="planner-input">
              Tell Vivere what you are planning
            </label>
            <textarea
              id="planner-input"
              className="chat-composer-input"
              name="planner"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Message Vivere..."
              rows={1}
              value={input}
            />
            <button className="chat-send-button" disabled={isSubmitting || !input.trim()} type="submit">
              {isSubmitting ? (
                <Spinner className="spinner-on-dark" />
              ) : (
                <svg
                  aria-hidden="true"
                  className="chat-send-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h12" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
