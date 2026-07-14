# Features

## 1. Authentication

- Register with name, email, and password
- Login with email and password
- Reset password flow
- Protected routes after authentication

Main files:
- [frontend/src/pages/LoginPage.tsx](../frontend/src/pages/LoginPage.tsx)
- [frontend/src/pages/RegisterPage.tsx](../frontend/src/pages/RegisterPage.tsx)
- [frontend/src/pages/ForgotPasswordPage.tsx](../frontend/src/pages/ForgotPasswordPage.tsx)
- [frontend/src/routes/ProtectedRoute.tsx](../frontend/src/routes/ProtectedRoute.tsx)

## 2. Dreams Management

- Create dreams with:
  - Title
  - Target amount
  - Saved amount
  - Monthly contribution
  - Months saved
  - Deadline
  - Priority
  - Optional couple fields
- Edit dream values
- Delete dreams
- View progress and remaining amount

Main files:
- [frontend/src/pages/DreamsPage.tsx](../frontend/src/pages/DreamsPage.tsx)
- [frontend/src/components/DreamTimeline.tsx](../frontend/src/components/DreamTimeline.tsx)
- [frontend/src/components/DreamSimulator.tsx](../frontend/src/components/DreamSimulator.tsx)

## 3. Money Tracking

- Add income entries
- Add expense entries
- Add savings entries linked to a dream
- Transfer to general savings
- Edit and delete transactions
- Real-time summary calculations

Main files:
- [frontend/src/pages/MonthlySavingsPage.tsx](../frontend/src/pages/MonthlySavingsPage.tsx)
- [frontend/src/pages/TransactionsPage.tsx](../frontend/src/pages/TransactionsPage.tsx)
- [frontend/src/context/DreamContext.tsx](../frontend/src/context/DreamContext.tsx)

## 4. Dashboard and Analytics

- Dream score and summary cards
- Active vs completed dream indicators
- Savings/income/expense signals
- Recent transaction and category breakdown patterns

Main files:
- [frontend/src/pages/DashboardPage.tsx](../frontend/src/pages/DashboardPage.tsx)
- [frontend/src/pages/AnalyticsPage.tsx](../frontend/src/pages/AnalyticsPage.tsx)

## 5. Timeline and Estimation

- Per-dream timeline panel
- Remaining months estimate from current data
- Milestone completion indicators

Main files:
- [frontend/src/components/DreamTimeline.tsx](../frontend/src/components/DreamTimeline.tsx)
- [frontend/src/pages/TimelinePage.tsx](../frontend/src/pages/TimelinePage.tsx)

## 6. Couple Features

- Couple-specific route and dream context
- Shared-goal onboarding fields

Main file:
- [frontend/src/pages/CoupleCornerPage.tsx](../frontend/src/pages/CoupleCornerPage.tsx)

## 7. Onboarding + Motivation Layer

- First-time onboarding flow
- Daily check-in rewards
- Mission and streak progression
- Dream coin events

Main files:
- [frontend/src/components/OnboardingExperience.tsx](../frontend/src/components/OnboardingExperience.tsx)
- [frontend/src/lib/onboarding.ts](../frontend/src/lib/onboarding.ts)
- [frontend/src/context/DreamContext.tsx](../frontend/src/context/DreamContext.tsx)

## 8. Mobile-Responsive UX

- Mobile bottom navigation
- Modal and panel behavior tuned for small screens
- Sticky quick actions with modal state safeguards

Main files:
- [frontend/src/components/Layout.tsx](../frontend/src/components/Layout.tsx)
- [frontend/src/index.css](../frontend/src/index.css)
