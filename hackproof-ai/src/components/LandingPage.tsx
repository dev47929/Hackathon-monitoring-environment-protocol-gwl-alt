import { motion } from 'motion/react';
import { Shield, GitCommit, Search, AlertCircle, Sparkles, Database, Mail, Trophy, Cpu, Flame, Users, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import ArchitectureFlow from './ArchitectureFlow';

interface LandingPageProps {
  onSelectRole: (role: 'team' | 'judge' | 'organizer') => void;
}

export default function LandingPage({ onSelectRole }: LandingPageProps) {
  const problems = [
    {
      title: 'Traditional Judging',
      icon: HelpCircle,
      color: 'text-red-400 border-red-950 bg-red-950/20',
      items: [
        'Only inspects the final code state or a pre-recorded video demo.',
        'No historical clarity: Teams can copy-paste full code blocks at the 40th hour.',
        'Plagiarism, templates, or purchased projects are easily disguised.',
        'Exaggerated presentation slides overstate what was actually implemented.',
        'Exhausted judges must manually inspect repositories in minutes.'
      ]
    },
    {
      title: 'HackProof AI Enabled',
      icon: Shield,
      color: 'text-emerald-400 border-emerald-950 bg-emerald-950/20',
      items: [
        'Continuous monitoring from the first git commit to final push.',
        'AI monitors incremental developer journeys, diffs, and commits.',
        'Blockchain certifies commit history, making force pushes instantly visible.',
        'AI verifies presentation claims with actual code file references.',
        'Judges receive a 1-click comprehensive report and custom interview Qs.'
      ]
    }
  ];

  const features = [
    {
      title: 'AI Dev Monitoring',
      icon: Cpu,
      description: 'Reads repository file diffs on every git push, generating automated code digests and tracking feature additions.'
    },
    {
      title: 'Blockchain Audit Layer',
      icon: Database,
      description: 'An immutable metadata log anchoring commit SHA hashes, timelines, and verification status on-chain to prevent git rewrite fraud.'
    },
    {
      title: 'Anomaly Detection Engine',
      icon: AlertCircle,
      description: 'Spots unusual habits: long silence followed by 10k lines, suspicious boilerplate copies, frequent rollbacks, or forced origin overrides.'
    },
    {
      title: 'Claim Match Verification',
      icon: Sparkles,
      description: 'Processes speech transcripts from team live presentations and cross-references claim concepts with physical code files in real-time.'
    },
    {
      title: 'AI Technical Interviewer',
      icon: Search,
      description: 'Creates highly tailored, project-specific technical questions for judges, focused on code pivot choices, auth setups, and API changes.'
    },
    {
      title: 'Instant Team Notifications',
      icon: Mail,
      description: 'Automated notification pipelines that flag unusual commit patterns, giving teams an early opportunity to submit explanations.'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20 max-w-4xl mx-auto space-y-6 px-4">

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-none"
        >
          Continuous, Transparent & Intelligent <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600 bg-clip-text text-transparent">
            Hackathon Evaluation
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
        >
          Don’t just judge a final slide deck. HackProof AI monitors continuous developer commits, 
          certifies histories on-chain, flags plagiarism anomalies, and verifies technical presentation claims in real time.
        </motion.p>

        {/* Core Quick Stats Ticker */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-indigo-950/40 border border-indigo-800/30 rounded-2xl p-5 text-left max-w-4xl mx-auto"
        >
          <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
            <div className="text-xs text-slate-500 font-mono tracking-wider uppercase">TRACKING STATUS</div>
            <div className="text-2xl font-bold text-emerald-400">ACTIVE</div>
          </div>
          <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/20 space-y-2">
            <div className="text-xs text-slate-500 font-mono tracking-wider uppercase">COMMIT LEDGER</div>
            <div className="text-2xl font-bold text-white">IMMUTABLE</div>
          </div>
          <div className="p-5 rounded-xl bg-teal-500/5 border border-teal-500/10 space-y-2">
            <div className="text-xs text-slate-500 font-mono tracking-wider uppercase">ANOMALIES RESOLVED</div>
            <div className="text-2xl font-bold text-teal-400">99.4%</div>
          </div>
          <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
            <div className="text-xs text-slate-500 font-mono tracking-wider uppercase">EVALUATION SPEED</div>
            <div className="text-2xl font-bold text-indigo-300">INSTANT</div>
          </div>
        </motion.div>

        {/* Call to Actions to Dashboards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
        >
          <button
            onClick={() => onSelectRole('judge')}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            Launch Judge Cockpit <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectRole('team')}
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            Enter Team Hub
          </button>
          <button
            onClick={() => onSelectRole('organizer')}
            className="px-6 py-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            Organizer Dashboard
          </button>
        </motion.div>
      </section>

      {/* Comparative Section: Traditional vs HackProof AI */}
      <section className="space-y-8 px-4 max-w-6xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">The Paradigm Shift</h2>
          <p className="text-sm text-slate-400 mt-1">Why traditional hackathon judging is vulnerable to exploits, and how we fix it.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {problems.map((prob, idx) => {
            const Icon = prob.icon;
            return (
              <div
                key={idx}
                className={`border rounded-2xl p-6 md:p-8 space-y-5 transition-all ${prob.color}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 rounded-xl">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{prob.title}</h3>
                </div>
                <ul className="space-y-3">
                  {prob.items.map((item, id) => (
                    <li key={id} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-slate-500 mt-1 font-mono">▪</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive System Flow Section */}
      <section className="px-4 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Interactive Platform Blueprint</h2>
          <p className="text-sm text-slate-400 mt-1">Click nodes to see how payloads route from Git commits to finalized judge scores.</p>
        </div>
        <ArchitectureFlow />
      </section>

      {/* Feature Grid Section */}
      <section className="space-y-8 px-4 max-w-6xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Powering Continuous Hackathons</h2>
          <p className="text-sm text-slate-400 mt-1">Our comprehensive security, monitoring, and verification services built on robust algorithms.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center mb-4 text-indigo-400 group-hover:text-indigo-300 group-hover:scale-105 transition-transform duration-200">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Playful Interactive Showcase Callout */}
      <section className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-8 max-w-5xl mx-auto text-center space-y-6 px-4">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
          <Trophy className="w-6 h-6 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl md:text-2xl font-bold text-white">Experience the Live Simulation</h3>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Ready to test? Swap roles anytime using the workspace header. Simulate commits, audit blockchain ledgers, 
            run mock audio presentation claims, and check how our AI spots force-pushes instantly.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onSelectRole('team')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-indigo-400 rounded-lg border border-slate-800 cursor-pointer"
          >
            ROLE: HACKER_TEAM
          </button>
          <button
            onClick={() => onSelectRole('judge')}
            className="px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-mono text-indigo-300 rounded-lg border border-indigo-500/20 cursor-pointer"
          >
            ROLE: HACKATHON_JUDGE
          </button>
          <button
            onClick={() => onSelectRole('organizer')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 rounded-lg border border-slate-800 cursor-pointer"
          >
            ROLE: ORGANIZER
          </button>
        </div>
      </section>
    </div>
  );
}
