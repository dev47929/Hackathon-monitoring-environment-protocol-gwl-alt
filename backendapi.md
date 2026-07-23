# Backend API Specification

**Base URL:** `http://localhost:3000`

---

## Health Check

### GET /health

Public endpoint.

**Response 200:**
```json
{
  "status": "ok",
  "service": "hackproof-ai-backend",
  "version": "1.0.0",
  "timestamp": "<ISO-8601>",
  "services": {
    "groq": true,
    "gemini": true,
    "github": true,
    "blockchain": true,
    "blockchainMode": "dummy"
  }
}
```

---

## Authentication

### POST /api/auth/register

Public.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepass123",
  "role": "team"
}
```

`role` enum: `team` | `organizer` | `judge`

Optional: `teamId` — links a team user to their team record.

**Response 201:**
```json
{
  "status": "success",
  "message": "User registered as team.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "team",
      "teamId": "team-uuid",
      "createdAt": "2026-07-21T12:00:00.000Z"
    },
    "token": "<JWT>"
  }
}
```

**Errors:** 400 (invalid payload), 409 (email already registered)

---

### POST /api/auth/login

Public.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "team",
      "teamId": "team-uuid",
      "createdAt": "2026-07-21T12:00:00.000Z"
    },
    "token": "<JWT>"
  }
}
```

If the user has no team (judge/organizer), `teamId` is omitted.

**Error:** 400 (invalid email or password)

---

## Teams

### GET /api/teams

Auth: optional.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Team Alpha",
    "repoUrl": "https://github.com/org/repo",
    "avatar": "",
    "techStack": ["React", "Node.js"],
    "members": ["Alice", "Bob"],
    "progress": 75,
    "overallRiskScore": 20,
    "description": "A description",
    "readmeContent": "Project overview text for AI context",
    "commits": [],
    "claimedFeatures": [],
    "interviewQuestions": []
  }
]
```

---

### GET /api/teams/:id

Auth: optional.

**Response 200:** Single `Team` object (same shape as above).

**Error:** 404 `{"status": "error", "message": "Team not found."}`

---

### POST /api/teams

Auth: required. Role: `team` | `organizer`

**Request:**
```json
{
  "name": "Team Alpha",
  "repoUrl": "https://github.com/org/repo",
  "avatar": "",
  "techStack": ["React", "Node.js"],
  "members": ["Alice", "Bob"],
  "description": "We build great things",
  "readmeContent": "Optional project README for AI context",
  "email": "team@example.com",
  "password": "securepass123"
}
```

`email` and `password` are optional. If provided, a User account with `role: "team"` is created and linked to the new team.

**Response 201:**
```json
{
  "status": "success",
  "message": "Team registered and repository sync completed.",
  "data": {
    "id": "uuid",
    "name": "Team Alpha",
    "progress": 0,
    "commitsCount": 0,
    "email": "team@example.com"
  }
}
```

`email` is only present in the response if a user account was created.

**Errors:** 400 (invalid payload, duplicate repoUrl, unparseable GitHub URL), 409 (email already registered if email provided)

---

### PATCH /api/teams/:id

Auth: required. Role: `organizer` only.

**Request** (all fields optional):
```json
{
  "name": "Team Alpha Updated",
  "avatar": "avatar-key",
  "techStack": ["React", "Node.js", "Python"],
  "members": ["Alice", "Bob", "Charlie"],
  "progress": 80,
  "description": "Updated description",
  "readmeContent": "Updated project overview",
  "claimedFeatures": [
    {
      "id": "feat-1",
      "claim": "Implemented OAuth2 login",
      "expectedEvidence": "Link to PR",
      "actualCodeReference": "src/auth/oauth.ts",
      "status": "verified"
    }
  ]
}
```

`status` enum: `verified` | `unverified` | `partially`

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "...": "..."
  }
}
```

**Errors:** 400 (invalid payload), 404 (team not found)

---

### POST /api/teams/:id/send-report

Auth: required. Role: `judge` | `organizer`

**Request:**
```json
{
  "email": "judge@example.com",
  "reportText": "Team Alpha has shown great progress in..."
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "Report sent successfully.",
  "forwarded": true
}
```

**Error:** 404 (team not found)

---

## Webhooks

### POST /api/webhooks/github

Auth: optional (webhook signature verification if configured).

Accepts two formats:

**Format A — GitHub native push event:**
```json
{
  "head_commit": {
    "id": "abc123def",
    "author": { "name": "Alice" },
    "message": "Fix login bug",
    "added": [],
    "modified": ["src/auth.ts"],
    "removed": []
  },
  "repository": {
    "html_url": "https://github.com/org/repo",
    "clone_url": "https://github.com/org/repo.git"
  },
  "commits": [],
  "stats": { "additions": 10, "deletions": 2 }
}
```

**Format B — Simplified custom payload:**
```json
{
  "repoUrl": "https://github.com/org/repo",
  "teamId": "team-uuid",
  "commit": {
    "hash": "abc123def",
    "author": "Alice",
    "message": "Fix login bug",
    "changedFiles": ["src/auth.ts"],
    "additions": 10,
    "deletions": 2,
    "timestamp": "2026-07-21T12:00:00.000Z",
    "patch": "optional diff string"
  }
}
```

**Response 200:**
```json
{
  "status": "processed",
  "commitHash": "abc123def",
  "aiSummary": "Fixed authentication logic to handle edge cases",
  "category": "backend",
  "riskScore": 15,
  "blockchainTx": "0x...",
  "blockchainStatus": "verified",
  "blockNumber": 42,
  "eventHash": "0x...",
  "isSuspicious": false,
  "suspiciousReason": null,
  "teamName": "Team Alpha",
  "overallRiskScore": 18
}
```

`category` enum: `frontend` | `backend` | `blockchain` | `database` | `ai` | `docs` | `other`

**Errors:** 401 (invalid signature), 400 (no team for repoUrl / unsupported payload), 409 (duplicate commit)

---

## Commits

### POST /api/:hash/justification

Auth: required. Role: `team`

**Request:**
```json
{
  "justification": "This commit was necessary to patch a security vulnerability in the authentication flow."
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "Justification recorded successfully. Queue updated for judge review."
}
```

**Errors:** 400 (invalid payload, already accepted), 404 (commit not found)

---

### PATCH /api/:hash/review

Auth: required. Role: `judge`

**Request:**
```json
{
  "status": "accepted"
}
```

`status` enum: `accepted` | `rejected`

**Response 200:**
```json
{
  "status": "success",
  "hash": "abc123def",
  "newOverallRiskScore": 10
}
```

**Errors:** 400 (invalid payload, no justification to review), 404 (commit not found)

---

### POST /api/:hash/analyze

Auth: optional.

Trigger an AI-powered authenticity analysis of a commit. Results are cached server-side; repeat calls return the cached result.

**Response 200 (uncached):**
```json
{
  "analysis": "This commit aligns well with the project's stated goals of building a React-based dashboard. The changes are focused on the frontend layer...",
  "cached": false,
  "model": "llama-3.1-8b-instant"
}
```

**Response 200 (cached):**
```json
{
  "analysis": "This commit aligns well with the project's stated goals of building a React-based dashboard...",
  "cached": true,
  "model": "llama-3.1-8b-instant"
}
```

**Errors:** 404 (commit not found), 500 (AI analysis failed)

---

## Demo / Presentation

### POST /api/teams/:id/verify-presentation

Auth: required. Role: `judge` | `organizer`

**Request:**
```json
{
  "transcript": "Today we present our project. We built authentication using OAuth2..."
}
```

**Response 200:**
```json
{
  "status": "success",
  "results": [
    {
      "claim": "Implemented OAuth2 login",
      "status": "verified",
      "evidence": "Authentication flow matches code in src/auth/oauth.ts",
      "confidence": 0.95
    }
  ]
}
```

`status` enum: `verified` | `unverified` | `partially`

**Errors:** 400 (invalid payload), 404 (team not found)

---

## Analytics

### GET /api/stats

Public.

**Response 200:**
```json
{
  "totalTeams": 10,
  "totalCommits": 245,
  "averageCommits": 24.5,
  "activeAlerts": 3
}
```

---

### GET /api/activity-logs

Public.

**Response 200:**
```json
[
  {
    "id": "log-uuid",
    "timestamp": "2026-07-21T12:00:00.000Z",
    "type": "info",
    "message": "Team Alpha pushed 5 commits",
    "teamName": "Team Alpha",
    "refId": "commit-hash"
  }
]
```

`type` enum: `info` | `warning` | `success` | `danger`

---

## Blockchain

### GET /api/blockchain/blocks

Public.

**Query params:** `limit` (default 20, max 100), `offset` (default 0)

**Response 200:**
```json
{
  "blocks": [
    {
      "number": 1,
      "hash": "0xabc...",
      "parentHash": "0x000...",
      "timestamp": "2026-07-21T12:00:00.000Z",
      "minerAddress": "0xminer...",
      "gasUsed": "21000",
      "txCount": 3,
      "transactions": [
        {
          "hash": "0xtxhash...",
          "fromAddress": "0xfrom...",
          "toAddress": "0xto...",
          "status": "success",
          "eventHash": "0xevent...",
          "commitHash": "abc123"
        }
      ]
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

---

### GET /api/blockchain/tx/:hash

Public.

**Response 200:**
```json
{
  "hash": "0xtxhash...",
  "blockNumber": 1,
  "blockHash": "0xblockhash...",
  "fromAddress": "0xfrom...",
  "toAddress": "0xto...",
  "nonce": 0,
  "input": {},
  "status": "success",
  "gasUsed": "21000",
  "cumulativeGasUsed": "21000",
  "logIndex": 0,
  "eventHash": "0xevent...",
  "commitHash": "abc123",
  "createdAt": "2026-07-21T12:00:00.000Z"
}
```

**Error:** 404 `Transaction <hash> not found.`

---

### GET /api/blockchain/tx/by-commit/:commitHash

Public.

**Response 200:** Same shape as `GET /api/blockchain/tx/:hash`

**Error:** 404 `No transaction found for commit <commitHash>.`

---

### GET /api/blockchain/mode

Public.

**Response 200:**
```json
{
  "mode": "dummy",
  "configured": true
}
```

`mode` enum: `dummy` | `real` | `off`
