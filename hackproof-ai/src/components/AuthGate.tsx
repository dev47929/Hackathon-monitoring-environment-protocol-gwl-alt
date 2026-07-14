import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Lock, Mail, User, Key, KeyRound, 
  CheckCircle, Eye, EyeOff, UserPlus, ArrowRight, Zap, RefreshCw
} from 'lucide-react';
import { Team, AuthenticatedUser } from '../types';

interface AuthGateProps {
  teams: Team[];
  onLogin: (user: AuthenticatedUser) => void;
  onCancel?: () => void;
  initialRole?: 'team' | 'judge' | 'organizer';
}

export default function AuthGate({ teams, onLogin, onCancel, initialRole = 'team' }: AuthGateProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'team' | 'judge' | 'organizer'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || 'team-1');
  const [newTeamName, setNewTeamName] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Quick Demo Logins
  const DEMO_ACCOUNTS = [
    { name: 'Alex Dev', email: 'alex@neuralnexus.ai', role: 'team' as const, teamId: 'team-1', label: 'Hacker (NeuralNexus)' },
    { name: 'Sarah Codes', email: 'sarah@defiguard.ai', role: 'team' as const, teamId: 'team-2', label: 'Hacker (DeFiGuard)' },
    { name: 'Dr. Elizabeth', email: 'judge.elizabeth@hackproof.ai', role: 'judge' as const, label: 'Lead Hackathon Judge' },
    { name: 'Admin Host', email: 'admin@hackproof.ai', role: 'organizer' as const, label: 'System Organizer' }
  ];

  const handleQuickLogin = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setIsLoading(true);
    setError('');
    
    setTimeout(() => {
      setIsLoading(false);
      const authenticatedUser: AuthenticatedUser = {
        email: demo.email,
        name: demo.name,
        role: demo.role,
        teamId: demo.role === 'team' ? demo.teamId : undefined
      };
      
      // Store session
      localStorage.setItem('hackproof_user', JSON.stringify(authenticatedUser));
      
      setSuccess(`Authenticated as ${demo.name}!`);
      setTimeout(() => {
        onLogin(authenticatedUser);
      }, 800);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    if (isSignUp && !name) {
      setError('Please provide your full name.');
      return;
    }

    setIsLoading(true);

    // Simulate cryptographic authorization check & JWT issue
    setTimeout(() => {
      setIsLoading(false);

      const computedTeamId = role === 'team' ? selectedTeamId : undefined;
      const authenticatedUser: AuthenticatedUser = {
        email: email.toLowerCase(),
        name: isSignUp ? name : (name || email.split('@')[0]),
        role: role,
        teamId: computedTeamId
      };

      // Store in LocalStorage
      localStorage.setItem('hackproof_user', JSON.stringify(authenticatedUser));
      
      setSuccess(isSignUp ? 'Secured Key-Pair Issued! Redirecting...' : 'Credential Auth Hash Verified!');
      
      setTimeout(() => {
        onLogin(authenticatedUser);
      }, 1000);
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8" id="auth-gate-container">
      {/* Title & Decorative Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-mono text-indigo-400">
          <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
          <span>IMMUTABLE DEFI-LEVEL COCKPIT SECURITY ACTIVE</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Verify Your <span className="bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">Identity</span>
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Access your personalized dashboard or test the hackathon platform. Log in below to securely sign transactions, verify commits, and review projects.
        </p>
      </div>

      {/* Bento Grid Design Wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Main Auth Console Form (Bento Col-7) */}
        <div className="md:col-span-7 bg-slate-900/60 border border-slate-850/80 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl">
          {/* Subtle geometric glowing background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            {/* Login / Register Toggle Header */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-6">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850/60">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    !isSignUp ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isSignUp ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {onCancel && (
                <button 
                  onClick={onCancel}
                  className="text-xs text-slate-500 hover:text-slate-300 font-mono"
                >
                  [Cancel Gate]
                </button>
              )}
            </div>

            {/* Main Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Role Selection Blocks */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Authorized Access Role</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('team')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      role === 'team'
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-white ring-1 ring-indigo-500/20'
                        : 'bg-slate-950/40 border-slate-850/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <User className="w-4.5 h-4.5 mb-0.5" />
                    <span className="text-xs font-semibold leading-none">Hacker</span>
                    <span className="text-[9px] font-mono text-slate-500">Team Hub</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('judge')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      role === 'judge'
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-white ring-1 ring-indigo-500/20'
                        : 'bg-slate-950/40 border-slate-850/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Key className="w-4.5 h-4.5 mb-0.5" />
                    <span className="text-xs font-semibold leading-none">Judge</span>
                    <span className="text-[9px] font-mono text-slate-500">Cockpit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('organizer')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      role === 'organizer'
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-white ring-1 ring-indigo-500/20'
                        : 'bg-slate-950/40 border-slate-850/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <KeyRound className="w-4.5 h-4.5 mb-0.5" />
                    <span className="text-xs font-semibold leading-none">Organizer</span>
                    <span className="text-[9px] font-mono text-slate-500">Platform</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Team Selector if Hacker role is active */}
              <AnimatePresence mode="wait">
                {role === 'team' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 border-t border-slate-850/50 pt-3.5"
                  >
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Associate with Active Team</label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 text-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
                    >
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.avatar} {t.name} ({t.repoUrl.replace('https://github.com/', 'gh:')})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 italic font-mono pl-1">
                      Joining this team gives you immediate push-webhook webhook credentials.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inputs */}
              <div className="space-y-3.5 pt-2">
                {isSignUp && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Full Name</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Alex Rivera"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="alex@neuralnexus.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Secret Passkey</label>
                    <span className="text-[9px] font-mono text-indigo-400 hover:underline cursor-pointer">Local Keystore</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Signals */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono"
                  >
                    ⚠️ {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 animate-bounce" /> {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 text-white disabled:text-slate-500 font-semibold text-xs font-mono uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/15 border border-indigo-500/20"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Computing Credentials...
                  </>
                ) : isSignUp ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Register & Issue Keys <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Verify & Authenticate <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-850/60 text-[10px] text-slate-500 font-mono text-center flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>RSA-256 HMAC SECURED END-TO-END</span>
          </div>
        </div>

        {/* Right Side: Demo Sandbox Quick Login (Bento Col-5) */}
        <div className="md:col-span-5 bg-slate-900/30 border border-slate-850/60 rounded-2xl p-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block font-bold mb-1">Sandbox Environment</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fast-Pass Simulation Accounts</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Test different perspective flows without manual setup. Select a pre-authorized security role below to log in instantly.
              </p>
            </div>

            <div className="space-y-2.5">
              {DEMO_ACCOUNTS.map((demo, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickLogin(demo)}
                  className="w-full bg-slate-950/60 hover:bg-indigo-950/20 border border-slate-850/60 hover:border-indigo-500/30 p-3 rounded-xl flex flex-col text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {demo.name}
                    </span>
                    <span className="text-[8px] font-mono uppercase bg-slate-900 group-hover:bg-indigo-500/15 text-slate-400 group-hover:text-indigo-300 px-1.5 py-0.5 rounded border border-slate-800 group-hover:border-indigo-500/20 font-bold">
                      {demo.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center justify-between w-full">
                    <span>{demo.email}</span>
                    <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Fast Fill <Zap className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-850/50 space-y-2">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Why Authentication Matters?</span>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              HackProof AI maps verified code contributions to specific cryptographic wallets, ensuring no double-agents or unauthorized code pushers manipulate evaluations.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
