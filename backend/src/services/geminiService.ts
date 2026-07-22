import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';
import { commitAnalyzerSystemPrompt, interviewQuestionSystemPrompt, presentationVerifierSystemPrompt, buildCommitDiffUserPrompt, buildInterviewUserPrompt, buildPresentationUserPrompt } from './geminiPrompts.js';
import type { CommitAnalysis, InterviewQuestionAI, PresentationResult, Category, PresentationStatus, ClaimStatus } from '../types/index.js';

interface GeminiResponse<T> {
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

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private initialized = false;

  private init(): GoogleGenAI | null {
    if (this.initialized) return this.ai;
    if (!config.gemini.apiKey) {
      this.initialized = true;
      return null;
    }
    try {
      this.ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
      this.initialized = true;
    } catch (err) {
      console.warn('[gemini] Failed to initialize @google/genai client:', err instanceof Error ? err.message : err);
      this.initialized = true;
      this.ai = null;
    }
    return this.ai;
  }

  isConfigured(): boolean {
    return Boolean(config.gemini.apiKey) && this.init() !== null;
  }

  private async generate(model: string, systemPrompt: string, userPrompt: string): Promise<GeminiResponse<string>> {
    const ai = this.init();
    if (!ai) {
      return { data: null, raw: '', error: 'Gemini API key not configured' };
    }
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: { systemInstruction: systemPrompt },
      });
      let text: string;
      const t = (response as { text?: unknown }).text;
      if (typeof t === 'function') {
        text = String((t as () => string)());
      } else if (typeof t === 'string') {
        text = t;
      } else {
        text = JSON.stringify(response ?? '');
      }
      return { data: text, raw: text };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[gemini] Generation failed:', msg);
      return { data: null, raw: '', error: msg };
    }
  }

  async analyzeCommit(diff: string, commitMeta: { hash: string; message: string; author: string; additions: number; deletions: number; changedFiles: string[] }): Promise<CommitAnalysis> {
    const userPrompt = buildCommitDiffUserPrompt(diff, commitMeta);
    const { data, error } = await this.generate(config.gemini.commitModel, commitAnalyzerSystemPrompt, userPrompt);

    const fallback: CommitAnalysis = this.heuristicFallback(commitMeta);

    if (error || !data) {
      console.warn('[gemini] analyzeCommit using heuristic fallback:', error || 'empty response');
      return fallback;
    }

    const parsed = parseJsonResponse<Partial<CommitAnalysis>>(data);
    if (!parsed) {
      console.warn('[gemini] analyzeCommit could not parse JSON, using heuristic fallback');
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
    const { data, error } = await this.generate(config.gemini.interviewModel, interviewQuestionSystemPrompt, userPrompt);
    if (error || !data) {
      console.warn('[gemini] generateInterviewQuestion returned no usable output:', error);
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
    const { data, error } = await this.generate(config.gemini.presentationModel, presentationVerifierSystemPrompt, userPrompt);

    const fallbackResults: PresentationResult[] = args.claimedFeatures.map((cf) => ({
      claim: cf.claim,
      status: (cf.status === 'verified' ? 'verified' : cf.status === 'partially' ? 'partially' : 'unverified') as PresentationStatus,
      evidence: cf.expectedEvidence,
      confidence: cf.status === 'verified' ? 0.7 : cf.status === 'partially' ? 0.5 : 0.3,
    }));

    if (error || !data) {
      console.warn('[gemini] verifyPresentation using fallback:', error);
      return fallbackResults;
    }

    const parsed = parseJsonResponse<PresentationResult[]>(data);
    if (!Array.isArray(parsed)) {
      const single = parseJsonResponse<{ results?: PresentationResult[] }>(data);
      if (single?.results && Array.isArray(single.results)) {
        return this.normalizePresentationResults(single.results, args.claimedFeatures);
      }
      console.warn('[gemini] verifyPresentation could not parse JSON, using fallback');
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
}

export const geminiService = new GeminiService();
export default geminiService;

export const __testing = { _hash: (s: string) => crypto.createHash('sha256').update(s).digest('hex') };
