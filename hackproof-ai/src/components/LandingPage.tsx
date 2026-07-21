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
      {/* Hero Section — two-column layout */}
      <section className="py-12 md:py-20 max-w-6xl mx-auto px-4 space-y-10">

        {/* Top row: text left, video right */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* LEFT: Text & badge */}
          <div className="flex-1 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-4">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                AI-Powered Hackathon Integrity
              </span>
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-tight">
                Continuous, Transparent<br />&amp; Intelligent{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600 bg-clip-text text-transparent">
                  Hackathon Evaluation
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-lg text-slate-400 max-w-lg leading-relaxed"
            >
              Don't just judge a final slide deck. HackProof AI monitors continuous developer commits,
              certifies histories on-chain, flags plagiarism anomalies, and verifies technical presentation claims in real time.
            </motion.p>

            {/* Feature bullets */}
            <motion.ul
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              {[
                'Continuous git commit monitoring',
                'Blockchain-certified audit trail',
                'AI anomaly & plagiarism detection',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  {item}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* RIGHT: Video placeholder box */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex-1 w-full max-w-xl lg:max-w-none"
          >
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/50 bg-slate-950 aspect-video">
              {/* Window chrome */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-slate-900 border-b border-slate-800 flex items-center px-3 gap-1.5 z-10">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                <span className="flex-1 mx-3 h-4 bg-slate-800 rounded-md" />
              </div>

              {/* Placeholder content — swap with <video> when ready */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 select-none">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-indigo-400 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-xs font-mono text-slate-500 tracking-wider">DEMO VIDEO</p>
                <p className="text-[10px] text-slate-600 mt-1">Video will be placed here</p>
              </div>

              {/* Subtle grid overlay */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />
            </div>
          </motion.div>

        </div>

        {/* Centered CTA buttons — below both columns */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={() => onSelectRole('judge')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            Launch Judge Cockpit <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectRole('team')}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            Enter Team Hub
          </button>
          <button
            onClick={() => onSelectRole('organizer')}
            className="px-6 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-white font-medium rounded-xl transition-all cursor-pointer"
          >
            Organizer
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


    </div>
  );
}
