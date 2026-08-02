# Vivere

Frontend repo for the Vivere PWA.

Vivere is an experience-planning product. This repo owns the user-facing layer: landing, occasion selection, intake, plan rendering, installability, and frontend state. AI orchestration, provider integrations, and execution live in the separate `vivere-api` repo.

## What Is Vivere

Vivere is a planning product for real-life moments.

Instead of asking the user to manually piece together dinner, gifts, flowers, reservations, or add-ons across multiple apps, Vivere starts with the occasion and builds a structured plan around it.

The goal is simple: reduce decision fatigue and help someone go from "something is happening" to "the plan is handled."

## What This Repo Is For

- Cloudflare Pages deployment target
- static-friendly Next.js application
- PWA shell, manifest, and install behavior
- premium, guided UI for the planning flow
- client-side state and API consumption

## What This Repo Is Not For

- AI prompts
- Swiggy integration logic
- secret handling
- planning engine logic
- execution orchestration

## Current Status

The repo currently contains:

- the initial PWA shell
- a first homepage with occasion cards
- a small install prompt hook
- product and architecture docs

The intake flow, real API wiring, and plan rendering screens are still to be built.

## Repo Shape

```text
app/          Next.js app routes and layout
components/   presentational UI pieces
hooks/        small client hooks
lib/          frontend config and helpers
public/       static assets and manifest
styles/       global tokens
types/        frontend-safe shared shapes
docs/         deeper system docs
```

## Key Docs

- [PRD](./PRD.md)
- [Architecture](./ARCHITECTURE.md)
- [Tech Stack](./TECH_STACK.md)
- [Design System](./DESIGN_SYSTEM.md)
- [Roadmap](./ROADMAP.md)
- [Setup](./SETUP.md)
- [System Architecture](./docs/system-architecture.md)

## Quick Start

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` before wiring real API calls.
