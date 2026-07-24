# HackProof AI — Root Issues &amp; Unwired Features

## 1. Authentication — ENTIRELY DISCONNECTED (biggest issue)

| What | Status | Detail |
|------|--------|--------|
| Frontend never calls backend auth | ❌ Broken | `AuthGate.tsx` simulates login/signup with `setTimeout()` + `localStorage`. Makes **zero** API calls to `/api/auth/login` or `/api/auth/register`. |
| No auth API client exists | ❌ Missing | `hackproof-ai/src/services/api.ts` has **no** `AuthAPI` export. No `login()` or `register()` functions defined anywhere. |
| Backend login returns no token | ❌ Broken | `authRouter.ts:70-78` returns plain user data with NO JWT. The auth middleware (`middleware/auth.ts:22`) checks for a hardcoded magic string — there's no real token flow. |
| Role registration mismatch | ❌ Broken | Backend's `registerSchema` only allows `'organizer' \| 'judge'` roles (line 14), but frontend allows signing up as `'team'`. Backend won't accept team registrations. |
| Frontend stores users in localStorage | 🟡 Not secure | Authentication state is persisted in plaintext `localStorage` — no real session management. |

---

## 2. API / Data Fallback Pattern

Every frontend API call has a **try/catch fallback** — the app works entirely on mock data when the backend is down.

| Endpoint | Frontend Call | Connected? | Fallback |
|----------|--------------|------------|----------|
| `GET /api/teams` | `TeamsAPI.getAll()` | ✅ Tries backend first | Falls back to `INITIAL_TEAMS` from `mockData.ts` |
| `POST /api/teams` | `TeamsAPI.register()` | ✅ Tries backend first | Falls back to local state update |
| `PATCH /api/teams/:id` | `TeamsAPI.update()` | ✅ Tries backend first | Falls back |
| `POST /api/webhooks/github` | `CommitsAPI.simulateWebhook()` | ✅ Tries backend first | Generates mock commit locally on failure |
| `POST /api/:hash/justification` | `CommitsAPI.submitJustification()` | ✅ Tries backend first | (fallback handled per component) |
| `PATCH /api/:hash/review` | `CommitsAPI.reviewJustification()` | ✅ Tries backend first | (fallback handled per component) |
| `POST /api/teams/:id/verify-presentation` | `DemoAuditAPI.auditPresentation()` | ✅ Tries backend first | (fallback handled per component) |
| `GET /api/stats` | `AnalyticsAPI.getStats()` | ✅ Tries backend first | Falls back to `MOCK_STATS` from `mockData.ts` |
| `GET /api/activity-logs` | `AnalyticsAPI.getActivityLogs()` | ✅ Tries backend first | Falls back to `INITIAL_ACTIVITY_LOGS` from `mockData.ts` |
| `GET /api/blockchain/*` | `BlockchainAPI.getBlocks()` etc. | ✅ Connected | But **never actually called** from any component |

---

## 3. Environment / Configuration (won't work in production)

| Issue | Detail |
|-------|--------|
| **No `.env` files** | Both `hackproof-ai/.env.example` and `backend/.env.example` exist, but no actual `.env` files are present anywhere. |
| **Gemini API key is placeholder** | `GEMINI_API_KEY=your_gemini_api_key_here` — AI analysis falls back to heuristic rules. |
| **GitHub credentials are placeholders** | `GITHUB_PERSONAL_ACCESS_TOKEN`, `GITHUB_WEBHOOK_SECRET`, `GITHUB_APP_ID` are all `your_*_here`. Webhook verification and GitHub API calls won't work. |
| **Database URL is placeholder** | `DATABASE_URL=postgresql://postgres:password@localhost:5432/hackproof_db` — won't connect without real credentials. |
| **Blockchain "real" mode not implemented** | `blockchainService.ts` only supports `'dummy'` and `'off'`. Real RPC mode is referenced but never built. |

---

## 4. Other Issues

| Issue | Detail |
|-------|--------|
| **No React Router** | Navigation is 100% state-driven (`currentRole` variable in `App.tsx`). No URL paths, no browser history, no deep-linking. |
| **No auth middleware applied to backend routes** | All routes use `optionalAuth` (backend `app.ts:61-65`), meaning every API endpoint works without authentication. No route is actually protected. |
| **Blockchain API endpoints never consumed** | `BlockchainAPI.getBlocks()`, `getTransaction()`, `getTransactionByCommit()`, `getMode()` are all defined in the frontend API layer but **no component calls them**. |
| **Static mock seed data** | All 5 teams, 23 commits, claimed features, interview questions, activity logs — everything comes from hardcoded data in `mockData.ts`. The backend's `seed.ts` has overlapping but disconnected seed data. |
