import { useState } from 'react';
import { Team, Commit, ActivityLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, ShieldAlert, CheckCircle2, AlertOctagon, Terminal, Play, 
  HelpCircle, Sparkles, FileText, Download, Users, Layers, Code, 
  Check, X, Eye, ArrowRight, CornerDownRight, Mic, RefreshCw, AlertCircle
} from 'lucide-react';

interface JudgeDashboardProps {
  teams: Team[];
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
  onUpdateTeam: (updatedTeam: Team) => void;
  onAddActivityLog: (log: ActivityLog) => void;
}

export default function JudgeDashboard({ teams, selectedTeamId, onSelectTeam, onUpdateTeam, onAddActivityLog }: JudgeDashboardProps) {
  const currentTeam = teams.find(t => t.id === selectedTeamId) || teams[0];

  // Tab state
  const [activeTab, setActiveTab] = useState<'timeline' | 'claims' | 'questions' | 'report'>('timeline');

  // Presentation transcription simulator state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [currentClaimSimulationId, setCurrentClaimSimulationId] = useState<string | null>(null);
  const [matchedClaimId, setMatchedClaimId] = useState<string | null>(null);

  // Markdown export preview state
  const [copiedReport, setCopiedReport] = useState(false);

  // Accept / Reject justification handler
  const handleReviewJustification = (commitHash: string, status: 'accepted' | 'rejected') => {
    const updatedCommits = currentTeam.commits.map(c => {
      if (c.hash === commitHash) {
        return {
          ...c,
          justificationStatus: status as any
        };
      }
      return c;
    });

    // Recalculate overall risk if justification is accepted
    let newOverallRisk = currentTeam.overallRiskScore;
    if (status === 'accepted') {
      newOverallRisk = Math.max(5, currentTeam.overallRiskScore - 20);
    } else {
      newOverallRisk = Math.min(98, currentTeam.overallRiskScore + 10);
    }

    onUpdateTeam({
      ...currentTeam,
      commits: updatedCommits,
      overallRiskScore: newOverallRisk
    });

    onAddActivityLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: status === 'accepted' ? 'success' : 'warning',
      message: `Judge reviewed and ${status.toUpperCase()} justification for commit ${commitHash} on Team ${currentTeam.name}.`,
      teamName: currentTeam.name,
      refId: commitHash
    });
  };

  // Simulate transcription and claim matching live
  const startSpeechSimulation = (claimId: string, claimText: string, expectedPhrase: string) => {
    if (isTranscribing) return;
    
    setIsTranscribing(true);
    setTranscriptText('');
    setCurrentClaimSimulationId(claimId);
    setMatchedClaimId(null);

    const simulationPhrases = [
      "Hello judges! We are excited to present our project today. ",
      "Our main focus was solving transparency and security, and ",
      `specifically we wanted to highlight that ${expectedPhrase}. `,
      "We implemented this fully to make sure everything functions reliably without failures."
    ];

    let phraseIndex = 0;
    const interval = setInterval(() => {
      if (phraseIndex < simulationPhrases.length) {
        setTranscriptText(prev => prev + simulationPhrases[phraseIndex]);
        phraseIndex++;
      } else {
        clearInterval(interval);
        setIsTranscribing(false);
        setMatchedClaimId(claimId);

        // Update the status of the claim to verified or partially
        const updatedClaims = currentTeam.claimedFeatures.map(c => {
          if (c.id === claimId) {
            return {
              ...c,
              status: (c.status === 'verified' || c.status === 'partially') ? c.status : 'verified' as const
            };
          }
          return c;
        });

        onUpdateTeam({
          ...currentTeam,
          claimedFeatures: updatedClaims
        });

        onAddActivityLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'success',
          message: `Live claims verification: Voice transcript matched claim "${claimText}" against verified code database.`,
          teamName: currentTeam.name
        });
      }
    }, 1200);
  };

  // Generate complete Evaluation Markdown report
  const generateMarkdownReport = () => {
    const verifiedClaims = currentTeam.claimedFeatures.filter(c => c.status === 'verified').length;
    const totalClaims = currentTeam.claimedFeatures.length;
    const cleanCommits = currentTeam.commits.filter(c => !c.isSuspicious).length;

    return `# HackProof AI Certification Report
## Project: ${currentTeam.name}
**Repository**: ${currentTeam.repoUrl}
**Overall Risk Index**: ${currentTeam.overallRiskScore}%
**AI Evaluation Progress**: ${currentTeam.progress}%

### 1. Project Overview
${currentTeam.description}

### 2. Team Roster
${currentTeam.members.map(m => `- ${m}`).join('\n')}

### 3. Git Commits and Blockchain Audit Log
- Total Commits Logged: ${currentTeam.commits.length}
- Verified Blockchain Signatures: ${currentTeam.commits.filter(c => c.blockchainStatus === 'verified').length} / ${currentTeam.commits.length}
- Anomalous/Suspicious Commits Flagged: ${currentTeam.commits.filter(c => c.isSuspicious).length}

### 4. Technical Claims Verification Checklist
${currentTeam.claimedFeatures.map(c => `#### ${c.claim}
- Expected Evidence: ${c.expectedEvidence}
- Code Reference Found: ${c.actualCodeReference || 'Not Found'}
- Verification Status: [${c.status.toUpperCase()}]`).join('\n\n')}

### 5. Recommended Technical Interview Questions
${currentTeam.interviewQuestions.map((q, idx) => `**Q${idx + 1}: ${q.question}**
*Context*: ${q.context}
*Suggested Answer Key*: ${q.suggestedAnswer}`).join('\n\n')}

---
*Report automatically compiled and locked on the blockchain by HackProof AI Engine on date: ${new Date().toLocaleDateString()}*`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Team Selection Header */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight uppercase font-mono">Judging Operations</h2>
          <p className="text-xs text-slate-400 mt-0.5">Select a participating team below to audit code timelines, interview them, and verify live presentation claims.</p>
        </div>

        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          {teams.map(t => {
            const isSelected = t.id === selectedTeamId;
            const flaggedCount = t.commits.filter(c => c.isSuspicious).length;
            
            return (
              <button
                key={t.id}
                onClick={() => onSelectTeam(t.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-emerald-500 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                }`}
              >
                <span className="font-semibold">{t.name}</span>
                {flaggedCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    isSelected ? 'bg-slate-950 text-rose-400' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {flaggedCount}!
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main split dashboard layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left column: Scorecard and quick evaluation audit */}
        <div className="space-y-6 lg:col-span-1">
          {/* Main Team Card Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-2xl border border-slate-800">
                {currentTeam.avatar}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{currentTeam.name}</h3>
                <a href={currentTeam.repoUrl} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-400 font-mono hover:underline truncate block max-w-[150px]">
                  {currentTeam.repoUrl.replace('https://github.com/', '')}
                </a>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-850">
              {currentTeam.description}
            </p>

            <div className="pt-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">AI Progress</span>
                <span className="text-sm font-semibold text-white">{currentTeam.progress}% Evaluated</span>
              </div>
            </div>
          </div>

          {/* Anomaly / Suspicious Commits Inspector and Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Activity Flags & Team Violations
            </h3>

            {currentTeam.commits.filter(c => c.isSuspicious).length === 0 ? (
              <div className="text-center py-6 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-300">Clean History Profile</span>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">AI scanned all file insertions and branch overrides. No malicious patterns detected.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentTeam.commits.filter(c => c.isSuspicious).map(c => (
                  <div key={c.hash} className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-rose-400 font-semibold uppercase flex items-center gap-1">
                        🚨 SHA: {c.hash}
                      </span>
                      <span className="text-slate-500">Additions: {c.additions}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-slate-300 font-medium italic">"{c.message}"</div>
                      <div className="text-[11px] text-slate-400 italic bg-slate-900 p-2 rounded border border-slate-850">
                        Reason: {c.suspiciousReason}
                      </div>
                    </div>

                    {c.justification ? (
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                        <div className="text-[9px] font-mono text-emerald-400 uppercase font-semibold">Submitted Hacker Explanation</div>
                        <p className="text-xs text-slate-300 italic leading-relaxed">
                          "{c.justification}"
                        </p>
                        
                        {c.justificationStatus === 'pending' ? (
                          <div className="flex gap-2 pt-1.5 border-t border-slate-850/60">
                            <button
                              onClick={() => handleReviewJustification(c.hash, 'accepted')}
                              className="flex-1 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[10px] font-mono flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleReviewJustification(c.hash, 'rejected')}
                              className="flex-1 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded text-[10px] font-mono border border-rose-500/20 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" /> Dismiss
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono pt-1">
                            {c.justificationStatus === 'accepted' ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> JUSTIFICATION APPROVED (RISK REDUCED)
                              </span>
                            ) : (
                              <span className="text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> JUSTIFICATION REJECTED (RISK MAINTAINED)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-amber-500 bg-amber-500/5 p-2 rounded border border-amber-500/10 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                        <span>WAITING FOR TEAM EXPLANATION</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Interactive Workspace Tabs (Commit History, Live claims matching, Custom interview generator) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Workspace Tab Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`pb-3 px-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'timeline'
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Repo History ({currentTeam.commits.length})
              </button>
              <button
                onClick={() => setActiveTab('claims')}
                className={`pb-3 px-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'claims'
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <Mic className="w-3 h-3 text-indigo-400" />
                Live Demo Verify
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`pb-3 px-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'questions'
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                AI Interview Bot
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`pb-3 px-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'report'
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Final evaluation
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            
            {/* Timeline tab */}
            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="relative border-l border-slate-800 pl-4 ml-3 space-y-4">
                  {currentTeam.commits.map((commit) => (
                    <div key={commit.hash} className="relative">
                      {/* Dot */}
                      <div className={`absolute -left-[21px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                        commit.isSuspicious ? 'bg-rose-950 border-rose-500' : 'bg-slate-950 border-emerald-500'
                      }`} />

                      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-850">
                              {commit.hash}
                            </span>
                            <span className="text-sm font-semibold text-white">{commit.message}</span>
                          </div>
                          <span className="text-xs font-mono text-slate-500">
                            {new Date(commit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 space-y-2">
                          <p className="leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-slate-300 font-mono text-xs">
                            <strong className="text-pink-400 font-mono uppercase text-[11px] block mb-1">🤖 AI EXCERPT SUMMARY:</strong>
                            {commit.aiSummary}
                          </p>
                          <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                            <span>Author: <strong className="text-slate-400">{commit.author}</strong></span>
                            <span>Line changes: <strong className="text-emerald-400">+{commit.additions}</strong> / <strong className="text-rose-400">-{commit.deletions}</strong></span>
                          </div>
                        </div>

                        {/* Blockchain block receipt */}
                        <div className="flex items-center justify-between text-xs font-mono bg-slate-950/40 border border-slate-850/40 px-3 py-1.5 rounded-lg text-slate-400">
                          <span>TXN: <span className="text-slate-500">{commit.blockchainTx.substring(0, 24)}...</span></span>
                          {commit.blockchainStatus === 'verified' ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                              ✔ LEDGER CERTIFIED
                            </span>
                          ) : (
                            <span className="text-rose-400 font-semibold flex items-center gap-1 text-[11px] animate-pulse">
                              ✖ LEDGER REJECTED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Presentation speech claims matching tab */}
            {activeTab === 'claims' && (
              <motion.div
                key="claims"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-6"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Live Demo Verification Stream</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    HackProof AI uses transcription APIs during the presentation. When team members claim a feature verbally, the platform matches phrases to verified commits/files.
                  </p>
                </div>

                {/* Simulated claim buttons trigger stream */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Select Presentation Claim to Simulate:</span>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {currentTeam.claimedFeatures.map(claim => {
                      return (
                        <button
                          key={claim.id}
                          disabled={isTranscribing}
                          onClick={() => startSpeechSimulation(
                            claim.id, 
                            claim.claim, 
                            claim.claim.split(' ').slice(0, 5).join(' ') + " structure"
                          )}
                          className="text-left p-3.5 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl text-xs space-y-1.5 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="text-emerald-400 uppercase font-semibold">Simulate Verbal Claim</span>
                            <Play className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                          </div>
                          <p className="text-slate-300 font-medium font-sans">"{claim.claim}"</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Simulated transcript stream */}
                <AnimatePresence>
                  {(isTranscribing || transcriptText) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="text-xs font-mono text-pink-400 uppercase flex items-center gap-1.5 font-bold">
                          <Mic className="w-4 h-4 text-pink-400 animate-pulse" />
                          Live Presentation Transcript Feed
                        </span>
                        {isTranscribing && (
                          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Speech recognition processing...
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900 p-3 rounded-lg border border-slate-850">
                        {transcriptText || 'Listening for speech streams...'}
                      </p>

                      {/* Display matched receipt */}
                      {matchedClaimId && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg space-y-2"
                        >
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono">
                            <CheckCircle2 className="w-4 h-4" /> SPEECH CLAIM ALIGNED WITH CODE BASE
                          </div>
                          
                          {currentTeam.claimedFeatures.map(c => {
                            if (c.id === matchedClaimId) {
                              return (
                                <div key={c.id} className="text-xs text-slate-300 space-y-1 pl-5 border-l border-emerald-800 ml-1.5">
                                  <div><span className="text-slate-400 font-semibold font-mono">Claim:</span> "{c.claim}"</div>
                                  <div><span className="text-slate-400 font-semibold font-mono">Repository Evidence:</span> {c.expectedEvidence}</div>
                                  <div><span className="text-slate-400 font-semibold font-mono">Physical File Anchor:</span> <code className="text-xs bg-slate-900 px-1 py-0.5 rounded text-emerald-400 border border-slate-850">{c.actualCodeReference}</code></div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Overall Static Claims checklist list */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">All Claim Audits Database</span>
                  <div className="space-y-2">
                    {currentTeam.claimedFeatures.map(claim => (
                      <div key={claim.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h5 className="text-xs font-semibold text-white">{claim.claim}</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            <strong className="text-slate-500">Expected Proof:</strong> {claim.expectedEvidence}
                          </p>
                          {claim.actualCodeReference && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              File Reference: <span className="text-slate-400">{claim.actualCodeReference}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          {claim.status === 'verified' ? (
                            <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold font-mono whitespace-nowrap">
                              ✔ VERIFIED
                            </span>
                          ) : claim.status === 'partially' ? (
                            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold font-mono whitespace-nowrap">
                              ⚠ PARTIAL EVIDENCE
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold font-mono whitespace-nowrap">
                              ✖ UNVERIFIED
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Custom tailored AI Interview Questions tab */}
            {activeTab === 'questions' && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-6"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">AI-Generated Personalised Interview Guide</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Based on your codebase commit pivots, API updates, and technology stack modifications, the AI has prepared custom validation questions.
                  </p>
                </div>

                <div className="space-y-4">
                  {currentTeam.interviewQuestions.map((q, idx) => (
                    <div key={q.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 hover:border-slate-800 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold font-mono rounded">
                          QUESTION 0{idx + 1}
                        </span>
                        <div className="space-y-1">
                          <h5 className="text-xs font-semibold text-white leading-relaxed">
                            {q.question}
                          </h5>
                        </div>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs text-slate-300 leading-relaxed">
                        <strong className="text-emerald-400 font-mono text-[10px] block mb-1">💡 CRITERIA / ANSWER BENCHMARK:</strong>
                        "{q.suggestedAnswer}"
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Final Markdown Evaluation report tab */}
            {activeTab === 'report' && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Blockchain Audit Evaluation Certificate</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Automated certification summing timelines and risk values in Markdown format.</p>
                  </div>

                  <button
                    onClick={handleCopyReport}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {copiedReport ? 'COPIED TO CLIPBOARD' : 'COPY MARKDOWN'}
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-xs text-slate-300 overflow-y-auto max-h-[360px] whitespace-pre-wrap leading-relaxed">
                  {generateMarkdownReport()}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
