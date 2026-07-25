# Frontend Setup

## Requirements

- Node.js 20+
- npm 10+

## Install

```bash
npm install
```

## Local env

Create `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

Cloudflare Pages should publish the generated static output from `out/`.
