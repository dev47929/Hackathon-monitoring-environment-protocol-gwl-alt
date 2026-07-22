Prompt 1 — Database layer (schema + repository methods)

In backend/prisma/schema.prisma, add a CommitAnalysis model following the Commit/ActivityLog pattern:

id (String @id)
commitHash (String @unique)
teamId (String)
analysis (String)
model (String, e.g. "gemini-2.5-flash")
createdAt (DateTime @default(now()))

Add team Team @relation(fields: [teamId], references: [id]) and the inverse relation on Team only if the existing models in this file use explicit relations elsewhere — check Commit's teamId field first and mirror whatever pattern (relation vs. plain string FK) it already uses, don't introduce a new convention.

Add readmeContent String @default("") to Team if missing.

In backend/src/types/index.ts: add CommitAnalysisRecord matching the schema, and readmeContent?: string on Team.

In backend/src/data/repository.ts:

mapCommitAnalysis mapper, memCommitAnalyses: Map<string, CommitAnalysisRecord> fallback.
findCommitAnalysisByHash(hash) — in-memory first, then Prisma findUnique.
addCommitAnalysis(data) — upsert, not create. Two concurrent requests can both miss the cache check and both try to analyze the same commit; a plain create will throw a unique-constraint error on the loser. Use prisma.commitAnalysis.upsert({ where: { commitHash }, create: data, update: {} }) (keep the first result, don't overwrite) and the same read-check-then-set pattern on the in-memory map.
Update mapTeam/addTeam to include readmeContent.
Add memCommitAnalyses.clear() and prisma.commitAnalysis.deleteMany() to resetState.

In backend/src/routes/teamsRouter.ts: add readmeContent: z.string().max(10000).optional().default('') to both schemas, pass through as before.

In hackproof-ai/src/types.ts: mirror the readmeContent? and CommitAnalysisRecord additions.

In OrganizerDashboard.tsx: add the README textarea as described, but cap it client-side to 10000 chars with a visible counter (matching the Zod max) so registration doesn't silently fail on paste of a huge file.

Prompt 2 — Gemini analysis service

In geminiPrompts.ts, add commitAnalysisSystemPrompt (text as given) and buildCommitAnalysisUserPrompt(projectOverview, diff, meta), truncating diff at 30000 chars and truncating projectOverview at 4000 chars — an unbounded README plus a large diff can blow past the model's context window and silently degrade output quality rather than error.

In geminiService.ts:

ts
async getCommitAnalysis(
  projectOverview: string,
  diff: string,
  commitMeta: { hash: string; message: string; author: string; additions: number; deletions: number; changedFiles: number }
): Promise<{ analysis: string; model: string }>
Build the prompt, call this.generate(config.gemini.commitModel, commitAnalysisSystemPrompt, userPrompt).
Wrap the call in try/catch explicitly (don't rely on the caller to catch) so the fallback path is guaranteed even if generate throws instead of returning empty.
On failure or empty response, return a fallback string built from commitMeta (stats + "AI analysis was unavailable"), and set model: 'fallback' — not config.gemini.commitModel — so downstream code and the UI can tell a real analysis from a fallback (this matters once it's cached: you don't want a fallback string permanently cached as if it were a real model result).
On success, trim and cap the returned analysis to a sane length (e.g. 2000 chars) before returning, in case the model ignores the "3-5 sentences" instruction.
Pure function — no DB access, as specified.
Prompt 3 — API route with caching

In commitsRouter.ts, add POST /api/:hash/analyze:

Validate hash is non-empty (reject obviously malformed input early with a 400, not a DB lookup).
repo.findCommitAnalysisByHash(hash) — if found and model !== 'fallback', return { analysis, cached: true, model } and return early. If the cached entry is a fallback result, don't serve it as final — fall through and retry the analysis, so a transient Gemini outage doesn't permanently poison the cache for that commit.
repo.findCommitByHash(hash) — notFound if missing.
Look up the commit's team via commit.teamId (the original prompt jumps straight to team.readmeContent without ever fetching team — add repo.findTeamById(commit.teamId), notFound if missing).
overview = team.readmeContent ?? team.description ?? ''.
Call geminiService.getCommitAnalysis(...); wrap in try/catch → internal(...) on throw.
Persist via repo.addCommitAnalysis(...) (upsert, per Prompt 1) only if model !== 'fallback' — don't cache failures.
Respond { analysis, cached: false, model }.

Add basic rate limiting or at least note the gap: this endpoint calls a paid external API and only has optionalAuth, meaning any unauthenticated caller can trigger unlimited Gemini calls per commit hash before the cache is warm. At minimum, apply whatever rate-limit middleware other write-ish routes in this codebase use; if none exists, flag that as a follow-up rather than silently shipping an open-metered endpoint.

Prompt 4 — Frontend button + display component

CommitsAPI.analyzeCommit as given, but throw/propagate a typed error so the component can distinguish "network failure" from "server returned an error payload."

CommitAnalysisPanel.tsx:

Props and states as given, plus an error: string | null state instead of overloading analysis with the error text — keeps "no analysis yet" vs. "analysis failed" vs. "analysis succeeded" as three distinct render states rather than string-sniffing.
On mount with existingAnalysis, also treat an empty string as "not yet analyzed" (don't render the box for existingAnalysis === ''), since (commit as any).analysis will likely be undefined or '' for most commits, not just missing.
On click: loading = true, clear any previous error; on success set analysis/cached; on failure set error and leave analysis null so the button can be shown again to retry, rather than permanently displaying "Analysis failed."
Render the retry affordance: if error is set, show the message plus the same button re-enabled, not a dead-end string.
Escape/plain-render analysis as text (it's already plain-text per the system prompt, but don't dangerouslySetInnerHTML it just in case the model ignores the "no markdown" instruction and emits something odd).

In TeamDashboard.tsx / JudgeDashboard.tsx: same placement as specified, passing existingAnalysis={(commit as any).analysis} — but since Prompt 1's CommitAnalysisRecord is a separate table now, commit.analysis won't naturally exist on the Commit object returned by the list endpoint unless the commits list route is updated to join it in. Either: (a) have the commits-list endpoint left-join the cached analysis and attach it as commit.analysis, or (b) drop existingAnalysis entirely and let the panel always start from the button state, relying on the /analyze route's own cache check to make the second click instant. Cheaper to do (b) first and add (a) as a follow-up.