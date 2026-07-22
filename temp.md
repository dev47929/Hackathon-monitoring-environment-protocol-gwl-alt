# AI Commit Analysis Feature — Refined Implementation Prompts

This document provides step-by-step developer prompts to implement the **Commit AI Analysis** feature for the Hackathon Monitoring Environment. Each prompt is tailored precisely to the project's architecture, database conventions (Prisma + in-memory dual fallback), Gemini service layer, ESM import patterns, and React/Tailwind frontend components.

---

## Prompt 1 — Database Layer & Schema Updates

### Objective
Extend the database schema, backend TypeScript interfaces, data repository methods, API validation, and frontend types to support storing and retrieving commit analysis records and team README context.

### Target Files
- [schema.prisma](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/prisma/schema.prisma)
- [index.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/src/types/index.ts)
- [repository.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/src/data/repository.ts)
- [teamsRouter.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/src/routes/teamsRouter.ts)
- [types.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/hackproof-ai/src/types.ts)
- [OrganizerDashboard.tsx](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/hackproof-ai/src/components/OrganizerDashboard.tsx)

### Steps & Technical Directives

1. **Prisma Schema Update ([schema.prisma](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/prisma/schema.prisma))**:
   - Add a `CommitAnalysis` model following existing relational patterns:
     ```prisma
     model CommitAnalysis {
       id         String   @id @default(uuid())
       commitHash String   @unique
       teamId     String
       analysis   String
       model      String
       createdAt  DateTime @default(now())
       team       Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
       commit     Commit   @relation(fields: [commitHash], references: [hash], onDelete: Cascade)
     }
     ```
   - Mirror explicit relations: add `commitAnalyses CommitAnalysis[]` to `model Team` and `commitAnalysis CommitAnalysis?` to `model Commit`.
   - Add `readmeContent String @default("")` to `model Team`.

2. **Backend & Frontend Types ([index.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/src/types/index.ts) & [types.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/hackproof-ai/src/types.ts))**:
   - In both type files, export the `CommitAnalysisRecord` interface:
     ```ts
     export interface CommitAnalysisRecord {
       id: string;
       commitHash: string;
       teamId: string;
       analysis: string;
       model: string;
       createdAt: string;
     }
     ```
   - Update the `Team` interface in both files to include `readmeContent?: string;`.

3. **Data Repository Layer ([repository.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/src/data/repository.ts))**:
   - Add in-memory fallback store: `const memCommitAnalyses = new Map<string, CommitAnalysisRecord>()`.
   - Implement `mapCommitAnalysis(row: any): CommitAnalysisRecord`.
   - Implement `findCommitAnalysisByHash(hash: string): Promise<CommitAnalysisRecord | undefined>`:
     - Check `memCommitAnalyses.get(hash)` first.
     - If missing in memory, query `prisma.commitAnalysis.findUnique({ where: { commitHash: hash } })`. If found, store in `memCommitAnalyses` and return the mapped record.
   - Implement concurrency-safe `addCommitAnalysis(data: Omit<CommitAnalysisRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<CommitAnalysisRecord>`:
     - Use `prisma.commitAnalysis.upsert({ where: { commitHash: data.commitHash }, create: recordData, update: {} })` to prevent unique-constraint violations when concurrent requests analyze the same commit.
     - Mirror read-check-then-set pattern on `memCommitAnalyses`.
   - Update `mapTeam` and `addTeam` to handle `readmeContent`.
   - Update `resetState()` to call `memCommitAnalyses.clear()` and `if (prisma.commitAnalysis) await prisma.commitAnalysis.deleteMany()`.

4. **Teams Router ([teamsRouter.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/src/routes/teamsRouter.ts))**:
   - Update team creation/modification Zod schemas to include:
     `readmeContent: z.string().max(10000).optional().default('')`.
   - Pass through `readmeContent` in team creation and update handlers.

5. **Organizer Dashboard ([OrganizerDashboard.tsx](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/hackproof-ai/src/components/OrganizerDashboard.tsx))**:
   - Add a "Project Overview / README" textarea in the team setup form.
   - Cap client-side entry at 10,000 characters with a live visual counter (e.g. `${readmeContent.length} / 10,000`) matching the Zod max limit.

---

## Prompt 2 — Gemini Analysis Service Integration

### Objective
Create system and user prompts for commit deep analysis and integrate the AI generation method in `GeminiService` with heuristic fallbacks and context truncation.

### Target Files
- [geminiPrompts.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/src/services/geminiPrompts.ts)
- [geminiService.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/src/services/geminiService.ts)

### Steps & Technical Directives

1. **Prompt Builders ([geminiPrompts.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/src/services/geminiPrompts.ts))**:
   - Add `commitAnalysisSystemPrompt`:
     ```ts
     export const commitAnalysisSystemPrompt = `You are a Senior Security Engineer & Technical Auditor.
     Your task is to analyze the provided Git commit diff in the context of the project overview (README).
     Provide a concise, 3-5 sentence breakdown summarizing:
     1. Key technical changes introduced by this commit.
     2. How this commit contributes to the project's overall architectural goals.
     3. Potential risks, code quality notes, or architectural anomalies.

     Output plain concise text only. Do NOT use markdown code blocks or raw JSON wrapping.`;
     ```
   - Add `buildCommitAnalysisUserPrompt(projectOverview: string, diff: string, meta: { hash: string; message: string; author: string; additions: number; deletions: number; changedFiles: number | string[] })`:
     - Truncate `projectOverview` at 4,000 characters (`projectOverview.slice(0, 4000)`).
     - Truncate `diff` at 30,000 characters (`diff.slice(0, 30000)`).
     - Format and return structured text with metadata, project overview, and raw diff.

2. **Gemini Service Method ([geminiService.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/src/services/geminiService.ts))**:
   - Implement `getCommitAnalysis`:
     ```ts
     async getCommitAnalysis(
       projectOverview: string,
       diff: string,
       commitMeta: { hash: string; message: string; author: string; additions: number; deletions: number; changedFiles: number | string[] }
     ): Promise<{ analysis: string; model: string }>
     ```
   - Call `this.generate(config.gemini.commitModel, commitAnalysisSystemPrompt, userPrompt)`.
   - Explicitly wrap in a `try/catch` block so failures return gracefully.
   - **Fallback Handling**: On API error or empty output, construct a deterministic summary string:
     `"[Fallback Summary] Commit '${commitMeta.message}' by ${commitMeta.author} modified ${changedCount} file(s) (+${commitMeta.additions}/-${commitMeta.deletions}). AI deep analysis was temporarily unavailable."`
     Return `{ analysis: fallbackString, model: 'fallback' }` (using `'fallback'` as the model name ensures the route handler will not permanently cache API failures).
   - **Success Output**: On valid response, trim and cap the result at 2,000 characters before returning `{ analysis, model: config.gemini.commitModel }`.

---

## Prompt 3 — API Route with Smart Caching

### Objective
Expose a backend endpoint `POST /api/commits/:hash/analyze` to handle commit analysis requests, returning cached results when available and preventing cache poisoning during transient AI outages.

### Target Files
- [commitsRouter.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/backend/src/routes/commitsRouter.ts)

### Steps & Technical Directives

1. **Route Endpoint Setup**:
   - Add route handler `commitsRouter.post('/:hash/analyze', optionalAuth, asyncHandler(async (req, res) => ...))`.

2. **Validation & Cache Lookup**:
   - Validate `hash` param (reject empty or malformed hash early with `badRequest('Invalid commit hash.')`).
   - Query cache via `repo.findCommitAnalysisByHash(hash)`.
   - **Cache Check Rule**: If cached record exists AND `cached.model !== 'fallback'`, return immediately:
     ```json
     { "analysis": cached.analysis, "cached": true, "model": cached.model }
     ```
   - If `cached.model === 'fallback'`, bypass cache and retry Gemini analysis to recover from transient outages.

3. **Context Assembly & Execution**:
   - Fetch commit: `repo.findCommitByHash(hash)`. Throw `notFound('Commit not found.')` if missing.
   - Fetch team: `repo.getTeamById(commit.teamId)`. Throw `notFound('Team not found.')` if missing.
   - Determine overview context: `const overview = team.readmeContent?.trim() || team.description?.trim() || ''`.
   - Resolve diff: extract diff patch from incoming commit or GitHub service.
   - Execute analysis: `const result = await geminiService.getCommitAnalysis(overview, diff, commitMeta)`.

4. **Persistence & Response**:
   - Only call `repo.addCommitAnalysis(...)` if `result.model !== 'fallback'` (do not cache failures).
   - Return response:
     ```json
     { "analysis": result.analysis, "cached": false, "model": result.model }
     ```

5. **Security & Rate Limiting Guidelines**:
   - Because `optionalAuth` permits public invocation, apply rate limiting middleware to prevent unauthorized API quota consumption.

---

## Prompt 4 — Frontend Interactive Analysis Component & Dashboards

### Objective
Create a reusable React UI component `CommitAnalysisPanel.tsx` that provides a premium interactive interface for triggering, viewing, and retrying AI commit analyses.

### Target Files
- [api.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/hackproof-ai/src/services/api.ts) (or API layer helper)
- [NEW] [CommitAnalysisPanel.tsx](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/hackproof-ai/src/components/CommitAnalysisPanel.tsx)
- [TeamDashboard.tsx](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/hackproof-ai/src/components/TeamDashboard.tsx)
- [JudgeDashboard.tsx](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/hackproof-ai/src/components/JudgeDashboard.tsx)

### Steps & Technical Directives

1. **API Client Helper ([api.ts](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/hackproof-ai/src/services/api.ts))**:
   - Add `analyzeCommit(hash: string): Promise<{ analysis: string; cached: boolean; model: string }>` to execute the API call and throw structured errors on failure.

2. **Commit Analysis Panel Component ([CommitAnalysisPanel.tsx](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/hackproof-ai/src/components/CommitAnalysisPanel.tsx))**:
   - Define Component Props:
     ```ts
     interface CommitAnalysisPanelProps {
       commitHash: string;
       existingAnalysis?: string;
       onAnalysisComplete?: (analysis: string) => void;
     }
     ```
   - Manage 4 distinct render states:
     1. **Unanalyzed**: Action button ("⚡ Analyze Commit with Gemini AI").
     2. **Loading**: Animated spinner with text ("Analyzing commit diff & project context...").
     3. **Error**: Alert container with error message and a "Retry Analysis" button.
     4. **Success**: Glassmorphism dark-card displaying plain-text analysis (rendered in `<p className="whitespace-pre-wrap">`), model badge (e.g. `gemini-2.5-flash` or `Cached`), and a copy button.
   - Treat empty strings or `undefined` for `existingAnalysis` as unanalyzed.

3. **Dashboard Integration ([TeamDashboard.tsx](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/hackproof-ai/src/components/TeamDashboard.tsx) & [JudgeDashboard.tsx](file:///d:/Gitshit/Hackathon-monitoring-environment-protocol-gwl-alt/hackproof-ai/src/components/JudgeDashboard.tsx))**:
   - Embed `<CommitAnalysisPanel commitHash={commit.hash} />` inside expanded commit rows or commit details drawers in both Team and Judge dashboards.