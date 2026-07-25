# Frontend Tech Stack

This file describes the current frontend stack as it actually exists in the repo today.

## Current Stack

| Area | Choice | Why |
| --- | --- | --- |
| App framework | Next.js 16 App Router | Good developer ergonomics with a static-friendly output path |
| UI runtime | React 19 | Modern React baseline for the app shell and client interactions |
| Language | TypeScript | Safer component and API contract work |
| Styling | Plain CSS with design tokens | Small surface area, zero extra styling dependency, easy to control visual quality |
| Deployment target | Cloudflare Pages | Fits the frontend-only repo split |
| PWA support | Web manifest plus client install prompt handling | Enough to establish the installable app shell now |

## Deliberate Non-Choices

The current frontend does not use:

- Tailwind
- shadcn
- Framer Motion
- Redux, Zustand, or another client state library
- frontend API routes

Those are not banned. They are simply not needed yet.

## Why Static-Friendly Next.js

This repo is meant to stay a frontend repo, not become a disguised full-stack app.

Static-friendly Next.js gives us:

- Pages-compatible deployment
- App Router structure for the UI
- a clean path to richer screens later

If the product later truly needs full-stack SSR behavior in the frontend repo, that should be a deliberate architecture change, not an accidental drift.
