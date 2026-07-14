# DreamNest

DreamNest is a full-stack personal and couple-friendly financial planning app focused on dream-based saving.

Users can:
- Create savings dreams with targets, priorities, deadlines, and monthly plans
- Track income, expenses, savings, investments, and transfers
- View timelines, progress, and analytics
- Use a guided onboarding and gamified rewards flow
- Access account data across devices using persistent backend storage

Production URL:
- https://dreamnest-backend.netlify.app

## Documentation Index

Detailed documentation is available in the [docs](docs) folder:

1. [App Overview](docs/01-overview.md)
2. [Features](docs/02-features.md)
3. [Tech Stack](docs/03-tech-stack.md)
4. [Architecture](docs/04-architecture.md)
5. [API Reference](docs/05-api-reference.md)
6. [Local Setup](docs/06-local-setup.md)
7. [Deployment (Netlify)](docs/07-deployment-netlify.md)
8. [Data Persistence and Sync](docs/08-data-persistence-and-sync.md)
9. [Testing and QA Checklist](docs/09-testing-and-qa-checklist.md)
10. [User Guide](docs/10-user-guide.md)
11. [Quick User Guide (Non-Technical)](docs/11-user-guide-quick.md)

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+
- Netlify account (for production deploys)

### Install

From repository root:

```bash
npm install
cd frontend
npm install
```

### Run (Recommended)

Run from repository root using Netlify local dev so frontend and function API run together:

```bash
npx netlify dev
```

Then open:
- http://localhost:8888

## Production Deployment

From repository root:

```bash
npx --yes netlify-cli deploy --prod --build --skip-functions-cache
```

This command:
- Installs dependencies
- Builds the frontend
- Bundles serverless functions
- Publishes to the production URL

## Repository Structure

```text
.
├─ frontend/                 # React + TypeScript + Vite app
├─ netlify/functions/        # Netlify serverless API
├─ docs/                     # Full project documentation
├─ netlify.toml              # Netlify build + redirect config
├─ package.json              # Root dependencies for functions
└─ backend/                  # Python backend artifacts (legacy/non-active path)
```

## Notes

- Current production backend persistence is implemented in [netlify/functions/api.mjs](netlify/functions/api.mjs) using Netlify Blobs.
- Frontend API client is in [frontend/src/lib/api.ts](frontend/src/lib/api.ts).
- App state and sync behavior are managed in [frontend/src/context/DreamContext.tsx](frontend/src/context/DreamContext.tsx).
