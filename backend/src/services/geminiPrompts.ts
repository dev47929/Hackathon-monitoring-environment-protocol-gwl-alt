export const commitAnalyzerSystemPrompt = `You are an expert Hackathon Code Auditor and Senior Security Engineer.
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
}`;

export const interviewQuestionSystemPrompt = `You are an adversarial Hackathon Judge testing the validity of the technical claims.
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
}`;

export const presentationVerifierSystemPrompt = `You are a Master Hackathon Auditing Agent.
Compare the live presentation transcript against the actual commit history and the declared claimed features of the team.
Identify:
1. Claims made during the presentation that lack ANY file/code footprints in the Git history. (Mark as "unverified" or flag as discrepancy).
2. Claims that are fully backed by file changes. (Mark as "verified").
3. Partially implemented features.

Return a JSON array of verified features with matched proof. Each element MUST match this schema:
[
  {
    "claim": "string",
    "status": "verified" | "unverified" | "partially",
    "evidence": "string",
    "confidence": number
  }
]`;

export function buildCommitDiffUserPrompt(diff: string, meta: { hash: string; message: string; author: string; additions: number; deletions: number; changedFiles: string[] }): string {
  const truncated = diff.length > 30000 ? diff.slice(0, 30000) + '\n...[TRUNCATED]...' : diff;
  return `Commit Metadata:
- hash: ${meta.hash}
- author: ${meta.author}
- message: ${meta.message}
- additions: ${meta.additions}
- deletions: ${meta.deletions}
- changed files: ${meta.changedFiles.join(', ')}

Raw diff / patch:
\`\`\`diff
${truncated || '(no diff provided)'}
\`\`\`

Return the JSON analysis as instructed.`;
}

export function buildInterviewUserPrompt(commits: { hash: string; message: string; changedFiles: string[]; additions: number; deletions: number; aiSummary: string }[], claimContext?: string): string {
  const commitLines = commits.map((c, i) =>
    `${i + 1}. #${c.hash} by ${c.aiSummary ? 'team' : 'unknown'}\n   message: ${c.message}\n   files: ${c.changedFiles.join(', ')}\n   +${c.additions}/-${c.deletions}\n   summary: ${c.aiSummary ?? 'n/a'}`).join('\n');
  return `Here are the team's most recent commits:
${commitLines}

${claimContext ? `Claimed features context:\n${claimContext}\n` : ''}
Generate exactly ONE interview question (as JSON) grounded in the actual code footprint above.`;
}

export function buildPresentationUserPrompt(args: {
  claimedFeatures: { claim: string; expectedEvidence: string; status: string }[];
  commits: { hash: string; message: string; changedFiles: string[]; aiSummary: string }[];
  presentationTranscript: string;
}): string {
  const claims = args.claimedFeatures.map((c, i) => `${i + 1}. ${c.claim}\n   expected: ${c.expectedEvidence}\n   current status: ${c.status}`).join('\n');
  const commitTrace = args.commits.map((c) => `- #${c.hash}: ${c.message}\n   files: ${c.changedFiles.join(', ')}\n   summary: ${c.aiSummary}`).join('\n');
  return `Declared claimed features for this team:
${claims}

Actual commit history & file fingerprints:
${commitTrace}

Live presentation transcript:
"""
${args.presentationTranscript}
"""

Cross-reference each claim against the transcript and commits. Return the JSON array of results (one entry per claim).`;
}
