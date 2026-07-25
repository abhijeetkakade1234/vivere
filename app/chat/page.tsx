"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/spinner";
import { OCCASIONS } from "@/lib/app-config";
import type { ChatResponse, Plan } from "@/types/plans";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  plan?: Plan;
};

const QUICK_PROMPTS = [
  "Plan a first date in Pune with dinner and flowers under Rs 3000.",
  "I need a birthday plan in Mumbai for 6 people with cake and dinner.",
  "Help me plan a cozy movie night at home with snacks and dessert.",
  "Plan a rainy evening in Bangalore with comfort food and something small to gift."
];

const FRIENDLY_ERROR =
  "We could not connect right now. Please try again later. If this keeps happening, email abhijeetskakade04@gmail.com.";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setError(null);
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [error]);

  async function submitPrompt(rawPrompt: string) {
    const prompt = rawPrompt.trim();

    if (!prompt || isSubmitting) {
      return;
    }

    setError(null);
    setInput("");
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: prompt
      }
    ]);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          message: prompt
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach planning API.");
      }

      const payload = (await response.json()) as ChatResponse;

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.reply,
          plan: payload.plan
        }
      ]);
    } catch {
      setError(FRIENDLY_ERROR);
    } finally {
      setIsSubmitting(false);
    }
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
          <a className="chat-header-link" href="/">
            Log out
          </a>
        </div>
      </header>

      <section aria-live="polite" className={isEmpty ? "chat-main chat-main-empty" : "chat-main"}>
        {isEmpty ? (
          <div className="chat-empty-state">
            <h1>What are you planning today?</h1>
            <p>Describe the moment, city, budget, and any must-haves.</p>
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
            </div>
          </div>
        ) : (
          <div className="chat-message-list">
            {messages.map((message) => (
              <article
                key={message.id}
                className={message.role === "assistant" ? "chat-message assistant-message" : "chat-message user-message"}
              >
                <p className="message-copy">{message.content}</p>

                {message.plan ? (
                  <section className="plan-card">
                    <div className="plan-copy">
                      <p className="section-kicker">Draft plan</p>
                      <h2>{message.plan.summary}</h2>
                      <p>
                        Occasion: {message.plan.request.occasion} | Location: {message.plan.request.location}
                      </p>
                    </div>

                    <ul className="timeline-list">
                      {message.plan.timeline.map((step) => (
                        <li key={step.id} className="timeline-step">
                          <div className="timeline-marker" aria-hidden="true" />
                          <div>
                            <h3>{step.title}</h3>
                            {step.rationale ? <p>{step.rationale}</p> : null}
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="provider-tags">
                      {message.plan.providerCandidates.map((candidate) => (
                        <span key={candidate} className="provider-tag">
                          {candidate}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}
              </article>
            ))}

            {isSubmitting ? (
              <article className="chat-message assistant-message pending-message">
                <Spinner />
                <p className="message-copy">Building your first draft...</p>
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
