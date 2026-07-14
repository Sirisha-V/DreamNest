# API Reference

Base path:
- /api/v1

Function entry:
- [netlify/functions/api.mjs](../netlify/functions/api.mjs)

## Auth

### POST /api/v1/auth/register

Request body:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "secret"
}
```

Response:

```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```

### POST /api/v1/auth/login

Request body:

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

Response:

```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```

### POST /api/v1/auth/reset-password

Request body:

```json
{
  "email": "user@example.com",
  "password": "new-secret"
}
```

Response:

```json
{
  "message": "Password reset successful"
}
```

## Goals

### GET /api/v1/goals
- Auth required
- Returns array of goals with computed progress and remaining_amount

### POST /api/v1/goals
- Auth required
- Creates goal

Typical body:

```json
{
  "title": "Wedding",
  "target_amount": 1200000,
  "saved_amount": 720000,
  "monthly_contribution": 96000,
  "months_saved": 4,
  "deadline": "2026-11-30",
  "priority": "High"
}
```

### PUT /api/v1/goals/:id
- Auth required
- Partial update

### DELETE /api/v1/goals/:id
- Auth required
- Removes goal

## Transactions

### GET /api/v1/transactions
- Auth required
- Returns user transaction list

### POST /api/v1/transactions
- Auth required
- Creates transaction

Typical body:

```json
{
  "goal_id": 1,
  "kind": "savings",
  "category": "Wedding",
  "amount": 5000,
  "note": "Added savings",
  "occurred_on": "2026-07-14"
}
```

### PUT /api/v1/transactions/:id
- Auth required
- Partial update

### DELETE /api/v1/transactions/:id
- Auth required
- Removes transaction

### GET /api/v1/transactions/summary
- Auth required
- Returns totals + breakdown + recent transactions

## Dashboard

### GET /api/v1/dashboard
- Auth required
- Returns aggregate dashboard metrics:
  - dream_score
  - total_saved
  - total_target
  - overall_progress
  - active_dreams
  - completed_dreams
  - monthly_saving

## Health

### GET /health
- Returns simple health payload

## Error Behavior

Common response statuses:
- 400 for validation/body problems
- 401 for missing/invalid auth
- 404 for unknown resources
- 409 for account already exists on register
