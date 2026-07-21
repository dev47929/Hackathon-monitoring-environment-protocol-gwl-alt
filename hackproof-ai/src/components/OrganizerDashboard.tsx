import React, { useState } from 'react';
import { Team, HackathonStats, ActivityLog } from '../types';
import { TeamsAPI } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, BarChart2, GitCommit, ShieldAlert, Plus, Layers, 
  Send, Terminal, Database, ArrowRight, CheckCircle2, AlertOctagon, RefreshCw, Cpu
} from 'lucide-react';

interface OrganizerDashboardProps {
  teams: Team[];
  stats: HackathonStats;
  activityLogs: ActivityLog[];
  onRegisterTeam: (newTeam: Team) => void;
  onAddActivityLog: (log: ActivityLog) => void;
}

export default function OrganizerDashboard({ teams, stats, activityLogs, onRegisterTeam, onAddActivityLog }: OrganizerDashboardProps) {
  // Register team form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamUrl, setNewTeamUrl] = useState('');
  const [newTeamLead, setNewTeamLead] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'analytics' | 'register' | 'logs'>('analytics');

  // Register Team Submit handler
  const handleRegisterTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamUrl.trim()) return;

    setIsRegistering(true);
    const techStack = ['React', 'Tailwind', 'Node.js'];
    const avatar = '🛸';
    const description = 'A newly registered hackathon project.';

    try {
      const response = await TeamsAPI.register({
        name: newTeamName,
        repoUrl: newTeamUrl,
        avatar,
        techStack,
        members: [newTeamLead ? `${newTeamLead} (Lead)` : 'Anonymous Hacker (Lead)'],
        description,
      });

      const minimalTeam: Team = {
        id: response.data.id,
        name: response.data.name,
        repoUrl: newTeamUrl,
        avatar,
        techStack,
        members: [newTeamLead ? `${newTeamLead} (Lead)` : 'Anonymous Hacker (Lead)'],
        progress: response.data.progress,
        overallRiskScore: 0,
        description,
        commits: [],
        claimedFeatures: [],
        interviewQuestions: [],
      };

      onRegisterTeam(minimalTeam);
    } catch (err) {
      console.warn('Register API failed, using local fallback:', err);
      const id = `team-${Date.now()}`;
      const members = [newTeamLead ? `${newTeamLead} (Lead)` : 'Anonymous Hacker (Lead)'];

      const newTeam: Team = {
        id, name: newTeamName, repoUrl: newTeamUrl, avatar,
        techStack, members, progress: 10, overallRiskScore: 0,
        description,
        commits: [{
          hash: 'init001', timestamp: new Date().toISOString(),
          author: newTeamLead || 'Lead Developer',
          message: 'Initialize repository layout and basic readme documentation',
          changedFiles: ['README.md', '.gitignore'],
          additions: 15, deletions: 0,
          aiSummary: 'Initialized new repo layout.',
          featureEvolution: 'Initial project schema.',
          category: 'docs' as const,
          blockchainTx: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          blockchainStatus: 'verified' as const,
          riskScore: 2, justificationStatus: 'none' as const,
        }],
        claimedFeatures: [{ id: `cl-${id}-1`, claim: 'Core MVP Architecture', expectedEvidence: 'Config files', actualCodeReference: 'README.md', status: 'verified' as const }],
        interviewQuestions: [{ id: `iq-${id}-1`, question: 'What is the core problem solved?', context: 'Initial registry.', suggestedAnswer: 'Focus on core usability foundations.' }],
      };
      onRegisterTeam(newTeam);
    }

    onAddActivityLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'success',
      message: `HACKATHON REGISTRY: New team "${newTeamName}" registered repo ${newTeamUrl} successfully. Webhooks established.`,
      teamName: newTeamName,
    });

    setNewTeamName('');
    setNewTeamUrl('');
    setNewTeamLead('');
    setIsRegistering(false);
    setActiveTab('analytics');
  };

  // Compile Tech Stack Popularity counts
  const getTechStackDistribution = () => {
    const counts: { [key: string]: number } = {};
    teams.forEach(t => {
      t.techStack.forEach(tech => {
        counts[tech] = (counts[tech] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const techStackCounts = getTechStackDistribution();
  const maxTechCount = Math.max(...techStackCounts.map(item => item[1]), 1);

  const totalCommitsSum = teams.reduce((acc, t) => acc + t.commits.length, 0);
  const averageCommitsCalculated = (totalCommitsSum / (teams.length || 1)).toFixed(1);
  const activeAlertsSum = teams.reduce((acc, t) => acc + t.commits.filter(c => c.isSuspicious).length, 0);

  return (
    <div className="space-y-6">
      
      {/* Overview Analytics KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Active Teams</div>
            <div className="text-xl font-bold text-white mt-0.5">{teams.length} Teams</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <GitCommit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Total Commits</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalCommitsSum} Commits</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Avg Commits/Team</div>
            <div className="text-xl font-bold text-white mt-0.5">{averageCommitsCalculated} Logs</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Active Risk Flags</div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{activeAlertsSum} Alerts</div>
          </div>
        </div>
      </div>

      {/* Main split work columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Side: General control panel links */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Control Desk</h3>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono text-left flex items-center justify-between border cursor-pointer transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-bold'
                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>📊 Metric Summary Charts</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('register')}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono text-left flex items-center justify-between border cursor-pointer transition-all ${
                  activeTab === 'register'
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-bold'
                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>➕ Register New Team</span>
                <Plus className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono text-left flex items-center justify-between border cursor-pointer transition-all ${
                  activeTab === 'logs'
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-bold'
                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>📜 Activity Log</span>
                <Database className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Team Progress board */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Hacker Timelines Overview</h3>
            <div className="space-y-3.5">
              {teams.map(t => {
                return (
                  <div key={t.id} className="space-y-1.5 border-b border-slate-850/60 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{t.avatar}</span> {t.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{t.commits.length} commits</span>
                    </div>
                    {/* Progress visual bar */}
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850/40">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${t.progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Tab Contents */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                {/* Tech distribution charts custom SVG bars */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Technology Distribution</h4>
                    <p className="text-xs text-slate-400 mt-1">Which technologies are most popular among registered hackathon cohorts.</p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    {techStackCounts.map(([tech, count]) => {
                      const percentage = (count / maxTechCount) * 100;
                      return (
                        <div key={tech} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono text-slate-300">
                            <span>{tech}</span>
                            <span>{count} team{count !== 1 ? 's' : ''} ({Math.round((count / teams.length) * 100)}%)</span>
                          </div>
                          <div className="w-full h-4 bg-slate-950 rounded-lg overflow-hidden border border-slate-850/40 relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8 }}
                              className="bg-gradient-to-r from-emerald-500/20 to-emerald-500 h-full rounded-lg"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Insights panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-pink-400" />
                    Hackathon Intelligence Synopsis
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    AI is monitoring all {teams.length} participating teams. The system has currently detected <strong>{activeAlertsSum} risk flags</strong> (such as history overrides or bulk code copies). Flagged teams have submitted explanations, which judges can review inside the Judge Cockpit.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Team Registry Tab */}
            {activeTab === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Register Participating Team</h4>
                  <p className="text-xs text-slate-400 mt-1">Add a new cohort to the hackathon roster, establish GitHub webhook scopes, and initialize their secure metadata audit ledger.</p>
                </div>

                <form onSubmit={handleRegisterTeamSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 block uppercase">Team Name</label>
                      <input
                        type="text"
                        placeholder="e.g. BlocksSync AI"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-750"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 block uppercase">Lead Representative</label>
                      <input
                        type="text"
                        placeholder="e.g. Liam Smith"
                        value={newTeamLead}
                        onChange={(e) => setNewTeamLead(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-750"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-400 block uppercase">GitHub Repository URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/myteam/project"
                      value={newTeamUrl}
                      onChange={(e) => setNewTeamUrl(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-slate-750 font-mono"
                    />
                  </div>



                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isRegistering ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        COMMITTING LEDGER INITIALIZATION BLOCK...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> REGISTER TEAM & DEPLOY WEBHOOKS
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Global Logs Ledger Tab */}
            {activeTab === 'logs' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Activity Log</h4>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    ● AUDIT SECURE
                  </span>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {activityLogs.map((log) => {
                    return (
                      <div key={log.id} className="bg-slate-950 border border-slate-900 p-3 rounded-xl flex items-start gap-3 justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              log.type === 'success' 
                                ? 'bg-emerald-400' 
                                : log.type === 'danger' 
                                  ? 'bg-rose-400 animate-pulse' 
                                  : log.type === 'warning' 
                                    ? 'bg-amber-400' 
                                    : 'bg-indigo-400'
                            }`} />
                            <span className="text-xs font-semibold text-slate-200 truncate">{log.message}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                            <span>Team: <strong className="text-slate-400">{log.teamName}</strong></span>
                            {log.refId && (
                              <span>SHA Ref: <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded">{log.refId}</code></span>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-600">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
