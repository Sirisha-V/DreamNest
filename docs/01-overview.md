# DreamNest App Overview

## Purpose

DreamNest helps users plan life goals and save toward them in a structured, visual, and trackable way.

The app combines:
- Dream goal planning
- Daily money tracking
- Progress forecasting
- Timeline simulation
- Couple-oriented planning

## Core User Flow

1. User creates an account or logs in
2. User creates one or more dreams with target amount and deadline
3. User adds income, expenses, and savings transactions
4. Dashboard and analytics update progress automatically
5. User tracks each dream using timeline/simulator tools
6. User continues from any device with account-based sync

## Product Scope

DreamNest currently supports:
- Auth flows (register, login, reset password)
- Protected app routes
- Goal and transaction CRUD operations
- Monthly savings and progress insights
- Onboarding and gamified streak/reward loops
- Responsive mobile-first layout

## Current Deployment

- Platform: Netlify
- Frontend: Static site from Vite build output
- Backend: Netlify serverless function
- Data persistence: Netlify Blobs store

## Key File Entry Points

- App routes: [frontend/src/App.tsx](../frontend/src/App.tsx)
- App shell/layout: [frontend/src/components/Layout.tsx](../frontend/src/components/Layout.tsx)
- Global state: [frontend/src/context/DreamContext.tsx](../frontend/src/context/DreamContext.tsx)
- API client: [frontend/src/lib/api.ts](../frontend/src/lib/api.ts)
- API function: [netlify/functions/api.mjs](../netlify/functions/api.mjs)
