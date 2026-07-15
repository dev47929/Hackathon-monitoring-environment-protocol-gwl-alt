# HackProof AI - Backend API & Integration Specification
> **System Architecture, REST Endpoints, GitHub Integration, Gemini AI Auditor, Blockchain Anchoring, and Type-Safe Frontend Fetch Clients.**

This document provides a comprehensive, production-ready specification for building, securing, and integrating the HackProof AI backend. It serves as an authoritative blueprint for developers implementing the server-side architecture and connecting the front-end interface.

---

## 1. System Architecture Overview

HackProof AI enforces hackathon integrity using a dual-security anchor:
1. **Immutable Audit Ledger (Blockchain)**: Anchors commit hashes, metadata, and verification events on-chain to prevent historical manipulation and revisionism.
2. **AI-Powered Code Auditor (Gemini API)**: Automatically summarizes codebase changes, tracks technical claims (feature evolution), analyzes plagiarism/risk scores, and generates targeted, context-aware interview questions based on actual code footprints.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                     HACKPROOF AI GATEWAY                               │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                  ┌─────────────────────────┴─────────────────────────┐
                  ▼                                                   ▼
       ┌─────────────────────┐                             ┌─────────────────────┐
       │   GitHub Webhooks   │                             │   REST API Routes   │
       └──────────┬──────────┘                             └──────────┬──────────┘
                  │                                                   │
                  ▼                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              EXPRESS SERVER (PORT 3000)                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [Auth Guard] ──► [GitHub Fetcher] ──► [AI Auditor Engine] ──► [Blockchain Linker]      │
└────────┬──────────────────────────────────────┬───────────────────────────────┬────────┘
         │ (Code & Diff Fetching)               │ (Analysis & Q&A Prompts)      │ (Anchor Tx)
         ▼                                      ▼                               ▼
┌───────────────────┐                 ┌───────────────────┐           ┌───────────────────┐
│    GitHub API     │                 │    Gemini API     │           │ L1/L2 Blockchain  │
│ (api.github.com)  │                 │  (@google/genai)  │           │   (EVM / Sol)     │
└───────────────────┘                 └───────────────────┘           └───────────────────┘
```

---

## 2. Server Configuration & Environment Setup

The backend must be initialized with the following environment variables (defined in `.env` and documented in `.env.example`):

```env
# Server Configuration
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_signing_secret_here

# Database Configurations
DATABASE_URL=postgresql://postgres:password@localhost:5432/hackproof_db

# GitHub API Credentials
GITHUB_APP_ID=your_github_app_id_here
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your_webhook_webhook_secret_here
GITHUB_PERSONAL_ACCESS_TOKEN=your_fallback_token_for_manual_ref_fetches

# Gemini AI Platform (Server-Side Only)
GEMINI_API_KEY=your_gemini_api_key_here

# Blockchain Network Configuration
BLOCKCHAIN_RPC_URL=https://rpc.mainnet-712.network
BLOCKCHAIN_PRIVATE_KEY=your_secured_wallet_private_key_for_gas_fees
SMART_CONTRACT_ADDRESS=0x74f2e4129bb882ca1a654921b777a888c3a9f02c
```

---

## 3. GitHub API Integration Specifications

To track real code submissions, velocity, and evolution, the backend integrates with the **GitHub REST API v3**. 

### A. Authentication
1. **GitHub App Installation Token**: For enterprise/multi-tenant platforms, authenticate as a GitHub App. Generate a JWT using `GITHUB_APP_ID` and `GITHUB_PRIVATE_KEY`, then request an access token:
   `POST https://api.github.com/app/installations/{installation_id}/access_tokens`
2. **Personal Access Token (PAT)**: For private, high-speed usage, supply the `Authorization: Bearer <GITHUB_PERSONAL_ACCESS_TOKEN>` header.

### B. Required GitHub Public API Endpoints

#### 1. Fetch Repository Metadata
Retrieve language configuration, default branch, and ownership details.
* **Endpoint**: `GET https://api.github.com/repos/{owner}/{repo}`
* **Headers**:
  ```http
  Accept: application/vnd.github+json
  Authorization: Bearer <TOKEN>
  X-GitHub-Api-Version: 2022-11-28
  ```

#### 2. Fetch Latest Commit Stream
Fetch a historical list of commits with code details.
* **Endpoint**: `GET https://api.github.com/repos/{owner}/{repo}/commits`
* **Query Parameters**:
  * `sha`: Starting branch or commit hash (e.g. `main`)
  * `per_page`: Max commits to return (default: `30`)
* **Usage**: Used to manually synchronize a team's timeline when they register their repository.

#### 3. Fetch Single Commit Diff & Detailed Stats
Retrieve additions, deletions, modified file names, and the actual code diff.
* **Endpoint**: `GET https://api.github.com/repos/{owner}/{repo}/commits/{ref}`
* **Usage**: Retrieve raw diff strings to supply to the Gemini Engine for AI analysis.
* **Payload Highlights**:
  ```json
  {
    "sha": "a7b82f1837d92cc8bc10db2a7cf3019aa1c29bb8",
    "commit": {
      "author": { "name": "dev_alex", "date": "2026-07-05T12:28:00Z" },
      "message": "Fix: Resolved race condition in auth middleware"
    },
    "stats": { "total": 14, "additions": 11, "deletions": 3 },
    "files": [
      {
        "filename": "src/middleware/auth.ts",
        "additions": 11,
        "deletions": 3,
        "changes": 14,
        "patch": "@@ -10,6 +10,17 @@ ... + added lines ... - removed lines"
      }
    ]
  }
  ```

### C. Webhook Handler (`POST /api/webhooks/github`)
HackProof AI listens to GitHub push webhooks to enable real-time immutable ledger audits and security checks.

* **GitHub Event Type**: `push`
* **Security Validation**: Compute the HMAC hex digest of the payload using the `GITHUB_WEBHOOK_SECRET` and verify it matches the `X-Hub-Signature-256` header.
* **Webhook Processing Workflow**:
  1. Parse commit metadata, list of added/modified files, addition/deletion stats.
  2. If the commit is authored during active competition hours:
     a. Trigger **Gemini AI Engine** to summarize the changes, check tech stack flags, and assign a plagiarism/risk score.
     b. Trigger **Blockchain Linker** to write a transaction anchor containing the hash and audit metadata.
     c. Emit a socket notification to the UI stream.

---

## 4. Gemini AI Audit Engine (Server-Side)

The backend uses the modern `@google/genai` TypeScript SDK, keeping the API key fully hidden. All requests use **Gemini 2.5 Flash** or **Gemini 2.5 Pro** for deep contextual code diff parsing.

### A. Initialization
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});
```

### B. Core AI Tasks & System Prompts

#### 1. Commit Analyzer (`aiSummary`, `category`, `featureEvolution`, `riskScore`)
Pass the raw file patch logs (diffs) to evaluate changes, identify anomalies, and summarize architectural contributions.

* **Target Model**: `gemini-2.5-flash`
* **System Prompt**:
  ```text
  You are an expert Hackathon Code Auditor and Senior Security Engineer. 
  Your task is to analyze the provided raw Git diff and output a structured JSON analysis of the changes.

  Perform the following checks:
  1. Categorize the change into one of: 'frontend' | 'backend' | 'blockchain' | 'database' | 'ai' | 'docs' | 'other'.
  2. Write a highly concise summary of what was implemented (aiSummary) max 100 characters.
  3. Track claim updates (featureEvolution) - write a sentence describing what new system logic has evolved from previous versions.
  4. Perform a risk and velocity assessment:
     - Assign a 'riskScore' between 0 and 100.
     - Spikes in code changes (>500 lines added in a single push without clear explanation), suspicious copied structures, or imported mock credential databases should trigger a high riskScore and mark isSuspicious=true.
     - Formulate a 'suspiciousReason' if riskScore is above 60.

  You MUST return ONLY a valid JSON object matching this schema:
  {
    "category": "frontend" | "backend" | "blockchain" | "database" | "ai" | "docs" | "other",
    "aiSummary": "string",
    "featureEvolution": "string",
    "riskScore": number,
    "isSuspicious": boolean,
    "suspiciousReason": "string" | null
  }
  ```

#### 2. Generative Technical Interview Question Generator
As teams check-in commits, compile an ongoing ledger of custom interview questions that judges can ask during live demos. This guarantees questions are grounded directly in the code they actually wrote.

* **Target Model**: `gemini-2.5-flash`
* **System Prompt**:
  ```text
  You are an adversarial Hackathon Judge testing the validity of the technical claims.
  Examine the commits and file changes provided for this team.
  Generate 1 deeply specific, challenging technical interview question designed to test if the team actually authored the code or simply copy-pasted a template.

  Provide:
  - The Question testing their core design choices.
  - The Context (e.g., "In commit #a7b82f, you modified authentication checks by implementing custom async-await loops...").
  - The Suggested Answer (what a legitimate developer should say to pass the audit).

  Output format MUST be JSON:
  {
    "question": "string",
    "context": "string",
    "suggestedAnswer": "string"
  }
  ```

#### 3. Live Demo Presentation & Claim Verifier
When judges observe a live presentation, the backend accepts a raw audio transcript or live notes to compare against actual code signatures.

* **Target Model**: `gemini-2.5-pro` (for deep cross-referencing capabilities)
* **Input Parameters**:
  - `claimedFeatures`: The list of verified / unverified technical goals.
  - `commits`: The actual commit history and file structures.
  - `presentationTranscript`: Real-time speech-to-text dump from the live presentation.
* **System Prompt**:
  ```text
  You are a Master Hackathon Auditing Agent.
  Compare the live presentation transcript against the actual commit history and the declared claimed features of the team.
  Identify:
  1. Claims made during the presentation that lack ANY file/code footprints in the Git history. (Mark as "unverified" or flag as discrepancy).
  2. Claims that are fully backed by file changes. (Mark as "verified").
  3. Partially implemented features.

  Return a JSON array of verified features with matched proof.
  ```

---

## 5. Blockchain Audit Trail Integration

To ensure audit histories are completely immune to tampering, the backend anchors event data to an immutable ledger (e.g., L2 rollup/smart contract or a simplified high-speed local cryptographic chain).

### Cryptographic Event Anchor Payload
Whenever a commit webhook triggers:
1. Construct the payload:
   ```typescript
   const payload = {
     commitHash: commit.hash,
     author: commit.author,
     timestamp: commit.timestamp,
     aiSummaryHash: crypto.createHash('sha256').update(commit.aiSummary).digest('hex'),
     riskScore: commit.riskScore
   };
   ```
2. Call the smart contract `anchorCommit` function:
   ```solidity
   function anchorCommit(
       string memory _commitHash, 
       string memory _author, 
       uint256 _timestamp, 
       bytes32 _aiSummaryHash, 
       uint8 _riskScore
   ) public onlyOwner returns (bytes32 txHash)
   ```
3. Store the resulting transaction hash (`blockchainTx`) in the local database and mark `blockchainStatus: "verified"`.

---

## 6. REST API Endpoints Specification

All endpoints communicate via JSON. Unauthorized requests return standard `401 Unauthorized` responses.

---

### Group 1: Hackathon Teams Management

#### 1. Fetch All Registered Teams
* **Endpoint**: `GET /api/teams`
* **Query Parameters**: None
* **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": "team-1",
      "name": "NeuralNexus",
      "repoUrl": "https://github.com/neural-nexus/core-v1",
      "avatar": "🧠",
      "techStack": ["React", "Express", "PostgreSQL", "TailwindCSS"],
      "members": ["Alex Dev", "Sarah Codes", "John Doe"],
      "progress": 85,
      "overallRiskScore": 8,
      "description": "Building a smart decentralized neural inference engine.",
      "claimedFeatures": [
        {
          "id": "claim-1",
          "claim": "Real-time WebSockets Implementation",
          "expectedEvidence": "Usage of socket.io or raw WebSocket connection in gateway",
          "actualCodeReference": "src/gateway/sockets.ts:L45",
          "status": "verified"
        }
      ],
      "commits": []
    }
  ]
  ```

#### 2. Register New Team & Auto-Sync Repository
* **Endpoint**: `POST /api/teams`
* **Request Body**:
  ```json
  {
    "name": "DeFiGuard",
    "repoUrl": "https://github.com/defiguard/audit-app",
    "avatar": "🛡️",
    "techStack": ["Solidity", "TypeScript", "Next.js"],
    "members": ["Elena", "Satoshi"],
    "description": "Real-time liquidity monitoring dashboard on blockchain."
  }
  ```
* **Processing Sequence**:
  1. Save team metadata.
  2. Parse repo URL to extract `{owner}` and `{repo}`.
  3. Query `https://api.github.com/repos/{owner}/{repo}/commits` to fetch Initial Commit History.
  4. Run initial Gemini code audits on the last 5 commits to establish baseline risk scores.
  5. Generate initial Blockchain transaction hashes for each commit.
* **Success Response (`201 Created`)**:
  ```json
  {
    "status": "success",
    "message": "Team registered and repository sync completed.",
    "data": {
      "id": "team-new-uuid",
      "name": "DeFiGuard",
      "progress": 10,
      "commitsCount": 15
    }
  }
  ```

#### 3. Update Team Metadata or Claimed Features
* **Endpoint**: `PATCH /api/teams/:id`
* **Request Body**:
  ```json
  {
    "progress": 90,
    "techStack": ["React", "Express", "PostgreSQL", "TailwindCSS", "Redis"]
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "team-1",
      "progress": 90
    }
  }
  ```

---

### Group 2: Commits, Webhooks & Anomaly Justifications

#### 1. Simulate GitHub Webhook (Local Testing / Simulated Hub)
* **Endpoint**: `POST /api/webhooks/github`
* **Request Body**:
  ```json
  {
    "repoUrl": "https://github.com/neural-nexus/core-v1",
    "commit": {
      "hash": "fc291aa88b20",
      "author": "Sarah Codes",
      "message": "Feat: Add Redis backend cache tier for lightning responses",
      "changedFiles": ["src/server/cache.ts", "package.json"],
      "additions": 142,
      "deletions": 12
    }
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "processed",
    "commitHash": "fc291aa88b20",
    "aiSummary": "Integrated Redis client caching structures.",
    "category": "backend",
    "riskScore": 12,
    "blockchainTx": "0x5a18b9..f2c0021"
  }
  ```

#### 2. Submit Hacker Justification for Flagged Commits
When a commit gets flagged with high risk, hackers must quickly justify their change to avoid grading deductions.
* **Endpoint**: `POST /api/commits/:hash/justification`
* **Request Body**:
  ```json
  {
    "justification": "This large push was due to importing a boilerplate layout helper we built in our pre-hackathon private sandbox repository. The code was entirely authored by us."
  }
  ```
* **Database Updates**: Set `justificationStatus = "pending"` and store the `justification` string inside the matching commit record.
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "message": "Justification recorded successfully. Queue updated for judge review."
  }
  ```

---

### Group 3: Judge Evaluations & Claims Verification

#### 1. Live Presentation Verbal Claims Audio Auditor
* **Endpoint**: `POST /api/teams/:id/verify-presentation`
* **Request Body**:
  ```json
  {
    "transcript": "In our live application, we successfully built a secure web socket service on our gateway that monitors block confirmations with latency under 100 milliseconds..."
  }
  ```
* **Execution Logic**:
  - Extracts the requested team's declared tech stack and verified files.
  - Feeds transcript to the Gemini 2.5 Pro analysis prompt.
  - Flags claims as verified, partially verified, or unverified.
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "results": [
      {
        "claim": "Real-time WebSockets Implementation",
        "status": "verified",
        "evidence": "Matches file 'src/gateway/sockets.ts' containing active socket connections.",
        "confidence": 0.98
      },
      {
        "claim": "Secure Auth Flow",
        "status": "partially",
        "evidence": "Mentioned JWT auth and verified token signatures. However, refresh tokens are stored in unencrypted memory.",
        "confidence": 0.75
      }
    ]
  }
  ```

#### 2. Review Anomaly Justifications (Accept / Reject)
* **Endpoint**: `PATCH /api/commits/:hash/review`
* **Request Body**:
  ```json
  {
    "status": "accepted" 
  }
  ```
* **Execution Logic**:
  - Updates `justificationStatus` to `'accepted'` or `'rejected'`.
  - Recalculates the team's overall risk score (reducing risk weight if justification is validated).
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "hash": "fc291aa88b20",
    "newOverallRiskScore": 5
  }
  ```

---

### Group 4: Stats & Audit Logging

#### 1. Get Global Hackathon Statistics
* **Endpoint**: `GET /api/stats`
* **Success Response (`200 OK`)**:
  ```json
  {
    "totalTeams": 4,
    "totalCommits": 142,
    "averageCommits": 35.5,
    "activeAlerts": 1
  }
  ```

#### 2. Get Audit Activity Trail
* **Endpoint**: `GET /api/activity-logs`
* **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": "log-1",
      "timestamp": "2026-07-05T12:28:10.000Z",
      "type": "warning",
      "message": "Suspicious velocity push flagged for Team NeuralNexus.",
      "teamName": "NeuralNexus",
      "refId": "a7b82f1"
    }
  ]
  ```

---

## 7. Production-Ready Frontend fetch Clients

These type-safe TypeScript methods are designed to be imported directly into the front-end application to cleanly replace mock database states with real server APIs.

```typescript
import { Team, Commit, HackathonStats, ActivityLog } from '../types';

const API_BASE = '/api';

/**
 * Global API Error handler
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || `HTTP error! Status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/**
 * 1. Hackathon Teams Client
 */
export const TeamsAPI = {
  // Fetch all active teams
  async getAll(): Promise<Team[]> {
    const res = await fetch(`${API_BASE}/teams`);
    return handleResponse<Team[]>(res);
  },

  // Register a new team and sync repo
  async register(payload: {
    name: string;
    repoUrl: string;
    avatar: string;
    techStack: string[];
    members: string[];
    description: string;
  }): Promise<{ status: string; message: string; data: Team }> {
    const res = await fetch(`${API_BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // Update a team's attributes
  async update(id: string, updates: Partial<Team>): Promise<Team> {
    const res = await fetch(`${API_BASE}/teams/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse<Team>(res);
  }
};

/**
 * 2. Webhook & Justification Client
 */
export const CommitsAPI = {
  // Simulate pushing a new commit webhook
  async simulateWebhook(payload: {
    repoUrl: string;
    commit: {
      hash: string;
      author: string;
      message: string;
      changedFiles: string[];
      additions: number;
      deletions: number;
    };
  }): Promise<{ status: string; commitHash: string; aiSummary: string; category: string; riskScore: number; blockchainTx: string }> {
    const res = await fetch(`${API_BASE}/webhooks/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // Submit hacker explanation for flagged commit
  async submitJustification(hash: string, justification: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/commits/${hash}/justification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ justification })
    });
    return handleResponse(res);
  },

  // Accept or reject a hacker justification (Judges only)
  async reviewJustification(hash: string, status: 'accepted' | 'rejected'): Promise<{ status: string; hash: string; newOverallRiskScore: number }> {
    const res = await fetch(`${API_BASE}/commits/${hash}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  }
};

/**
 * 3. Live Presentation Auditor Client
 */
export const DemoAuditAPI = {
  // Submit presentation notes / transcript for claim cross-referencing
  async auditPresentation(teamId: string, transcript: string): Promise<{
    status: string;
    results: {
      claim: string;
      status: 'verified' | 'unverified' | 'partially';
      evidence: string;
      confidence: number;
    }[];
  }> {
    const res = await fetch(`${API_BASE}/teams/${teamId}/verify-presentation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    return handleResponse(res);
  }
};

/**
 * 4. Stats & Logging Clients
 */
export const AnalyticsAPI = {
  // Fetch overall statistics
  async getStats(): Promise<HackathonStats> {
    const res = await fetch(`${API_BASE}/stats`);
    return handleResponse<HackathonStats>(res);
  },

  // Fetch log history
  async getActivityLogs(): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE}/activity-logs`);
    return handleResponse<ActivityLog[]>(res);
  }
};
```
