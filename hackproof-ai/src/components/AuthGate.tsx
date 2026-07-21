import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Mail, User, Key, KeyRound, 
  CheckCircle, Eye, EyeOff, UserPlus, ArrowRight, RefreshCw
} from 'lucide-react';
import { AuthAPI, setStoredToken } from '../services/api';
import { Team, AuthenticatedUser } from '../types';

interface AuthGateProps {
  teams: Team[];
  onLogin: (user: AuthenticatedUser) => void;
  onCancel?: () => void;
  initialRole?: 'team' | 'judge' | 'organizer';
}

function decodeTokenPayload(token: string): { userId: string; role: string } | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function AuthGate({ teams, onLogin, onCancel, initialRole = 'team' }: AuthGateProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'team' | 'judge' | 'organizer'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [teamName, setTeamName] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
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

    if (isSignUp && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      let token: string;
      let userRole: string;
      let userName: string;

      if (isSignUp) {
        const res = await AuthAPI.register({
          email: email.toLowerCase(),
          name,
          password,
          role,
        });
        token = res.data.token;
        userRole = res.data.user.role;
        userName = res.data.user.name;
      } else {
        const res = await AuthAPI.login(email.toLowerCase(), password);
        token = res.data.token;
        userRole = res.data.user.role;
        userName = res.data.user.name;
      }

      setStoredToken(token);

      const decoded = decodeTokenPayload(token);
      const actualRole = (decoded?.role || userRole) as AuthenticatedUser['role'];

      let teamId: string | undefined;
      if (actualRole === 'team') {
        const matchedTeam = teams.find(t =>
          t.members.some(m =>
            m.toLowerCase().includes(email.toLowerCase().split('@')[0]) ||
            m.toLowerCase().includes(userName.toLowerCase().split(' ')[0])
          )
        );
        teamId = matchedTeam?.id;
      }

      const authenticatedUser: AuthenticatedUser = {
        email: email.toLowerCase(),
        name: userName,
        role: actualRole,
        teamId,
      };

      setSuccess(isSignUp ? 'Registration successful! Redirecting...' : 'Authentication successful!');
      setTimeout(() => onLogin(authenticatedUser), 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setError(message);
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8" id="auth-gate-container">
      {/* Title & Decorative Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Verify Your <span className="bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">Identity</span>
        </h2>
      </div>

      {/* Bento Grid Design Wrapper */}
      <div className="flex justify-center w-full">
        
        {/* Main Auth Console Form */}
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-850/80 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl">
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
                  onClick={() => { setIsSignUp(true); setRole('organizer'); setError(''); setSuccess(''); }}
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
              {!isSignUp ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Authorized Access Role</label>
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
              ) : (
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-mono font-bold text-slate-200">Organizer Registration Console</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                    Public signups are only allowed for event organizers. If you are a Hacker or a Judge, your login credentials will be generated by the organizer on their administration command panel.
                  </p>
                </div>
              )}



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

                {role === 'team' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Team Name</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. NeuralNexus"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
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
                    Authenticating...
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


        </div>

      </div>
    </div>
  );
}
