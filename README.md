# HackProof AI

> **Real-time hackathon integrity monitoring — AI-powered commit auditing, blockchain-anchored evidence, and role-based dashboards for organizers, judges, and hackers.**

HackProof AI is a next-generation developer-integrity and automated hackathon auditing platform. It continuously monitors hackathons by validating source code commits in real-time, archiving check-ins on an immutable blockchain ledger, and using Google Gemini AI to analyze developer progress, flag anomalies, and create custom demonstration checks.

---

## Architecture

```
Developer Push / GitHub Webhook
        │
        ▼
┌───────────────────┐     ┌──────────────────────┐
│  Express Gateway  │────▶│  Signature Verify     │
│  (Port 3000)      │     │  + Payload Normalize  │
└───────────────────┘     └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  GitHub REST API      │
                          │  (Fetch diff / meta)  │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  Gemini AI Engine     │
                          │  (Analysis + Risk)    │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  Blockchain Service   │
                          │  (Anchor hash on-ledger)│
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  PostgreSQL + Prisma  │
                          │  (Relational Cache)   │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  React Dashboard      │
                          │  (Team / Judge / Org) │
                          └───────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express, TypeScript |
| **Frontend** | React 19, Vite, Tailwind CSS v4, shadcn/ui |
| **AI Engine** | Google Gemini 2.5 Flash & 2.5 Pro (`@google/genai`) |
| **Database** | PostgreSQL + Prisma ORM |
| **Blockchain** | DB-simulated dummy chain (full block/tx semantics) |
| **Auth** | JWT tokens, scrypt password hashing, role-based access |
| **Validation** | Zod schemas |
| **Security** | Helmet, CORS, rate limiting, webhook HMAC-SHA256 verification |

---

## Features

### For Hacker Teams

- **Simulate Git Push** — Interactive command bar for custom commit messages, categories, and line changes
- **Real-time Timeline** — Chronological feed of all commits with AI summaries, language badges, and blockchain signatures
- **Anomaly Alerts** — Automatic flagging of suspicious activity (template pasting, force pushes)
- **Justification Submission** — Directly explain flagged commits to judges

### For Judges

- **Team Selector** — Quick navigation between teams with progress meters and alert badges
- **Live Claims Match** — Verify presentation transcripts against actual repo file footprints
- **AI Interviewer** — Tailored technical questions based on specific code changes with suggested answer keys
- **Justification Reviews** — Approve or reject flagged commit explanations
- **Evaluation Reports** — One-click Markdown scorecard export with blockchain signatures and risk analysis

### For Organizers

- **Global KPI Dashboard** — Active teams, commit volume, commit rates, and unresolved alerts
- **Tech Popularity Charts** — Programming stack distribution across teams
- **Registration Suite** — Onboard new teams with repo URL, tech stack, and custom avatars
- **Activity Log** — Live console of all hackathon events

### Platform-Wide

- **Blockchain Explorer** — Browse blocks, transactions, and verify commit anchoring
- **Role-Based Access Gates** — Secure separation between Hacker, Judge, and Organizer dashboards

---

## Project Structure

```
├── backend/                    # Express + TypeScript API server
│   ├── src/
│   │   ├── config/            # Environment config loader
│   │   ├── data/              # Prisma client, repository layer, seed data
│   │   ├── middleware/        # Auth, raw body capture, webhook normalization
│   │   ├── routes/            # Auth, teams, commits, analytics, blockchain, demo
│   │   ├── services/          # GitHub API, Gemini AI, audit pipeline, blockchain
│   │   │   └── blockchain/    # Dummy chain implementation + interface
│   │   ├── types/             # Domain type definitions
│   │   └── utils/             # Error handling utilities
│   ├── prisma/                # Prisma schema
│   └── package.json
│
├── hackproof-ai/              # React + Vite frontend
│   ├── src/
│   │   ├── components/        # LandingPage, TeamDashboard, JudgeDashboard,
│   │   │                      # OrganizerDashboard, AuthGate, BlockchainExplorer,
│   │   │                      # ArchitectureFlow, FallbackBanner
│   │   ├── context/           # AuthContext (JWT management)
│   │   ├── data/              # Mock data fallbacks
│   │   ├── services/          # API client (TeamsAPI, CommitsAPI, etc.)
│   │   └── App.tsx            # Main app shell + routing
│   └── package.json
│
├── shared/
│   └── seed-data.json         # Demo data (5 teams, 23 commits)
│
├── BACKEND_API_SPEC.md        # Full API reference
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL (or Docker for local)
- Google Gemini API key

### 1. Clone and Install

```bash
# Backend
cd backend
cp .env.example .env        # Fill in your credentials
npm install
npx prisma db push          # Create database tables
npm run dev                 # Starts on port 3000

# Frontend (separate terminal)
cd hackproof-ai
npm install
npm run dev                 # Starts on port 3000
```

### 2. Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for signing auth tokens |
| `DATABASE_URL` | PostgreSQL connection string |
| `GITHUB_WEBHOOK_SECRET` | Secret for verifying webhook signatures |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Token for GitHub REST API calls |
| `GEMINI_API_KEY` | Google Gemini AI API key |
| `BLOCKCHAIN_MODE` | `dummy`, `real`, or `off` |

Full reference in `backend/.env.example`.

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register as organizer or judge |
| `POST` | `/api/auth/login` | Login with email + password |
| `GET` | `/api/teams` | List all registered teams |
| `POST` | `/api/teams` | Register a new team (auto-syncs from GitHub) |
| `PATCH` | `/api/teams/:id` | Update team details |
| `POST` | `/api/webhooks/github` | Ingest GitHub push events |
| `POST` | `/api/commits/:hash/justification` | Submit justification for flagged commit |
| `PATCH` | `/api/commits/:hash/review` | Judge approves/rejects justification |
| `POST` | `/api/teams/:id/verify-presentation` | Verify presentation transcript against code |
| `GET` | `/api/stats` | Global hackathon telemetry |
| `GET` | `/api/activity-logs` | All system activity logs |
| `GET` | `/api/blockchain/blocks` | Paginated block explorer |
| `GET` | `/api/blockchain/mode` | Current blockchain mode |

See `BACKEND_API_SPEC.md` for full request/response schemas.

---

## License

MIT — built for the Global Hackathon League.
