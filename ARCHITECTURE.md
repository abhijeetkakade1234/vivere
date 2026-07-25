# Frontend Architecture

This repo is the frontend half of the product.

## Runtime Boundary

```text
Browser
  -> Cloudflare Pages
    -> Vivere UI
      -> HTTPS
        -> vivere-api
```

The frontend is intentionally thin. It owns presentation, interaction flow, and API consumption. It does not own planning logic.

## Responsibilities

This repo owns:

- app shell
- PWA manifest and install prompt behavior
- landing and occasion selection
- questionnaire UI
- plan review and plan rendering
- local UI state
- frontend-safe type definitions

This repo does not own:

- AI prompts
- planning engine logic
- Swiggy adapters
- secrets
- execution orchestration
- provider payload normalization

## Route Direction

The intended route progression is:

1. landing and occasion entry
2. intake and preference capture
3. plan preview and review
4. live status and execution follow-up

The current codebase only includes the first slice.

## Data Flow

The frontend should only exchange structured JSON with `vivere-api`.

Rules:

- never consume raw model output directly
- never encode provider-specific assumptions into UI components
- keep plan rendering based on product-level types such as `Plan` and `PlanStep`
- keep API base URL configurable through `NEXT_PUBLIC_API_BASE_URL`

## Build Constraint

This frontend stays static-friendly so it can deploy cleanly to Cloudflare Pages.

That means:

- no server-side business logic in this repo
- no dependence on frontend API routes
- no architecture choices that force this repo to behave like a full-stack origin

For the deeper product-level boundary, read [docs/system-architecture.md](./docs/system-architecture.md).
