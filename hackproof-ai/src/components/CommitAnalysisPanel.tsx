import React, { useState } from 'react';
import { CommitsAPI } from '../services/api';

export interface CommitAnalysisPanelProps {
  commitHash: string;
  existingAnalysis?: string;
  onAnalysisComplete?: (analysis: string) => void;
}

export const CommitAnalysisPanel: React.FC<CommitAnalysisPanelProps> = ({
  commitHash,
  existingAnalysis,
  onAnalysisComplete,
}) => {
  const [analysis, setAnalysis] = useState<string | null>(existingAnalysis?.trim() ? existingAnalysis : null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [modelName, setModelName] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await CommitsAPI.analyzeCommit(commitHash);
      setAnalysis(res.analysis);
      setIsCached(res.cached);
      setModelName(res.model);
      if (onAnalysisComplete) {
        onAnalysisComplete(res.analysis);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze commit.';
      setError(msg);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mt-3 p-4 rounded-xl bg-slate-900/60 border border-blue-500/30 flex items-center gap-3 text-xs text-blue-300">
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
        <span>Analyzing commit diff & project overview context with Gemini AI...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs flex items-center justify-between gap-3 text-rose-300">
        <div className="flex items-center gap-2">
          <span className="text-rose-400 font-bold">⚠️ Analysis Error:</span>
          <span>{error}</span>
        </div>
        <button
          onClick={handleAnalyze}
          className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800/80 border border-rose-700/60 text-rose-200 rounded-lg transition-colors font-medium text-[11px] shrink-0"
        >
          Retry
        </button>
      </div>
    );
  }

  if (analysis) {
    return (
      <div className="mt-3 p-4 rounded-xl bg-slate-900/80 border border-blue-500/20 text-slate-200 text-xs relative group">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-400 flex items-center gap-1.5">
              <span>⚡ Gemini Technical Review</span>
            </span>
            {modelName && modelName !== 'fallback' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-950/80 text-blue-300 border border-blue-800/50">
                {modelName}
              </span>
            )}
            {isCached && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                cached
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="text-[11px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-800/60 border border-slate-700/60 transition-colors"
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
        <p className="whitespace-pre-wrap leading-relaxed text-slate-300 font-sans">
          {analysis}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center">
      <button
        onClick={handleAnalyze}
        className="px-3 py-1.5 bg-blue-950/50 hover:bg-blue-900/60 border border-blue-700/50 text-blue-300 hover:text-blue-200 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 group"
      >
        <span className="group-hover:scale-110 transition-transform">⚡</span>
        <span>Analyze Commit with Gemini AI</span>
      </button>
    </div>
  );
};
