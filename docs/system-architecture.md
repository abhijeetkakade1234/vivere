# Vivere System Architecture

Status: draft source of truth
Date: 2026-07-25
Repo: `D:\Vivere` (`vivere` frontend repo)

## 1. Purpose

Vivere is a PWA that plans experiences, not just transactions. Users start with a moment or intent, then Vivere turns that into a plan, recommended actions, and execution steps.

This document locks the runtime and repo boundaries before MVP scoping. The goal is to avoid mixing UI work, AI orchestration, and provider integration into one vague codebase.

Note: the concept note still uses `Moments`. Until branding is finalized, this repo uses `Vivere` as the working product name.

## 2. Architecture Principles

1. PWA first. The main product is a mobile-friendly installable web app.
2. Two repos, one product. Frontend and API are separate repos with one clean HTTP boundary.
3. Server owns decisions. AI orchestration, provider calls, pricing, and execution stay off the client.
4. Structured over chatty. The UX should feel guided, calm, and deterministic even when AI is used underneath.
5. Approve before execute. Real-world actions should be reviewable before they happen.
6. Split later, not now. Do not add more repos or more Workers until a real boundary appears.

## 3. What We Freeze Now

- Platform: installable PWA
- Repo topology: `vivere` plus `vivere-api`
- Frontend hosting: Cloudflare Pages
- Backend runtime: standalone Cloudflare Worker in `vivere-api`
- Language: TypeScript end to end
- Integration boundary: all Swiggy and AI calls go through `vivere-api`
- Data model style: plan-centric, not cart-centric
- UX posture: guided flow, not open-ended chatbot

## 4. What We Deliberately Do Not Freeze Yet

- Exact MVP experience set
- Exact AI provider
- Final auth model
- Payment and checkout ownership details
- Personalization depth

Those depend on partner constraints, Swiggy integration realities, and demo scope.

## 5. Runtime Shape

```text
Cloudflare Pages (PWA client)
  -> vivere-api Cloudflare Worker
    -> Planning engine
    -> Execution orchestrator
    -> Swiggy adapters
    -> Persistence
```

### 5.1 Frontend Repo: `vivere`

This repo owns:

- PWA shell
- occasion selection
- questionnaire UI
- plan review and edit UI
- live plan rendering
- local session state
- manifest and service worker behavior

This repo does not own:

- AI prompts
- plan generation
- provider integrations
- pricing logic
- secret handling
- execution state transitions

### 5.2 API Repo: `vivere-api`

That repo owns:

- HTTP API
- planning engine
- prompt building
- AI gateway
- Swiggy adapters
- validation
- persistence
- future memory and personalization

This Worker is the single public backend boundary for the product.

## 6. Frontend Constraints

Pages is fine for this repo as long as the frontend stays a true frontend.

Rules:

- Keep this repo client-rendered or static-friendly if it stays on Pages.
- Do not bury business logic in frontend API routes or server actions.
- If the chosen frontend stack later depends on full-stack SSR behavior, re-evaluate the deploy target instead of forcing it into the current split.

## 7. Core Domain Model

The product should be centered on a plan, not a cart.

### 7.1 Experience Request

```ts
type ExperienceRequest = {
  occasion: string;
  location: string;
  budgetRange?: { min?: number; max?: number };
  timeWindow?: { start?: string; end?: string };
  partySize?: number;
  foodPreferences?: string[];
  constraints?: string[];
  notes?: string;
};
```

### 7.2 Plan

```ts
type Plan = {
  id: string;
  status: "draft" | "planned" | "approved" | "executing" | "active" | "completed" | "failed";
  request: ExperienceRequest;
  summary: string;
  totalEstimate?: number;
  timeline: PlanStep[];
  approvals: ApprovalGate[];
  providerRefs: ProviderRef[];
  createdAt: string;
  updatedAt: string;
};
```

### 7.3 Plan Step

```ts
type PlanStep = {
  id: string;
  kind: "gift" | "reservation" | "food" | "dessert" | "travel" | "note";
  title: string;
  rationale?: string;
  scheduledFor?: string;
  estimatedCost?: number;
  executionStatus?: "pending" | "ready" | "running" | "done" | "failed";
};
```

## 8. State Model

```text
draft -> planned -> approved -> executing -> active -> completed
                                  \-> failed
```

Rules:

- `draft`: user is still answering questions
- `planned`: AI has generated a reviewable plan
- `approved`: user accepted execution-ready actions
- `executing`: backend is placing orders or reservations
- `active`: some orders exist and live tracking matters
- `completed` or `failed`: terminal states

This state model should drive both API behavior and route structure.

## 9. PWA Behavior

The PWA should be useful offline in a limited way, not fake-offline.

Required:

- web app manifest
- installable shell
- service worker for static assets
- cache the most recent plan payload
- re-open the last active plan when connectivity returns

Not required at first:

- offline provider execution
- offline plan generation
- background sync for purchases
- full offline queue replay

`ponytail:` offline should help users reopen context, not pretend orders can be placed without network.

## 10. Cloudflare Mapping

Use the smallest set of Cloudflare primitives that solves the problem.

### 10.1 Pages

Use Pages for:

- frontend hosting
- preview deployments
- fast frontend rollouts

### 10.2 Worker

Use one standalone Worker in `vivere-api` for:

- public API
- AI orchestration
- Swiggy provider adapters
- validation
- execution state changes
- live status reads

### 10.3 Domains

Production recommendation:

- frontend on a Pages custom domain such as `vivere.example.com`
- API on a Worker custom domain such as `api.example.com`

Development or early demo fallback:

- frontend on `*.pages.dev`
- API on `*.workers.dev`

Do not design around `api.vivere.pages.dev` for the Worker API. A standalone Worker should use `workers.dev` in development or a real custom domain in production.

### 10.4 D1

Default first datastore:

- plans
- sessions
- approvals
- execution records
- provider references

Use D1 unless we hit a real ceiling. Do not start with external Postgres just because it feels more serious.

### 10.5 KV

Good fit for:

- short-lived caches
- small config flags
- rate-limit counters

Do not use KV as the source of truth for plans.

### 10.6 Queues

Skip Queues at the start.

Add them only if:

- provider execution becomes slow enough to exceed request comfort
- webhook processing needs buffering
- retries need decoupling from user requests

### 10.7 Durable Objects

Skip Durable Objects at the start.

Add them only if we need strict per-plan coordination, websocket fan-out, or single-writer guarantees.

### 10.8 R2

Skip R2 unless we start storing receipts, generated cards, or media artifacts.

## 11. AI Boundary

AI should produce structured planning output, not free-form chat blobs.

Backend responsibilities:

- compose prompts from structured inputs
- call the model
- validate the response shape
- reject malformed output
- map output into the `Plan` model

Guardrails:

- never let raw model output become the UI contract
- never let the model directly trigger provider execution
- keep explanation text separate from execution fields

## 12. API Shape

Suggested first endpoints:

- `POST /api/plans`
- `GET /api/plans/:id`
- `POST /api/plans/:id/replan`
- `POST /api/plans/:id/approve`
- `POST /api/plans/:id/execute`
- `GET /api/plans/:id/status`

Do not add occasion-specific endpoints unless the domain truly forces it.

## 13. Security and Privacy

Minimum bar from day one:

- server-side secret storage only
- input validation on every write endpoint
- explicit approval before irreversible actions
- provider reference IDs stored for auditability
- PII minimization in prompts and logs
- correlation IDs for debugging multi-step failures

Cloudflare-specific note:

- keep external API secrets in Worker env vars
- keep Pages free of server secrets

## 14. Observability

Track these from the start:

- plan generation latency
- model failures and malformed output rate
- provider call latency and failure rate
- execution step success rate
- drop-off by plan state

Without this, the system will look like a UX problem when it is really an orchestration problem.

## 15. Suggested Repo Shapes

This repo:

```text
vivere/
  app/
  components/
  hooks/
  lib/
  public/
  styles/
  types/
  docs/
```

Separate API repo:

```text
vivere-api/
  src/
    routes/
    planner/
    prompts/
    services/
    validators/
    schemas/
    index.ts
```

Do not create another Worker repo for provider proxying yet.

## 16. Decision Gates Before MVP Scope

These need answers before choosing the first experience flow:

1. Is the first release guest-only or account-based?
2. Is execution suggest-only, approve-each-step, or one-click approved?
3. Do we have a reliable Swiggy contract for Food, Instamart, and Dineout?
4. Are we planning only recommendations, or real reservations and checkout?
5. Is the first release city-limited?
6. Does live tracking come from polling, webhook callbacks, or both?
7. Is `Vivere` the final product name, or is `Moments` still active?

If these stay fuzzy, MVP decisions will be random and the architecture will drift.

## 17. Recommended Build Order

1. Confirm the decision gates above.
2. Scaffold `vivere-api` as a standalone Worker repo.
3. Keep this repo focused on the PWA shell and client flows.
4. Implement the `Plan` domain model and state machine first in `vivere-api`.
5. Build the plan creation and review flow before any provider execution.
6. Add provider adapters behind mocks before real tool calls.
7. Add execution and tracking only after review flow feels correct.

## 18. Immediate Next Output

Before coding the MVP, produce these follow-ups:

1. Product decision memo answering the seven decision gates
2. PWA route map for `vivere`
3. API contract draft for `vivere-api`
