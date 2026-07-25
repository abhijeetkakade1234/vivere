# Frontend Architecture

This repo is the frontend half of the product.

## Boundary

```text
Browser
  -> Cloudflare Pages
    -> vivere UI
      -> HTTPS
        -> vivere-api
```

## This Repo Owns

- App shell
- PWA manifest and install prompt
- occasion selection
- questionnaire UI
- plan review and plan rendering
- local UI state

## This Repo Does Not Own

- AI prompts
- planning engine
- Swiggy adapters
- secrets
- execution orchestration

## Build Constraint

This frontend stays static-friendly so it can deploy cleanly to Cloudflare Pages. Business logic lives in `vivere-api`, not in frontend API routes.

For the detailed product-level architecture, read [docs/system-architecture.md](./docs/system-architecture.md).
