import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, AlertCircle, Bot, Layers, LayoutDashboard, 
  HelpCircle, Sparkles, Mail, Trophy, User, Gavel, Settings, Zap, 
  Clock, Bell, X, Compass, ExternalLink, RefreshCw, Lock, ShieldAlert, ArrowLeft
} from 'lucide-react';

import { Team, HackathonStats, ActivityLog, AuthenticatedUser } from './types';
import { INITIAL_TEAMS, MOCK_STATS, INITIAL_ACTIVITY_LOGS } from './data/mockData';
import { TeamsAPI, AnalyticsAPI } from './services/api';

// Component imports
import LandingPage from './components/LandingPage';
import TeamDashboard from './components/TeamDashboard';
import JudgeDashboard from './components/JudgeDashboard';
import OrganizerDashboard from './components/OrganizerDashboard';
import AuthGate from './components/AuthGate';

export default function App() {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [stats, setStats] = useState<HackathonStats>(MOCK_STATS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('team-1');
  const [currentRole, setCurrentRole] = useState<'landing' | 'team' | 'judge' | 'organizer' | 'auth'>('landing');

  // Load actual backend data on initialization if server is up
  useEffect(() => {
    async function loadBackendData() {
      try {
        const loadedTeams = await TeamsAPI.getAll();
        if (loadedTeams && loadedTeams.length > 0) {
          setTeams(loadedTeams);
          setSelectedTeamId(loadedTeams[0].id);
        }
      } catch (e) {
        console.warn('Failed to load teams from backend, using mocks:', e);
      }
      try {
        const loadedStats = await AnalyticsAPI.getStats();
        if (loadedStats) setStats(loadedStats);
      } catch (e) {
        console.warn('Failed to load stats from backend, using mocks:', e);
      }
      try {
        const loadedLogs = await AnalyticsAPI.getActivityLogs();
        if (loadedLogs && loadedLogs.length > 0) setActivityLogs(loadedLogs);
      } catch (e) {
        console.warn('Failed to load logs from backend, using mocks:', e);
      }
    }
    loadBackendData();
  }, []);
  
  // Authenticated user state initialized from local cache
  const [user, setUser] = useState<AuthenticatedUser | null>(() => {
    const saved = localStorage.getItem('hackproof_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  // Realtime simulated time string
  const [simulatedTime, setSimulatedTime] = useState('2026-07-05 12:30:00 UTC');

  // Sliding Notification Toast state
  const [notification, setNotification] = useState<{ show: boolean; title: string; message: string; team: string } | null>(null);

  // Tick time occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setSimulatedTime(`${now.toISOString().replace('T', ' ').substring(0, 19)} UTC`);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync state with backend whenever actions happen
  const triggerRefresh = async () => {
    try {
      const loadedTeams = await TeamsAPI.getAll();
      if (loadedTeams) setTeams(loadedTeams);
      const loadedStats = await AnalyticsAPI.getStats();
      if (loadedStats) setStats(loadedStats);
      const loadedLogs = await AnalyticsAPI.getActivityLogs();
      if (loadedLogs) setActivityLogs(loadedLogs);
    } catch (e) {
      console.warn('Failed to refresh data:', e);
    }
  };

  // Update a team's state globally
  const handleUpdateTeam = (updatedTeam: Team) => {
    setTeams(prevTeams => prevTeams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
    
    // If we updated a team and it has a new suspicious commit, trigger a slide-out notification
    const latestCommit = updatedTeam.commits[0];
    if (latestCommit && latestCommit.isSuspicious) {
      setNotification({
        show: true,
        title: 'ANOMALY ALERT SPOTTED',
        message: latestCommit.suspiciousReason || 'Unusual code push sequence flagged.',
        team: updatedTeam.name
      });
      
      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setNotification(null);
      }, 6000);
    }
    triggerRefresh();
  };

  // Add a new activity log
  const handleAddActivityLog = (newLog: ActivityLog) => {
    setActivityLogs(prevLogs => [newLog, ...prevLogs]);
    triggerRefresh();
  };

  // Register a new team
  const handleRegisterTeam = (newTeam: Team) => {
    setTeams(prevTeams => [...prevTeams, newTeam]);
    setSelectedTeamId(newTeam.id);
    triggerRefresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Dynamic Global Notification Toast Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-6 right-6 md:left-auto md:w-[420px] z-50 bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl p-4 flex items-start gap-3.5"
            id="toast-notification"
          >
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <AlertCircle className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-400 tracking-wider">
                  {notification.title}
                </span>
                <button 
                  onClick={() => setNotification(null)}
                  className="text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-sm font-semibold text-white mt-1">
                Suspicious code push: Team {notification.team}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {notification.message}
              </p>
              
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-850">
                <button
                  onClick={() => {
                    setSelectedTeamId(teams.find(t => t.name === notification.team)?.id || 'team-1');
                    setCurrentRole('team');
                    setNotification(null);
                  }}
                  className="text-[11px] font-mono font-bold text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1"
                >
                  Go to Team Dashboard <Zap className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Navigation Shell header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Logo and system status */}
          <div className="flex items-center justify-between md:justify-start gap-4">
            <button
              onClick={() => setCurrentRole('landing')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck className="w-5.5 h-5.5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1 leading-none uppercase">
                  HackProof <span className="text-indigo-400">AI</span>
                </h1>
                <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
                  IMMUTABLE AUDIT DEPLOYED
                </span>
              </div>
            </button>


          </div>

          {/* Navigation & User Authentication Widgets */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Navigation Control Switchers */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-850">
              <button
                onClick={() => setCurrentRole('landing')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-mono font-semibold transition-all cursor-pointer ${
                  currentRole === 'landing'
                    ? 'bg-slate-950 text-white shadow-sm border border-slate-850'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span className="hidden sm:inline">Landing</span>
              </button>

              <button
                onClick={() => setCurrentRole('team')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-mono font-semibold transition-all cursor-pointer ${
                  currentRole === 'team'
                    ? 'bg-slate-950 text-white shadow-sm border border-slate-850'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="hidden sm:inline">Team Hub</span>
              </button>

              <button
                onClick={() => setCurrentRole('judge')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-mono font-semibold transition-all cursor-pointer ${
                  currentRole === 'judge'
                    ? 'bg-slate-950 text-white shadow-sm border border-slate-850'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="hidden sm:inline">Judge Cockpit</span>
              </button>

              <button
                onClick={() => setCurrentRole('organizer')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-mono font-semibold transition-all cursor-pointer ${
                  currentRole === 'organizer'
                    ? 'bg-slate-950 text-white shadow-sm border border-slate-850'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="hidden sm:inline">Organizer Control</span>
              </button>
            </div>

            {/* Profile Sign In / Sign Out Widget */}
            <div className="flex items-center justify-end">
              {user === null ? (
                <button
                  onClick={() => setCurrentRole('auth')}
                  className="w-full lg:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md shadow-indigo-600/15 border border-indigo-500/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              ) : (
                <div className="w-full lg:w-auto flex items-center justify-between lg:justify-start gap-2 bg-slate-900 border border-slate-800 p-1.5 pl-3 pr-2 rounded-xl">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-none max-w-[140px] truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-indigo-400 font-extrabold tracking-wider mt-0.5">
                      {user.role === 'team' ? 'Hacker' : user.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('hackproof_user');
                      setUser(null);
                      setCurrentRole('landing');
                    }}
                    className="p-1 text-slate-500 hover:text-slate-300 font-mono text-xs cursor-pointer hover:bg-slate-950 rounded border border-transparent hover:border-slate-800 transition-colors"
                    title="Sign Out Session"
                  >
                    Exit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>



      {/* Main Container Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRole}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {currentRole === 'landing' && (
              <LandingPage onSelectRole={(role) => setCurrentRole(role)} />
            )}

            {currentRole === 'auth' && (
              <AuthGate 
                teams={teams}
                onLogin={(authenticatedUser) => {
                  setUser(authenticatedUser);
                  if (authenticatedUser.role === 'team' && authenticatedUser.teamId) {
                    setSelectedTeamId(authenticatedUser.teamId);
                  }
                  setCurrentRole(authenticatedUser.role);
                }}
                onCancel={() => {
                  setCurrentRole('landing');
                }}
              />
            )}

            {/* Dashboard role-gating & interception */}
            {currentRole !== 'landing' && currentRole !== 'auth' && (
              <>
                {/* Case 1: Guest trying to access a protected cockpit -> Intercept with AuthGate */}
                {user === null ? (
                  <AuthGate 
                    teams={teams}
                    initialRole={currentRole as 'team' | 'judge' | 'organizer'}
                    onLogin={(authenticatedUser) => {
                      setUser(authenticatedUser);
                      if (authenticatedUser.role === 'team' && authenticatedUser.teamId) {
                        setSelectedTeamId(authenticatedUser.teamId);
                      }
                      setCurrentRole(authenticatedUser.role);
                    }}
                    onCancel={() => {
                      setCurrentRole('landing');
                    }}
                  />
                ) : (
                  <>
                    {/* Case 2: Authenticated but trying to access an unauthorized cockpit -> Show beautiful mismatch guard */}
                    {user.role !== currentRole ? (
                      <div className="max-w-xl mx-auto my-12 bg-slate-900/60 border border-rose-500/30 rounded-2xl p-8 text-center space-y-6 relative overflow-hidden shadow-xl" id="auth-restriction-block">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500/30 animate-pulse"></div>
                        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                          <ShieldAlert className="w-8 h-8 animate-bounce" />
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-rose-450 uppercase tracking-widest font-extrabold">[ACCESS RESTRICTED]</span>
                          <h3 className="text-xl font-extrabold text-white">Role Mismatch</h3>
                          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                            You are signed in as a <span className="text-indigo-400 font-bold uppercase">{user.role === 'team' ? 'Hacker' : user.role}</span>, but you are trying to view the protected <span className="text-rose-400 font-bold uppercase">{currentRole === 'team' ? 'Hacker Hub' : currentRole === 'judge' ? 'Judge Cockpit' : 'Organizer Control'}</span>.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.removeItem('hackproof_user');
                              setUser(null);
                              setCurrentRole('auth');
                            }}
                            className="px-5 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-500/50 text-xs font-mono text-rose-400 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Change Your Role
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentRole(user.role);
                            }}
                            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Safe Zone
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Case 3: Fully authorized dashboard loading */}
                        {currentRole === 'team' && (
                          <TeamDashboard 
                            teams={teams} 
                            selectedTeamId={selectedTeamId} 
                            onUpdateTeam={handleUpdateTeam}
                            onAddActivityLog={handleAddActivityLog}
                          />
                        )}

                        {currentRole === 'judge' && (
                          <JudgeDashboard 
                            teams={teams}
                            selectedTeamId={selectedTeamId}
                            onSelectTeam={setSelectedTeamId}
                            onUpdateTeam={handleUpdateTeam}
                            onAddActivityLog={handleAddActivityLog}
                          />
                        )}

                        {currentRole === 'organizer' && (
                          <OrganizerDashboard 
                            teams={teams}
                            stats={stats}
                            activityLogs={activityLogs}
                            onRegisterTeam={handleRegisterTeam}
                            onAddActivityLog={handleAddActivityLog}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* System Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 py-6 px-4 md:px-8 text-center text-xs space-y-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono">
            <span>© 2026 HackProof AI Protocol</span>
            <span className="text-slate-700">|</span>
            <span className="text-emerald-500">Dual Security Anchors Active</span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-md text-center sm:text-right">
            By anchoring code summaries, anomalies, and presentation transcripts on an audit blockchain, we secure evaluations against deadlines, plagiarism, and code manipulation.
          </p>
        </div>
      </footer>
    </div>
  );
}
