# HackProof AI — Backend API Reference

**Stack:** Express (TypeScript) + Prisma (PostgreSQL) + Zod validation  
**Base URL:** `http://localhost:3000` (dev) / configured via `VITE_API_BASE_URL` (production)

---

## Table of Contents

- [Auth](#1-auth)
- [Health](#2-health)
- [Teams](#3-teams)
- [Commits & Webhooks](#4-commits--webhooks)
- [Justification & Review](#5-justification--review)
- [Presentation Verification](#6-presentation-verification)
- [Analytics](#7-analytics)
- [Blockchain](#8-blockchain)
- [Types](#9-types)

---

## 1. Auth

### `POST /api/auth/register`

Register a new user as organizer or judge. Password is hashed with scrypt.

**Request body**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword",
  "role": "organizer"
}
```

**Validation**
| Field | Rules |
|---|---|
| `email` | Valid email, required |
| `name` | 1–120 chars, required |
| `password` | 8–128 chars, required |
| `role` | Must be `"organizer"` or `"judge"`, required |

**Response `201`**
```json
{
  "status": "success",
  "message": "User registered as organizer.",
  "data": {
    "id": "user-a1b2c3d4",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "organizer",
    "createdAt": "2026-07-18T10:00:00.000Z"
  }
}
```

**Response `409`** — `{ "status": "error", "message": "A user with this email is already registered." }`

### `POST /api/auth/login`

Login with email and password.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response `200`**
```json
{
  "status": "success",
  "data": {
    "id": "user-a1b2c3d4",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "organizer"
  }
}
```

**Response `400`** — `{ "status": "error", "message": "Invalid email or password." }`

---

## 2. Health

### `GET /health`

**Response `200`**
```json
{
  "status": "ok",
  "service": "hackproof-ai-backend",
  "version": "1.0.0",
  "timestamp": "2026-07-18T10:00:00.000Z",
  "services": {
    "gemini": true,
    "github": true,
    "blockchain": true,
    "blockchainMode": "dummy"
  }
}
```

---

## 3. Teams

### `GET /api/teams`

List all registered teams.

**Response `200`** — Array of [Team](#team)

### `GET /api/teams/:id`

Get a single team by ID.

**Response `200`** — [Team](#team)  
**Response `404`** — `{ "status": "error", "message": "Team not found." }`

### `POST /api/teams`

Register a new team and auto-sync their GitHub repository.

**Request body**
```json
{
  "name": "My Team",
  "repoUrl": "https://github.com/owner/repo",
  "avatar": "🚀",
  "techStack": ["React", "Node.js"],
  "members": ["Alice", "Bob"],
  "description": "Our awesome project"
}
```

**Validation**
| Field | Rules |
|---|---|
| `name` | 1–120 chars, required |
| `repoUrl` | Valid URL containing `github.com`, required |
| `avatar` | Max 20 chars, optional |
| `techStack` | 1–20 items, required |
| `members` | 1–20 items, required |
| `description` | Max 2000 chars, optional |

**Response `201`**
```json
{
  "status": "success",
  "message": "Team registered and repository sync completed.",
  "data": {
    "id": "team-a1b2c3d4",
    "name": "My Team",
    "progress": 10,
    "commitsCount": 5
  }
}
```

**Response `400`** — Duplicate `repoUrl` or validation error.

### `PATCH /api/teams/:id`

Update team fields.

**Request body** (all fields optional)
```json
{
  "name": "New Name",
  "avatar": "🦄",
  "techStack": ["React", "Python"],
  "members": ["Alice", "Bob", "Eve"],
  "progress": 75,
  "description": "Updated description",
  "claimedFeatures": [
    {
      "id": "claim-1",
      "claim": "Real-time WebSockets",
      "expectedEvidence": "socket.io usage",
      "actualCodeReference": "src/gateway/sockets.ts:L45",
      "status": "verified"
    }
  ]
}
```

**Response `200`**
```json
{
  "status": "success",
  "data": {
    "id": "team-a1b2c3d4",
    "name": "New Name",
    ...
  }
}
```

---

## 4. Commits & Webhooks

### `POST /api/webhooks/github`

Submit a commit for AI auditing and blockchain anchoring. Accepts both native GitHub push events and normalized payloads.

**Normalized payload**
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "teamId": "team-a1b2c3d4",
  "commit": {
    "hash": "fc291aa",
    "author": "Alice",
    "message": "Feat: Add Redis cache tier",
    "changedFiles": ["src/server/cache.ts"],
    "additions": 142,
    "deletions": 12,
    "timestamp": "2026-07-18T10:00:00.000Z",
    "patch": "@@ -10,6 +10,17 @@ ..."
  }
}
```

**Response `200`**
```json
{
  "status": "processed",
  "commitHash": "fc291aa",
  "aiSummary": "Integrated Redis client caching structures.",
  "category": "backend",
  "riskScore": 12,
  "blockchainTx": "0x5a18b9...f2c0021",
  "blockchainStatus": "verified",
  "blockNumber": 1,
  "eventHash": "0x1234...abcd",
  "isSuspicious": false,
  "teamName": "My Team",
  "overallRiskScore": 8
}
```

The `suspiciousReason` field is only present when the commit is flagged (non-null value).

---

## 5. Justification & Review

### `POST /api/:hash/justification`

Submit a hacker justification for a flagged (suspicious) commit.

**Request body**
```json
{
  "justification": "This large push was due to importing a boilerplate layout helper we built in our pre-hackathon sandbox."
}
```

**Validation**: `justification` must be 5–5000 chars.

**Response `200`**
```json
{
  "status": "success",
  "message": "Justification recorded successfully. Queue updated for judge review."
}
```

### `PATCH /api/:hash/review`

Judge accepts or rejects a justification.

**Request body**
```json
{
  "status": "accepted"
}
```

**Validation**: `status` must be `"accepted"` or `"rejected"`.

**Response `200`**
```json
{
  "status": "success",
  "hash": "fc291aa",
  "newOverallRiskScore": 5
}
```

---

## 6. Presentation Verification

### `POST /api/teams/:id/verify-presentation`

Verify a team's live presentation claims against their commit history.

**Request body**
```json
{
  "transcript": "In our live demo, we built a WebSocket service monitoring block confirmations with sub-100ms latency..."
}
```

**Validation**: `transcript` must be 10–20000 chars.

**Response `200`**
```json
{
  "status": "success",
  "results": [
    {
      "claim": "Real-time WebSockets Implementation",
      "status": "verified",
      "evidence": "Matches file 'src/gateway/sockets.ts' containing active socket connections.",
      "confidence": 0.98
    }
  ]
}
```

---

## 7. Analytics

### `GET /api/stats`

Aggregate hackathon statistics.

**Response `200`**
```json
{
  "totalTeams": 5,
  "totalCommits": 142,
  "averageCommits": 28.4,
  "activeAlerts": 3
}
```

### `GET /api/activity-logs`

All activity logs (descending by timestamp).

**Response `200`**
```json
[
  {
    "id": "log-a1b2c3d4",
    "timestamp": "2026-07-18T10:00:00.000Z",
    "type": "warning",
    "message": "Suspicious velocity push flagged for Team NeuralNexus.",
    "teamName": "NeuralNexus",
    "refId": "a7b82f1"
  }
]
```

---

## 8. Blockchain

### `GET /api/blockchain/blocks`

List simulated blockchain blocks with transactions.

**Query params**

| Param | Type | Default | Max |
|---|---|---|---|
| `limit` | integer | 20 | 100 |
| `offset` | integer | 0 | — |

**Response `200`**
```json
{
  "blocks": [
    {
      "number": 1,
      "hash": "0xabc...",
      "parentHash": "0x000...0",
      "timestamp": "2026-07-18T10:00:00.000Z",
      "minerAddress": "0x7099...79C8",
      "gasUsed": "21000",
      "txCount": 1,
      "transactions": [
        {
          "hash": "0xdef...",
          "fromAddress": "0x7099...79C8",
          "toAddress": "0x74f2...f02c",
          "status": "verified",
          "eventHash": "0x123...",
          "commitHash": "abc123"
        }
      ]
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

### `GET /api/blockchain/tx/:hash`

Get a single transaction by its blockchain tx hash.

**Response `200`**
```json
{
  "hash": "0xdef...",
  "blockNumber": 1,
  "blockHash": "0xabc...",
  "fromAddress": "0x7099...79C8",
  "toAddress": "0x74f2...f02c",
  "nonce": 0,
  "input": { "contract": "...", "function": "anchorCommit", "args": {...} },
  "status": "verified",
  "gasUsed": "21000",
  "cumulativeGasUsed": "21000",
  "logIndex": 0,
  "eventHash": "0x123...",
  "commitHash": "abc123",
  "createdAt": "2026-07-18T10:00:00.000Z"
}
```

**Response `404`** — `{ "status": "error", "message": "Transaction <hash> not found." }`

### `GET /api/blockchain/tx/by-commit/:commitHash`

Find a transaction by its associated commit hash.

**Response `200`** — Same shape as single tx lookup.  
**Response `404`** — `{ "status": "error", "message": "No transaction found for commit <commitHash>." }`

### `GET /api/blockchain/mode`

Get current blockchain anchoring configuration.

**Response `200`**
```json
{
  "mode": "dummy",
  "configured": true
}
```

---

## 9. Types

### Team

```typescript
interface Team {
  id: string;
  name: string;
  repoUrl: string;
  avatar: string;
  techStack: string[];
  members: string[];
  progress: number;           // 0–100
  commits: Commit[];
  overallRiskScore: number;   // 0–100
  description: string;
  claimedFeatures: ClaimedFeature[];
  interviewQuestions: InterviewQuestion[];
}
```

### Commit

```typescript
interface Commit {
  hash: string;
  timestamp: string;
  author: string;
  message: string;
  changedFiles: string[];
  additions: number;
  deletions: number;
  aiSummary: string;
  featureEvolution: string;
  category: 'frontend' | 'backend' | 'blockchain' | 'database' | 'ai' | 'docs' | 'other';
  blockchainTx: string;
  blockchainStatus: 'verified' | 'failed' | 'pending';
  blockNumber?: number;
  eventHash?: string;
  isSuspicious?: boolean;
  suspiciousReason?: string;
  riskScore: number;          // 0–100
  justification?: string;
  justificationStatus: 'none' | 'pending' | 'accepted' | 'rejected';
  teamId?: string;
}
```

### ClaimedFeature

```typescript
interface ClaimedFeature {
  id: string;
  claim: string;
  expectedEvidence: string;
  actualCodeReference: string;
  status: 'verified' | 'unverified' | 'partially';
}
```

### InterviewQuestion

```typescript
interface InterviewQuestion {
  id: string;
  question: string;
  context: string;
  suggestedAnswer: string;
}
```

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'organizer' | 'judge';
  createdAt: string;
}
```

### HackathonStats

```typescript
interface HackathonStats {
  totalTeams: number;
  totalCommits: number;
  averageCommits: number;
  activeAlerts: number;       // Suspicious commits not yet accepted
}
```

### ActivityLog

```typescript
interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  message: string;
  teamName: string;
  refId?: string;
}
```

---

## Frontend API Client

The frontend service layer lives in `hackproof-ai/src/services/api.ts` and exports the following clients:

| Client | Endpoints |
|---|---|
| `TeamsAPI` | `getAll()`, `register()`, `update()` |
| `CommitsAPI` | `simulateWebhook()`, `submitJustification()`, `reviewJustification()` |
| `DemoAuditAPI` | `auditPresentation()` |
| `AnalyticsAPI` | `getStats()`, `getActivityLogs()` |
| `BlockchainAPI` | `getBlocks()`, `getTransaction()`, `getTransactionByCommit()`, `getMode()` |

The base URL is configured via the `VITE_API_BASE_URL` environment variable (empty by default, relying on the Vite dev proxy). See `hackproof-ai/.env.example`.
