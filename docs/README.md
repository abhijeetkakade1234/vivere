# Vivere Docs

This folder holds deeper architecture material that supports the root markdown docs.

## Read Order

1. [../README.md](../README.md)
2. [../PRD.md](../PRD.md)
3. [../ARCHITECTURE.md](../ARCHITECTURE.md)
4. [system-architecture.md](./system-architecture.md)

## Guardrails

- Build a PWA, not a native app.
- This repo is the frontend repo: `vivere`.
- Deploy this repo to Cloudflare Pages.
- Keep AI, Swiggy, and orchestration in the separate `vivere-api` Worker repo.
- Keep product and technical decisions aligned with the repo split.
