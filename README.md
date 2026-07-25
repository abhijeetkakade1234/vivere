# Vivere

Frontend repo for the Vivere PWA.

Vivere is an experience-planning product. The frontend owns the guided user experience: occasion selection, lightweight intake, plan review, and live plan rendering. AI orchestration, Swiggy integration, and execution live in the separate `vivere-api` repo.

## Repo Role

- Cloudflare Pages deployment target
- static-friendly Next.js frontend
- PWA shell and installability
- UI state and client-side flows
- calls `vivere-api` over HTTPS

## Key Docs

- [PRD](./PRD.md)
- [Architecture](./ARCHITECTURE.md)
- [Roadmap](./ROADMAP.md)
- [Setup](./SETUP.md)
- [Detailed system architecture](./docs/system-architecture.md)

## Quick Start

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` before wiring real API calls.
