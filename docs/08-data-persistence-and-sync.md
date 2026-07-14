# Data Persistence and Cross-Device Sync

## Problem Solved

Earlier behavior had instance-local memory constraints in serverless runtime. This caused data visibility differences across sessions/devices.

Current implementation persists state in Netlify Blobs, enabling stable account data retrieval.

Main persistence implementation:
- [netlify/functions/api.mjs](../netlify/functions/api.mjs)

## How Persistence Works

- Function loads state from Blob key: db/v1.json
- Runtime mutates in-memory state object
- Any write operation saves updated state back to Blob

Persisted structures:
- usersByEmail
- goalsByUser
- transactionsByUser
- counters for ID generation

## Cross-Device Sync Model

When same user logs in on phone and desktop:
- Both devices authenticate with same email-based token identity
- Both read/write same persisted user scope
- Updates appear after data fetch/refresh

## Frontend Sync Behavior

The frontend context:
- Loads server data on refresh
- Maintains local cache for resilience and UI continuity
- Reconciles and snapshots state updates

Main file:
- [frontend/src/context/DreamContext.tsx](../frontend/src/context/DreamContext.tsx)

## Known Constraints

- Current auth token model is lightweight and not fully JWT-hardened.
- Blob persistence is suitable for this project stage, but relational DB is preferred for large-scale/strict consistency workloads.

## Suggested Future Upgrades

1. Move to managed relational DB
2. Add proper password hashing and secure auth tokens
3. Add optimistic concurrency/version controls
4. Add audit logs for data mutations
