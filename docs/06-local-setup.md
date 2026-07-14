# Local Setup and Run Guide

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- Optional: Netlify CLI for local full-stack emulation

## Install Dependencies

From repository root:

```bash
npm install
cd frontend
npm install
```

## Recommended Local Run (Full App)

Use Netlify dev so frontend and function API run together behind one host:

From repository root:

```bash
npx netlify dev
```

Open:
- http://localhost:8888

## Frontend-only Run (Alternative)

From frontend folder:

```bash
npm run dev
```

Open:
- http://localhost:5173 (default Vite port)

Important:
- If you run frontend-only, API calls need a backend target.
- Configure VITE_API_URL in env if not using Netlify routing.

## Build

From frontend folder:

```bash
npm run build
```

This runs TypeScript build and Vite production bundle.

## Troubleshooting

### Not authenticated or redirect loop
- Ensure browser has a valid token from login.
- Re-login and retry.

### API unreachable in local
- Prefer running npx netlify dev from root.
- Confirm no port conflicts.

### Old UI/assets still visible
- Hard refresh browser (Ctrl+F5).

## Key Runtime Config

From [netlify.toml](../netlify.toml):
- VITE_API_URL defaults to /api in build environment
- /api/* paths redirect to function handler
