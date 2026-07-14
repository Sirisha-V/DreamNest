# Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- React Router DOM
- Recharts
- Framer Motion
- Lucide React icons

Dependency source:
- [frontend/package.json](../frontend/package.json)

## Backend/API

- Netlify Serverless Functions
- JavaScript (ES Modules)
- Netlify Blobs for persistence

Main file:
- [netlify/functions/api.mjs](../netlify/functions/api.mjs)

## Infrastructure

- Netlify hosting + function runtime
- Static frontend publish from Vite dist
- API path redirect via Netlify routing

Config:
- [netlify.toml](../netlify.toml)

## Data Layer

- Persistent key-value JSON storage in Netlify Blobs store
- Server-generated IDs for goals and transactions
- User keyed by normalized email

## Development Tooling

- npm package management
- TypeScript compiler build
- Oxlint (configured in frontend scripts)

## Legacy/Secondary Artifacts

Repository contains Python backend files and DB artifacts under backend/. Current production path uses Netlify function API.
