# Frontend Setup

## Requirements

- Node.js 22+
- npm 11+

Validated locally on:

- Node `v22.13.1`
- npm `11.5.2`

## Install

```bash
npm install
```

## Local Env

Create `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787
```

This value should point at the local `vivere-api` dev server.

## Run

```bash
npm run dev
```

## Checks

```bash
npm run typecheck
npm run build
```

## Deployment Note

This repo is configured for static export. Cloudflare Pages should publish the generated output from `out/`.
