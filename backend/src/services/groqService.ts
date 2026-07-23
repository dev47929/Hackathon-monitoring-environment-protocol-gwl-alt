import crypto from 'node:crypto';
import OpenAI from 'openai';
import { config } from '../config/index.js';
import { commitAnalyzerSystemPrompt, interviewQuestionSystemPrompt, presentationVerifierSystemPrompt, commitAnalysisSystemPrompt, buildCommitDiffUserPrompt, buildInterviewUserPrompt, buildPresentationUserPrompt, buildCommitAnalysisUserPrompt } from './geminiPrompts.js';
import type { CommitAnalysis, InterviewQuestionAI, PresentationResult, Category, PresentationStatus, ClaimStatus } from '../types/index.js';

interface GroqResponse<T> {
  data: T | null;
  raw: string;
  error?: string;
}

function parseJsonResponse<T>(raw: string): T | null {
  if (!raw) return null;
  let text = raw.trim();
  text = text.replace(/^```(?:json|JSON)?\s*/i, '').replace(/\s*```$/i, '');
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let startIdx = -1;
  if (firstBrace === -1 && firstBracket === -1) return null;
  if (firstBrace === -1) startIdx = firstBracket;
  else if (firstBracket === -1) startIdx = firstBrace;
  else startIdx = Math.min(firstBrace, firstBracket);
  if (startIdx > 0) text = text.slice(startIdx);
  const lastBrace = text.lastIndexOf('}');
  const lastBracket = text.lastIndexOf(']');
  const endIdx = Math.max(lastBrace, lastBracket);
  if (endIdx !== -1 && endIdx < text.length - 1) text = text.slice(0, endIdx + 1);
  try {
    return JSON.parse(text) as T;
  } catch {
    try {
      const fixed = text.replace(/\\'/g, "'").replace(/[\u0000-\u001F]/g, ' ');
      return JSON.parse(fixed) as T;
    } catch {
      return null;
    }
  }
}

function isValidCategory(value: unknown): value is Category {
  return typeof value === 'string' &&
    ['frontend', 'backend', 'blockchain', 'database', 'ai', 'docs', 'other'].includes(value);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeCategory(value: unknown): Category {
  if (isValidCategory(value)) return value;
  if (typeof value === 'string') {
    const v = value.toLowerCase();
    if (isValidCategory(v)) return v;
  }
  return 'other';
}

export class GroqService {
  private client: OpenAI | null = null;
  private groqInitialized = false;

  private initGroq(): OpenAI | null {
    if (this.groqInitialized) return this.client;
    if (!config.groq.apiKey) {
      this.groqInitialized = true;
      return null;
    }
    try {
      this.client = new OpenAI({
        apiKey: config.groq.apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      this.groqInitialized = true;
    } catch (err) {
      console.warn('[groq] Failed to initialize OpenAI client:', err instanceof Error ? err.message : err);
      this.groqInitialized = true;
      this.client = null;
    }
    return this.client;
  }

  isConfigured(): boolean {
    return Boolean(config.groq.apiKey) && this.initGroq() !== null;
  }

  private async generate(model: string, systemPrompt: string, userPrompt: string): Promise<GroqResponse<string>> {
    // Try Groq first
    const groqClient = this.initGroq();
    if (groqClient) {
      try {
        const response = await groqClient.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        });
        const text = response.choices?.[0]?.message?.content ?? '';
        if (text) {
          return { data: text, raw: text, error: undefined };
        }
      } catch (err) {
        console.warn('[groq] Groq generation failed, attempting Gemini fallback:', err instanceof Error ? err.message : err);
      }
    }

    // Fallback to Gemini (REST API with key in query string)
    if (config.gemini.apiKey) {
      try {
        const geminiModel = model === config.groq.commitModel ? config.gemini.commitModel
          : model === config.groq.interviewModel ? config.gemini.interviewModel
          : config.gemini.presentationModel;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${config.gemini.apiKey}`;
        const body = {
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        };
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          console.error('[groq] Gemini REST error:', resp.status, errText);
          return { data: null, raw: '', error: `Gemini HTTP ${resp.status}: ${errText}` };
        }
        const json = await resp.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) {
          console.log('[groq] Using Gemini fallback successfully');
          return { data: text, raw: text };
        }
      } catch (geminiErr) {
        const msg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
        console.error('[groq] Gemini fallback also failed:', msg);
        return { data: null, raw: '', error: `Groq failed, Gemini fallback also failed: ${msg}` };
      }
    }

    return { data: null, raw: '', error: 'Groq and Gemini fallback both unavailable' };
  }

  async analyzeCommit(diff: string, commitMeta: { hash: string; message: string; author: string; additions: number; deletions: number; changedFiles: string[] }): Promise<CommitAnalysis> {
    const userPrompt = buildCommitDiffUserPrompt(diff, commitMeta);
    const { data, error } = await this.generate(config.groq.commitModel, commitAnalyzerSystemPrompt, userPrompt);

    const fallback: CommitAnalysis = this.heuristicFallback(commitMeta);

    if (error || !data) {
      console.warn('[groq] analyzeCommit using heuristic fallback:', error || 'empty response');
      return fallback;
    }

    const parsed = parseJsonResponse<Partial<CommitAnalysis>>(data);
    if (!parsed) {
      console.warn('[groq] analyzeCommit could not parse JSON, using heuristic fallback');
      return fallback;
    }

    return {
      category: normalizeCategory(parsed.category),
      aiSummary: typeof parsed.aiSummary === 'string' && parsed.aiSummary.trim() ? parsed.aiSummary.slice(0, 200) : fallback.aiSummary,
      featureEvolution: typeof parsed.featureEvolution === 'string' && parsed.featureEvolution.trim() ? parsed.featureEvolution : fallback.featureEvolution,
      riskScore: clampNumber(parsed.riskScore, 0, 100, fallback.riskScore),
      isSuspicious: typeof parsed.isSuspicious === 'boolean' ? parsed.isSuspicious : fallback.isSuspicious,
      suspiciousReason: typeof parsed.suspiciousReason === 'string' && parsed.suspiciousReason.trim() ? parsed.suspiciousReason : fallback.suspiciousReason,
    };
  }

  async generateInterviewQuestion(commitsSummary: { hash: string; message: string; changedFiles: string[]; additions: number; deletions: number; aiSummary: string }[], claimContext?: string): Promise<InterviewQuestionAI | null> {
    const userPrompt = buildInterviewUserPrompt(commitsSummary, claimContext);
    const { data, error } = await this.generate(config.groq.interviewModel, interviewQuestionSystemPrompt, userPrompt);
    if (error || !data) {
      console.warn('[groq] generateInterviewQuestion returned no usable output:', error);
      const topCommit = commitsSummary[0];
      return {
        question: `How did you design and implement the logic in commit '${topCommit?.message || 'recent commit'}' (${topCommit?.hash || 'HEAD'})?`,
        context: `Focusing on code changes made across ${topCommit?.changedFiles?.join(', ') || 'project files'}.`,
        suggestedAnswer: `The team modified key files to introduce new functionality and streamline repository features.`,
      };
    }
    const parsed = parseJsonResponse<InterviewQuestionAI>(data);
    if (!parsed || !parsed.question) {
      const topCommit = commitsSummary[0];
      return {
        question: `How did you design and implement the logic in commit '${topCommit?.message || 'recent commit'}' (${topCommit?.hash || 'HEAD'})?`,
        context: `Focusing on code changes made across ${topCommit?.changedFiles?.join(', ') || 'project files'}.`,
        suggestedAnswer: `The team modified key files to introduce new functionality and streamline repository features.`,
      };
    }
    return {
      question: String(parsed.question),
      context: String(parsed.context ?? ''),
      suggestedAnswer: String(parsed.suggestedAnswer ?? ''),
    };
  }

  async verifyPresentation(args: {
    claimedFeatures: { claim: string; expectedEvidence: string; status: ClaimStatus }[];
    commits: { hash: string; message: string; changedFiles: string[]; aiSummary: string }[];
    presentationTranscript: string;
  }): Promise<PresentationResult[]> {
    const userPrompt = buildPresentationUserPrompt(args);
    const { data, error } = await this.generate(config.groq.presentationModel, presentationVerifierSystemPrompt, userPrompt);

    const fallbackResults: PresentationResult[] = args.claimedFeatures.map((cf) => ({
      claim: cf.claim,
      status: (cf.status === 'verified' ? 'verified' : cf.status === 'partially' ? 'partially' : 'unverified') as PresentationStatus,
      evidence: cf.expectedEvidence,
      confidence: cf.status === 'verified' ? 0.7 : cf.status === 'partially' ? 0.5 : 0.3,
    }));

    if (error || !data) {
      console.warn('[groq] verifyPresentation using fallback:', error);
      return fallbackResults;
    }

    const parsed = parseJsonResponse<PresentationResult[]>(data);
    if (!Array.isArray(parsed)) {
      const single = parseJsonResponse<{ results?: PresentationResult[] }>(data);
      if (single?.results && Array.isArray(single.results)) {
        return this.normalizePresentationResults(single.results, args.claimedFeatures);
      }
      console.warn('[groq] verifyPresentation could not parse JSON, using fallback');
      return fallbackResults;
    }
    return this.normalizePresentationResults(parsed, args.claimedFeatures);
  }

  private normalizePresentationResults(results: Partial<PresentationResult>[], claimedFeatures: { claim: string }[]): PresentationResult[] {
    return claimedFeatures.map((cf, idx) => {
      const match = results.find((r) => r && typeof r.claim === 'string' && r.claim.toLowerCase().includes(cf.claim.toLowerCase().slice(0, 8))) || results[idx];
      if (!match || typeof match !== 'object') {
        return { claim: cf.claim, status: 'unverified', evidence: 'No AI evidence available.', confidence: 0.3 };
      }
      const status: PresentationStatus =
        match.status === 'verified' || match.status === 'partially' || match.status === 'unverified' ? match.status : 'unverified';
      return {
        claim: cf.claim,
        status,
        evidence: typeof match.evidence === 'string' && match.evidence ? match.evidence : 'No AI evidence available.',
        confidence: clampNumber(match.confidence, 0, 1, 0.5),
      };
    });
  }

  private heuristicFallback(meta: { message: string; additions: number; deletions: number; changedFiles: string[] }): CommitAnalysis {
    const { additions, message, changedFiles } = meta;
    const category = this.guessCategory(changedFiles, message);
    const lowerMsg = message.toLowerCase();
    const isForce = /force[\s-]?push|rewrite|override.*main|history.*rewrite/.test(lowerMsg);
    let riskScore = 5;
    let isSuspicious = false;
    let suspiciousReason: string | null = null;

    if (additions > 5000 || isForce) {
      riskScore = isForce ? 95 : 75;
      isSuspicious = true;
      suspiciousReason = isForce
        ? 'Force push / git history overwrite detected.'
        : `Large code drop (${additions} additions) without explanation.`;
    } else if (additions > 500) {
      riskScore = 45;
      isSuspicious = true;
      suspiciousReason = `Moderately large push (${additions} additions) flagged for review.`;
    }

    return {
      category,
      aiSummary: `${message.slice(0, 100)}`,
      featureEvolution: `Updated ${category} layer with ${additions} additions.`,
      riskScore,
      isSuspicious,
      suspiciousReason,
    };
  }

  private guessCategory(changedFiles: string[], message: string): Category {
    const all = [...changedFiles, message].join(' ').toLowerCase();
    if (/\.sol|solidity|contract|web3|ethers|wallet/.test(all)) return 'blockchain';
    if (/spec\.|test\.|\.test\.|\.spec\.|readme|docs\/|\.md$/.test(all)) return 'docs';
    if (/server\/|route|api|express|middleware|\.sql|schema|mongoose|prisma|dao\/data|repository\.ts/.test(all)) return 'backend';
    if (/gemini|tensorflow|neural|ml|ai|vision|inference|model/.test(all)) return 'ai';
    if (/\.sql|schema\.sql|migration|db\/|database/.test(all)) return 'database';
    if (/\.tsx?|\.jsx?|component|src\/|css|tailwind|index\.html|vite/.test(all)) return 'frontend';
    return 'other';
  }

  async getCommitAnalysis(
    projectOverview: string,
    diff: string,
    commitMeta: { hash: string; message: string; author: string; additions: number; deletions: number; changedFiles: number | string[] }
  ): Promise<{ analysis: string; model: string }> {
    const fileCount = Array.isArray(commitMeta.changedFiles) ? commitMeta.changedFiles.length : commitMeta.changedFiles;
    const fallbackText = `[Fallback Summary] Commit '${commitMeta.message}' by ${commitMeta.author || 'author'} modified ${fileCount} file(s) (+${commitMeta.additions}/-${commitMeta.deletions}). AI deep analysis was temporarily unavailable.`;

    try {
      const userPrompt = buildCommitAnalysisUserPrompt(projectOverview, diff, commitMeta);
      const { data, error } = await this.generate(config.groq.commitModel, commitAnalysisSystemPrompt, userPrompt);
      if (error || !data || !data.trim()) {
        return { analysis: fallbackText, model: 'fallback' };
      }
      const trimmed = data.trim().slice(0, 2000);
      return { analysis: trimmed, model: config.groq.commitModel };
    } catch (err) {
      console.warn('[groq] getCommitAnalysis exception:', err instanceof Error ? err.message : err);
      return { analysis: fallbackText, model: 'fallback' };
    }
  }
}

export const groqService = new GroqService();
export default groqService;

export const __testing = { _hash: (s: string) => crypto.createHash('sha256').update(s).digest('hex') };
