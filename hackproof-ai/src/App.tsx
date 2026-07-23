import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, AlertCircle, X, Compass, RefreshCw, Lock, ShieldAlert, ArrowLeft, Zap
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';

import { Team, HackathonStats, ActivityLog, AuthenticatedUser } from './types';
import { INITIAL_TEAMS, MOCK_STATS, INITIAL_ACTIVITY_LOGS } from './data/mockData';
import { TeamsAPI, AnalyticsAPI, getStoredToken } from './services/api';
import { useAuth } from './context/AuthContext';

import LandingPage from './components/LandingPage';
import TeamDashboard from './components/TeamDashboard';
import JudgeDashboard from './components/JudgeDashboard';
import OrganizerDashboard from './components/OrganizerDashboard';
import AuthGate from './components/AuthGate';
import BlockchainExplorer from './components/BlockchainExplorer';

function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function TeamRoute({ teams, selectedTeamId, onUpdateTeam, onAddActivityLog }: {
  teams: Team[]; selectedTeamId: string;
  onUpdateTeam: (t: Team) => void; onAddActivityLog: (l: ActivityLog) => void;
}) {
  const { id } = useParams();
  return (
    <TeamDashboard
      teams={teams}
      selectedTeamId={id || selectedTeamId}
      onUpdateTeam={onUpdateTeam}
      onAddActivityLog={onAddActivityLog}
    />
  );
}

export default function App() {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [stats, setStats] = useState<HackathonStats>(MOCK_STATS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('team-1');
  const [notification, setNotification] = useState<{ show: boolean; title: string; message: string; team: string } | null>(null);

  const { user, login: authLogin, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function loadBackendData() {
      try {
        const loadedTeams = await TeamsAPI.getAll();
        if (loadedTeams && loadedTeams.length > 0) {
          setTeams(loadedTeams);
          setSelectedTeamId(prev => loadedTeams.some(t => t.id === prev) ? prev : loadedTeams[0].id);
        }
      } catch (e) { console.warn('Failed to load teams from backend, using mocks:', e); }
      try {
        const loadedStats = await AnalyticsAPI.getStats();
        if (loadedStats) setStats(loadedStats);
      } catch (e) { console.warn('Failed to load stats from backend, using mocks:', e); }
      try {
        const loadedLogs = await AnalyticsAPI.getActivityLogs();
        if (loadedLogs && loadedLogs.length > 0) setActivityLogs(loadedLogs);
      } catch (e) { console.warn('Failed to load logs from backend, using mocks:', e); }
    }
    loadBackendData();
  }, [location.pathname]);

  const triggerRefresh = async () => {
    try {
      const loadedTeams = await TeamsAPI.getAll();
      if (loadedTeams) setTeams(loadedTeams);
      const loadedStats = await AnalyticsAPI.getStats();
      if (loadedStats) setStats(loadedStats);
      const loadedLogs = await AnalyticsAPI.getActivityLogs();
      if (loadedLogs) setActivityLogs(loadedLogs);
    } catch (e) { console.warn('Failed to refresh data:', e); }
  };

  const handleUpdateTeam = (updatedTeam: Team) => {
    setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
    const latestCommit = updatedTeam.commits[0];
    if (latestCommit && latestCommit.isSuspicious) {
      setNotification({
        show: true,
        title: 'ANOMALY ALERT SPOTTED',
        message: latestCommit.suspiciousReason || 'Unusual code push sequence flagged.',
        team: updatedTeam.name
      });
      setTimeout(() => setNotification(null), 6000);
    }
    triggerRefresh();
  };

  const handleAddActivityLog = (newLog: ActivityLog) => {
    setActivityLogs(prev => [newLog, ...prev]);
    triggerRefresh();
  };

  const handleRegisterTeam = (newTeam: Team) => {
    setTeams(prev => [...prev, newTeam]);
    setSelectedTeamId(newTeam.id);
    triggerRefresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-6 right-6 md:left-auto md:w-[420px] z-50 bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl p-4 flex items-start gap-3.5"
          >
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <AlertCircle className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-400 tracking-wider">{notification.title}</span>
                <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-sm font-semibold text-white mt-1">Suspicious code push: Team {notification.team}</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notification.message}</p>
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-850">
                <button onClick={() => {
                  setSelectedTeamId(teams.find(t => t.name === notification.team)?.id || 'team-1');
                  navigate(`/team/${teams.find(t => t.name === notification.team)?.id || 'team-1'}`);
                  setNotification(null);
                }} className="text-[11px] font-mono font-bold text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1">
                  Go to Team Dashboard <Zap className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 py-2 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center justify-between md:justify-start gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 text-left group cursor-pointer">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-200">
                <img src="/logo.png" alt="HackProof AI Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1 leading-none uppercase">
                  HackProof <span className="text-indigo-400">AI</span>
                </h1>

              </div>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-850">
              <button onClick={() => navigate('/')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer text-slate-400 hover:text-slate-200">
                <Compass className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Landing</span>
              </button>
              <button onClick={() => navigate('/team/team-1')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer text-slate-400 hover:text-slate-200">
                <span className="hidden sm:inline">Team Hub</span>
              </button>
              <button onClick={() => navigate('/judge')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer text-slate-400 hover:text-slate-200">
                <span className="hidden sm:inline">Judge Cockpit</span>
              </button>
              <button onClick={() => navigate('/organizer')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer text-slate-400 hover:text-slate-200">
                <span className="hidden sm:inline">Organizer Control</span>
              </button>
              <button onClick={() => navigate('/blockchain')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer text-slate-400 hover:text-slate-200">
                <span className="hidden sm:inline">Blockchain</span>
              </button>
            </div>

            <div className="flex items-center justify-end">
              {user === null ? (
                <button onClick={() => navigate('/login')}
                  className="w-full lg:w-auto flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md shadow-indigo-600/15 border border-indigo-500/20">
                  <Lock className="w-3 h-3" /> <span>Sign In</span>
                </button>
              ) : (
                <div className="w-full lg:w-auto flex items-center justify-between lg:justify-start gap-2 bg-slate-900 border border-slate-800 p-1 pl-2.5 pr-1.5 rounded-lg">
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-white leading-none max-w-[120px] truncate">{user.name}</span>
                    <span className="text-[9px] font-mono uppercase text-indigo-400 font-extrabold tracking-wider mt-0.5">
                      {user.role === 'team' ? 'Hacker' : user.role}
                    </span>
                  </div>
                  <button type="button" onClick={authLogout}
                    className="p-0.5 px-1 text-slate-500 hover:text-slate-300 font-mono text-[10px] cursor-pointer hover:bg-slate-950 rounded border border-transparent hover:border-slate-800 transition-colors"
                    title="Sign Out Session">Exit</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <Routes>
              <Route path="/" element={
                <LandingPage onSelectRole={(role) => navigate(`/${role === 'team' ? `team/${selectedTeamId}` : role}`)} />
              } />
              <Route path="/login" element={
                <AuthGate teams={teams} onLogin={(authenticatedUser) => {
                  const token = getStoredToken() || '';
                  authLogin(authenticatedUser, token);
                  navigate(`/${authenticatedUser.role === 'team' ? `team/${authenticatedUser.teamId || selectedTeamId}` : authenticatedUser.role}`);
                }} onCancel={() => navigate('/')} />
              } />
              <Route path="/team/:id" element={
                <PrivateRoute allowedRoles={['team']}>
                  <TeamRoute teams={teams} selectedTeamId={selectedTeamId} onUpdateTeam={handleUpdateTeam} onAddActivityLog={handleAddActivityLog} />
                </PrivateRoute>
              } />
              <Route path="/blockchain" element={
                <PrivateRoute allowedRoles={['team', 'judge', 'organizer']}>
                  <BlockchainExplorer teams={teams} />
                </PrivateRoute>
              } />
              <Route path="/judge" element={
                <PrivateRoute allowedRoles={['judge']}>
                  <JudgeDashboard teams={teams} selectedTeamId={selectedTeamId} onSelectTeam={setSelectedTeamId} onUpdateTeam={handleUpdateTeam} onAddActivityLog={handleAddActivityLog} />
                </PrivateRoute>
              } />
              <Route path="/organizer" element={
                <PrivateRoute allowedRoles={['organizer']}>
                  <OrganizerDashboard teams={teams} stats={stats} activityLogs={activityLogs} onRegisterTeam={handleRegisterTeam} onAddActivityLog={handleAddActivityLog} />
                </PrivateRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

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
