import React, { useState } from 'react';
import { Team, HackathonStats, ActivityLog } from '../types';
import { TeamsAPI, AuthAPI } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, BarChart2, GitCommit, ShieldAlert, Plus, Layers, 
  Send, Terminal, Database, ArrowRight, CheckCircle2, AlertOctagon, RefreshCw, Cpu, UserPlus
} from 'lucide-react';

interface OrganizerDashboardProps {
  teams: Team[];
  stats: HackathonStats;
  activityLogs: ActivityLog[];
  onRegisterTeam: (newTeam: Team) => void;
  onAddActivityLog: (log: ActivityLog) => void;
}

export default function OrganizerDashboard({ teams, stats, activityLogs, onRegisterTeam, onAddActivityLog }: OrganizerDashboardProps) {
  // Registration mode: 'team' or 'judge'
  const [regMode, setRegMode] = useState<'team' | 'judge'>('team');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Team-specific fields
  const [newTeamUrl, setNewTeamUrl] = useState('');
  const [newTeamLead, setNewTeamLead] = useState('');
  const [newTechStack, setNewTechStack] = useState('');
  const [newReadmeContent, setNewReadmeContent] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'analytics' | 'register' | 'logs'>('analytics');

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError('Please fill in all required fields.');
      return;
    }
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters.');
      return;
    }
    if (regMode === 'team' && (!newTeamUrl.trim())) {
      setRegError('GitHub Repository URL is required for team registration.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (regMode === 'team') {
        const techStack = newTechStack.trim()
          ? newTechStack.split(',').map(s => s.trim()).filter(Boolean)
          : ['React', 'Tailwind', 'Node.js'];
        const avatar = '🛸';
        const description = 'A newly registered hackathon project.';
        const members = [newTeamLead ? `${newTeamLead} (Lead)` : regName];

        const response = await TeamsAPI.register({
          name: regName,
          repoUrl: newTeamUrl,
          avatar,
          techStack,
          members,
          description,
          readmeContent: newReadmeContent.slice(0, 10000),
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
        });

        const minimalTeam: Team = {
          id: response.data.id,
          name: regName,
          repoUrl: newTeamUrl,
          avatar,
          techStack,
          members,
          progress: response.data.progress,
          overallRiskScore: 0,
          description,
          readmeContent: newReadmeContent.slice(0, 10000),
          commits: [],
          claimedFeatures: [],
          interviewQuestions: [],
        };

        onRegisterTeam(minimalTeam);

        onAddActivityLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'success',
          message: `HACKATHON REGISTRY: Team "${regName}" registered with repo ${newTeamUrl}. Login credentials created for ${regEmail}.`,
          teamName: regName,
        });

        setRegSuccess(`Team "${regName}" registered and login credentials created for ${regEmail}.`);
      } else {
        await AuthAPI.register({
          name: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          role: 'judge',
        });

        onAddActivityLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'success',
          message: `IDENTITY PROTOCOL: Registered judge "${regName}" with email ${regEmail}.`,
          teamName: 'System',
        });

        setRegSuccess(`Judge account "${regName}" created successfully.`);
      }
    } catch (err: any) {
      console.warn('Registration error:', err);
      setRegError(err?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
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
                onClick={() => { setActiveTab('register'); setRegMode('team'); }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono text-left flex items-center justify-between border cursor-pointer transition-all ${
                  activeTab === 'register'
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-bold'
                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>➕ Register Team / Judge</span>
                <UserPlus className="w-4 h-4" />
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
                    {techStackCounts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No technologies registered yet. Register teams to compile statistics.</p>
                    ) : (
                      techStackCounts.map(([tech, count]) => {
                        const percentage = (count / maxTechCount) * 100;
                        return (
                          <div key={tech} className="space-y-1">
                            <div className="flex justify-between text-xs font-mono text-slate-300">
                              <span>{tech}</span>
                              <span>{count} team{count !== 1 ? 's' : ''} ({Math.round((count / (teams.length || 1)) * 100)}%)</span>
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
                      })
                    )}
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

            {/* Unified Registration Tab */}
            {activeTab === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Register</h4>
                    <p className="text-xs text-slate-400 mt-1">Register a new team or a judge. Login credentials are created automatically.</p>
                  </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setRegMode('team'); setRegError(''); setRegSuccess(''); }}
                    className={`flex-1 py-2 px-4 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      regMode === 'team'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    👥 Register Team
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegMode('judge'); setRegError(''); setRegSuccess(''); }}
                    className={`flex-1 py-2 px-4 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      regMode === 'judge'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    ⚖️ Register Judge
                  </button>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {regError && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono">
                      ⚠️ {regError}
                    </div>
                  )}

                  {regSuccess && (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono">
                      ✅ {regSuccess}
                    </div>
                  )}

                  {/* Common fields for both modes */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 block uppercase">
                        {regMode === 'team' ? 'Team Name' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        placeholder={regMode === 'team' ? 'e.g. BlocksSync AI' : 'e.g. Alex Rivera'}
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-750"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 block uppercase">Email (Login)</label>
                      <input
                        type="email"
                        placeholder="e.g. team@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-750"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-mono text-slate-400 uppercase">Password</label>
                        <button
                          type="button"
                          onClick={() => {
                            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
                            let autoPass = '';
                            for (let i = 0; i < 12; i++) {
                              autoPass += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            setRegPassword(autoPass);
                          }}
                          className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 pointer-events-auto"
                        >
                          [Auto Key Generator]
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Min. 8 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-750 font-mono"
                      />
                    </div>

                    {regMode === 'team' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono text-slate-400 block uppercase">Lead Representative</label>
                        <input
                          type="text"
                          placeholder="e.g. Liam Smith"
                          value={newTeamLead}
                          onChange={(e) => setNewTeamLead(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-750"
                        />
                      </div>
                    )}
                  </div>

                  {/* Team-specific fields */}
                  {regMode === 'team' && (
                    <>
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

                      <div className="space-y-1.5">
                        <label className="text-xs font-mono text-slate-400 block uppercase">Tech Stack (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. TypeScript, React, Node.js"
                          value={newTechStack}
                          onChange={(e) => setNewTechStack(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-750"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-mono text-slate-400 block uppercase">Project Overview / README Context</label>
                          <span className={`text-[11px] font-mono ${newReadmeContent.length > 9500 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {newReadmeContent.length} / 10,000
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          maxLength={10000}
                          placeholder="Paste project README or architectural overview here..."
                          value={newReadmeContent}
                          onChange={(e) => setNewReadmeContent(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-750 font-sans resize-y"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {regMode === 'team' ? 'REGISTERING TEAM & CREATING LOGIN...' : 'PROVISIONING JUDGE ACCOUNT...'}
                      </>
                    ) : (
                      <>
                        {regMode === 'team' ? <Plus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {regMode === 'team' ? 'REGISTER TEAM & CREATE LOGIN' : 'CREATE JUDGE ACCOUNT'}
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
