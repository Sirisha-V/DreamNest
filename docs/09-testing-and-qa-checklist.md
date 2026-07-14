# Testing and QA Checklist

## Smoke Test (Production)

1. Open app URL and login
2. Verify routes load:
   - Dashboard
   - Monthly Savings
   - Dreams
   - Transactions
   - Analytics
   - Couple Corner
   - Profile
   - Settings
3. Create a dream and confirm card appears
4. Add expense and verify totals update
5. Add savings and verify dream progress updates
6. Edit transaction and verify saved values
7. Delete transaction and verify removal
8. Reload page and confirm data still present

## Cross-Device Sync Test

1. Login on Device A
2. Create dream + add transaction
3. Login on Device B using same account
4. Confirm same dream/transaction visible
5. Update from Device B
6. Refresh Device A and confirm update visible

## Estimation/Timeline Validation

1. Open dream timeline
2. Check progress percentage consistency
3. Check remaining months against target/saved/contribution inputs
4. Validate deadline display vs estimated completion logic

## UI/Responsive Validation

1. Test mobile viewport
2. Open/close modals and verify no clipping
3. Validate bottom navigation behavior
4. Verify theme colors and contrast readability

## Auth Validation

1. Register new user
2. Login with correct credentials
3. Reset password and login again
4. Verify unauthorized route redirects to login when token missing

## API Health Validation

1. Call /health
2. Check /api/v1/dashboard with valid token
3. Check /api/v1/goals read/write operations
4. Check /api/v1/transactions read/write operations

## Regression Notes

Focus areas with historical issues:
- Add expense modal submission behavior
- Transaction delete reconciliation
- Login resilience after serverless runtime events
- Dream timeline month estimation consistency
