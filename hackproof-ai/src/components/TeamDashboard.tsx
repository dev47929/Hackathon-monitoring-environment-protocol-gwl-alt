import React, { useState } from 'react';
import { Team, Commit, ActivityLog } from '../types';
import { CommitsAPI } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitBranch, GitCommit, GitPullRequest, Code, Plus, 
  AlertTriangle, CheckCircle2, RefreshCw, Send, ShieldCheck, 
  Layers, Database, Cpu, Terminal, HelpCircle, AlertOctagon, Info
} from 'lucide-react';

interface TeamDashboardProps {
  teams: Team[];
  selectedTeamId: string;
  onUpdateTeam: (updatedTeam: Team) => void;
  onAddActivityLog: (log: ActivityLog) => void;
}

export default function TeamDashboard({ teams, selectedTeamId, onUpdateTeam, onAddActivityLog }: TeamDashboardProps) {
  const currentTeam = teams.find(t => t.id === selectedTeamId) || teams[0];

  // Git commit form state
  const [commitMessage, setCommitMessage] = useState('');
  const [commitAuthor, setCommitAuthor] = useState(currentTeam.members[0].split(' (')[0]);
  const [commitCategory, setCommitCategory] = useState<Commit['category']>('frontend');
  const [commitAdditions, setCommitAdditions] = useState('120');
  const [commitDeletions, setCommitDeletions] = useState('15');
  const [changedFilesText, setChangedFilesText] = useState('src/components/NewFeature.tsx');
  const [simulatePushing, setSimulatePushing] = useState(false);

  // Justification text map
  const [justificationTexts, setJustificationTexts] = useState<{ [commitHash: string]: string }>({});

  // Tab selection
  const [activeTab, setActiveTab] = useState<'timeline' | 'alerts' | 'push'>('timeline');

  // Trigger simulated push via backend
  const handleSimulatePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;

    setSimulatePushing(true);
    const additionsNum = parseInt(commitAdditions) || 50;
    const deletionsNum = parseInt(commitDeletions) || 5;
    const files = changedFilesText.split(',').map(f => f.trim()).filter(Boolean);
    const hash = Math.random().toString(16).substring(2, 9);

    try {
      const response = await CommitsAPI.simulateWebhook({
        repoUrl: currentTeam.repoUrl,
        commit: {
          hash,
          author: commitAuthor,
          message: commitMessage,
          changedFiles: files.length > 0 ? files : ['src/App.tsx'],
          additions: additionsNum,
          deletions: deletionsNum,
        },
      });

      const newCommit: Commit = {
        hash: response.commitHash,
        timestamp: new Date().toISOString(),
        author: commitAuthor,
        message: commitMessage,
        changedFiles: files.length > 0 ? files : ['src/App.tsx'],
        additions: additionsNum,
        deletions: deletionsNum,
        aiSummary: response.aiSummary,
        featureEvolution: response.category,
        category: response.category as Commit['category'],
        blockchainTx: response.blockchainTx,
        blockchainStatus: response.blockchainStatus as Commit['blockchainStatus'],
        blockNumber: response.blockNumber,
        eventHash: response.eventHash,
        isSuspicious: response.isSuspicious,
        suspiciousReason: response.suspiciousReason,
        riskScore: response.riskScore,
        justificationStatus: response.isSuspicious ? 'pending' : 'none',
      };

      const updatedCommits = [newCommit, ...currentTeam.commits];
      const updatedTeam: Team = {
        ...currentTeam,
        commits: updatedCommits,
        overallRiskScore: response.overallRiskScore,
        progress: Math.min(100, currentTeam.progress + 2),
      };

      onUpdateTeam(updatedTeam);
      onAddActivityLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: response.isSuspicious ? 'danger' : 'success',
        message: response.isSuspicious
          ? `WARNING: SUSPICIOUS ACTIVITY flagged for ${currentTeam.name} on commit ${response.commitHash}: ${response.suspiciousReason}`
          : `Commit ${response.commitHash} securely certified on-chain for ${currentTeam.name} by ${commitAuthor}.`,
        teamName: currentTeam.name,
        refId: response.commitHash,
      });
    } catch (err) {
      console.warn('Webhook API failed, using local fallback:', err);
      const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      let isSuspicious = false;
      let suspiciousReason = '';
      let riskScore = Math.floor(Math.random() * 15) + 5;

      if (additionsNum > 4000) {
        isSuspicious = true;
        suspiciousReason = 'Massive code upload detected (>4,000 additions in a single commit block). Potential pre-made code import.';
        riskScore = 75;
      } else if (commitMessage.toLowerCase().includes('force push') || commitMessage.toLowerCase().includes('force-push')) {
        isSuspicious = true;
        suspiciousReason = 'Git rewrite override event detected (force pushed branches bypass standard history audit ledger).';
        riskScore = 90;
      }

      const newCommit: Commit = {
        hash,
        timestamp: new Date().toISOString(),
        author: commitAuthor,
        message: commitMessage,
        changedFiles: files.length > 0 ? files : ['src/App.tsx'],
        additions: additionsNum,
        deletions: deletionsNum,
        aiSummary: `Automated analysis for commit ${hash}: Modified workspace files.`,
        featureEvolution: 'Maintained config profiles.',
        category: commitCategory,
        blockchainTx: txHash,
        blockchainStatus: isSuspicious && (commitMessage.toLowerCase().includes('force push') || commitMessage.toLowerCase().includes('force-push')) ? 'failed' as const : 'verified' as const,
        isSuspicious,
        suspiciousReason: isSuspicious ? suspiciousReason : undefined,
        riskScore,
        justificationStatus: isSuspicious ? 'pending' : 'none',
      };

      const updatedCommits = [newCommit, ...currentTeam.commits];
      const flaggedCount = updatedCommits.filter(c => c.isSuspicious).length;
      const newOverallRisk = Math.min(100, Math.floor(flaggedCount * 28 + (currentTeam.overallRiskScore * 0.4)));
      const updatedTeam: Team = { ...currentTeam, commits: updatedCommits, overallRiskScore: newOverallRisk, progress: Math.min(100, currentTeam.progress + 2) };
      onUpdateTeam(updatedTeam);
      onAddActivityLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: isSuspicious ? 'danger' : 'success',
        message: isSuspicious
          ? `WARNING: SUSPICIOUS ACTIVITY flagged for ${currentTeam.name} on commit ${hash}: ${suspiciousReason}`
          : `Commit ${hash} securely certified on-chain for ${currentTeam.name} by ${commitAuthor}.`,
        teamName: currentTeam.name,
        refId: hash,
      });
    }

    setCommitMessage('');
    setSimulatePushing(false);
    setActiveTab('timeline');
  };

  const handleSubmitJustification = async (commitHash: string) => {
    const text = justificationTexts[commitHash];
    if (!text || !text.trim()) return;

    try {
      await CommitsAPI.submitJustification(commitHash, text);
    } catch (err) {
      console.warn('Justification API failed, using local fallback:', err);
    }

    const updatedCommits = currentTeam.commits.map(c => {
      if (c.hash === commitHash) {
        return { ...c, justification: text, justificationStatus: 'pending' as const };
      }
      return c;
    });

    onUpdateTeam({ ...currentTeam, commits: updatedCommits });
    onAddActivityLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `Team ${currentTeam.name} submitted a formal justification for commit ${commitHash}.`,
      teamName: currentTeam.name,
      refId: commitHash,
    });

    setJustificationTexts({ ...justificationTexts, [commitHash]: '' });
  };

  const flaggedCommits = currentTeam.commits.filter(c => c.isSuspicious);

  const getCategoryIcon = (category: Commit['category']) => {
    switch (category) {
      case 'frontend': return <Code className="w-4 h-4 text-sky-400" />;
      case 'backend': return <Terminal className="w-4 h-4 text-indigo-400" />;
      case 'blockchain': return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'database': return <Database className="w-4 h-4 text-amber-400" />;
      case 'ai': return <Cpu className="w-4 h-4 text-pink-400" />;
      default: return <GitCommit className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Meta Details bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center text-3xl shadow-inner border border-slate-800">
            {currentTeam.avatar}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{currentTeam.name}</h2>
              <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-full text-xs font-mono">
                TEAM_CONSOLE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              REPO: <a href={currentTeam.repoUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">{currentTeam.repoUrl}</a>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl flex-1 md:flex-initial text-center md:text-left min-w-[120px]">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Commits Sent</div>
            <div className="text-xl font-bold text-white mt-0.5">{currentTeam.commits.length}</div>
          </div>
          <div className="bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl flex-1 md:flex-initial text-center md:text-left min-w-[120px]">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Risk Score</div>
            <div className={`text-xl font-bold mt-0.5 ${currentTeam.overallRiskScore > 50 ? 'text-rose-400' : currentTeam.overallRiskScore > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {currentTeam.overallRiskScore}%
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl flex-1 md:flex-initial text-center md:text-left min-w-[120px]">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Dev Progress</div>
            <div className="text-xl font-bold text-cyan-400 mt-0.5">{currentTeam.progress}%</div>
          </div>
        </div>
      </div>

      {/* Main split workspace layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Side: General Team Meta and Actions */}
        <div className="space-y-6 lg:col-span-1">
          {/* Tech Stack Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Technology Stack</h3>
            <div className="flex flex-wrap gap-1.5">
              {currentTeam.techStack.map(tech => (
                <span key={tech} className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 rounded-lg">
                  {tech}
                </span>
              ))}
            </div>
            
            <div className="border-t border-slate-850 pt-4 space-y-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Registered Roster</span>
              <ul className="space-y-1">
                {currentTeam.members.map(m => (
                  <li key={m} className="text-xs text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Alert Hub */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                Flagged Logs
              </h3>
              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[10px] font-mono rounded-full border border-rose-500/20">
                {flaggedCommits.length} ISSUE{flaggedCommits.length !== 1 ? 'S' : ''}
              </span>
            </div>

            {flaggedCommits.length === 0 ? (
              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-850/50">
                ✔ Excellent! AI has detected no anomalies in your commit streams. Your audit history is pristine.
              </p>
            ) : (
              <div className="space-y-3">
                {flaggedCommits.map(c => (
                  <div key={c.hash} className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-rose-400 font-semibold uppercase flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" /> Flagged commit {c.hash}
                      </span>
                      <span className="text-slate-500">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">"{c.message}"</p>
                    <p className="text-[11px] text-slate-400 italic bg-slate-900/40 p-2 rounded border border-slate-850">
                      Reason: {c.suspiciousReason}
                    </p>
                    
                    {c.justification ? (
                      <div className="bg-slate-900/60 p-2 rounded border border-emerald-950/50 mt-1">
                        <span className="text-[9px] font-mono text-emerald-400 uppercase font-semibold">Your Justification (Submitted)</span>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed italic">"{c.justification}"</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                          <span className="text-[10px] font-mono text-amber-400 uppercase">Justification pending judge verification</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono text-amber-400 uppercase">ACTION REQUIRED: Submit Explanation</span>
                        <textarea
                          placeholder="Explain why this commit features this development pattern..."
                          value={justificationTexts[c.hash] || ''}
                          onChange={(e) => setJustificationTexts({
                            ...justificationTexts,
                            [c.hash]: e.target.value
                          })}
                          className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-slate-700 min-h-[50px] resize-none"
                        />
                        <button
                          onClick={() => handleSubmitJustification(c.hash)}
                          className="w-full py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Send className="w-3 h-3" /> Send Clarification
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed logs workspace tabs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Workspace Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`pb-3 px-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                AI Commit Timeline ({currentTeam.commits.length})
              </button>
              <button
                onClick={() => setActiveTab('push')}
                className={`pb-3 px-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'push'
                    ? 'border-indigo-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <Plus className="w-3 h-3 text-indigo-400" />
                Simulate Push Webhook
              </button>

            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >


                <div className="relative border-l border-slate-800 pl-4 ml-3 space-y-6 py-2">
                  {currentTeam.commits.map((commit, index) => {
                    return (
                      <div key={commit.hash} className="relative group">
                        
                        {/* Dot indicator */}
                        <div className={`absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${
                          commit.isSuspicious 
                            ? 'bg-rose-950 border-rose-500 text-rose-300' 
                            : 'bg-slate-950 border-emerald-500 text-emerald-300'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${commit.isSuspicious ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                        </div>

                        {/* Card wrapper */}
                        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-all space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850/40 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-850">
                                {commit.hash}
                              </span>
                              <h4 className="text-sm font-semibold text-white tracking-tight">
                                {commit.message}
                              </h4>
                            </div>
                            <span className="text-xs font-mono text-slate-500">
                              {new Date(commit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-3 text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono text-slate-500 block uppercase">Author</span>
                              <span className="text-slate-300 font-medium">{commit.author}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono text-slate-500 block uppercase">Category</span>
                              <span className="flex items-center gap-1 text-slate-300 font-medium">
                                {getCategoryIcon(commit.category)}
                                <span className="capitalize">{commit.category}</span>
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono text-slate-500 block uppercase">Code Changes</span>
                              <span className="font-mono text-slate-300">
                                <span className="text-emerald-400">+{commit.additions}</span>{' '}
                                <span className="text-rose-400">-{commit.deletions}</span> lines
                              </span>
                            </div>
                          </div>

                          {/* AI Summary Block */}
                          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                              <Cpu className="w-3.5 h-3.5 text-pink-400" />
                              <span className="uppercase tracking-wider font-semibold">AI Commit Assessment</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">
                              {commit.aiSummary}
                            </p>
                            <div className="text-[11px] text-slate-400 italic">
                              <strong className="text-slate-500 not-italic">Feature Impact:</strong> {commit.featureEvolution}
                            </div>
                          </div>

                          {/* Blockchain verification block */}
                          <div className="flex items-center justify-between text-[11px] font-mono bg-slate-950/40 border border-slate-850/30 px-3 py-1.5 rounded-lg">
                            <div className="flex items-center gap-1 text-slate-400 truncate">
                              <span className="text-slate-500 uppercase text-[9px]">BLOCKCHAIN TX:</span>
                              <span className="truncate max-w-[150px] sm:max-w-[280px] text-[10px]">{commit.blockchainTx}</span>
                            </div>
                            
                            {commit.blockchainStatus === 'verified' ? (
                              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                <ShieldCheck className="w-3.5 h-3.5" /> CERTIFIED
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold animate-pulse">
                                <AlertOctagon className="w-3.5 h-3.5" /> REJECTED
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'push' && (
              <motion.div
                key="push"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Code Update Tester</h4>
                </div>

                <form onSubmit={handleSimulatePush} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 block uppercase">Developer Name</label>
                      <select
                        value={commitAuthor}
                        onChange={(e) => setCommitAuthor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                      >
                        {currentTeam.members.map(m => {
                          const nameOnly = m.split(' (')[0];
                          return <option key={nameOnly} value={nameOnly}>{nameOnly}</option>;
                        })}
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 block uppercase">Project Area</label>
                      <select
                        value={commitCategory}
                        onChange={(e) => setCommitCategory(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                      >
                        <option value="frontend">Frontend User Interface</option>
                        <option value="backend">Backend Router Middleware</option>
                        <option value="blockchain">Solidity Smart Contract</option>
                        <option value="database">Database Cache Configuration</option>
                        <option value="ai">Gemini AI Model Prompts</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-400 block uppercase">Change Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Integrate token escrow transfer structures"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                    />
                    <div className="flex gap-2.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setCommitMessage('Minor CSS adjustments inside header profile')}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded text-[10px] font-mono text-slate-400 cursor-pointer"
                      >
                        Standard Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCommitMessage('Import pre-compiled repository base structure and modules');
                          setCommitAdditions('8900');
                        }}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded text-[10px] font-mono text-amber-500 cursor-pointer"
                      >
                        Bulk Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCommitMessage('FORCE PUSH: Override origin master branch history');
                          setCommitAdditions('12');
                        }}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded text-[10px] font-mono text-rose-500 cursor-pointer"
                      >
                        Overwrite History
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-400 block uppercase">Edited Files</label>
                    <input
                      type="text"
                      value={changedFilesText}
                      onChange={(e) => setChangedFilesText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                    />
                  </div>



                  <button
                    type="submit"
                    disabled={simulatePushing}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {simulatePushing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        INTERCEPTING WEBHOOK & ANALYZING DIFFS...
                      </>
                    ) : (
                      <>
                        <GitPullRequest className="w-4 h-4" />
                        EXECUTE GIT PUSH (SIMULATED WEBHOOK)
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
                  )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
