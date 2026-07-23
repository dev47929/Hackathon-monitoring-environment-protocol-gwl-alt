import { motion } from 'motion/react';
import { Shield, GitCommit, Search, AlertCircle, Sparkles, Database, Mail, Trophy, Cpu, Flame, Users, CheckCircle2, ChevronRight, HelpCircle, Check, X } from 'lucide-react';
import ArchitectureFlow from './ArchitectureFlow';
import BorderGlow from '@/components/BorderGlow';
import DotField from '@/components/DotField';
import RotatingText from '@/components/RotatingText';
import Grainient from '@/components/Grainient';
import LineSidebar from '@/components/LineSidebar';

interface LandingPageProps {
  onSelectRole: (role: 'team' | 'judge' | 'organizer') => void;
}

export default function LandingPage({ onSelectRole }: LandingPageProps) {
  const problems = [
    {
      title: 'Traditional Judging',
      icon: HelpCircle,
      color: 'text-red-400 border-red-900/40',
      grainColors: { color1: '#450a0a', color2: '#7f1d1d', color3: '#18181b' },
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
      color: 'text-emerald-400 border-emerald-900/40',
      grainColors: { color1: '#064e3b', color2: '#047857', color3: '#092b20' },
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
    <div className="relative">
      <div className="fixed inset-0 w-screen h-screen z-0 pointer-events-none">
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={67}
          glowRadius={160}
          sparkle={false}
          waveAmplitude={0}
          cursorRadius={500}
          cursorForce={0.1}
          bulgeOnly
          gradientFrom="#155a94"
          gradientTo="#B497CF"
          glowColor="#120F17"
        />
      </div>
      <div className="relative z-10 space-y-16">
      {/* Hero Section — two-column layout */}
      <section className="py-4 md:py-8 space-y-10">

        {/* Top row: text left, video right */}
        <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16">

          {/* LEFT: Text & badge */}
          <div className="flex-1 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >

              <h1 className="text-3xl md:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Continuous, Transparent<br />&amp; Intelligent{' '}
                <span className="bg-gradient-to-r from-blue-300 via-indigo-400 to-indigo-600 bg-clip-text text-transparent">
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
            whileHover={{ scale: 1.03, y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex-1 w-full max-w-xl lg:max-w-none lg:mt-3 cursor-pointer"
          >
            <div className="relative aspect-video overflow-hidden rounded-2xl border-2 border-slate-700/60 bg-slate-950 shadow-2xl transition-all duration-300 hover:border-slate-500 hover:shadow-indigo-500/20 hover:shadow-2xl">
              <video
                className="absolute inset-0 w-full h-full object-cover rounded-[14px]"
                src="/make_a_video_with_zoom_in_zoom.webm"
                autoPlay
                loop
                muted
                playsInline
              />

              {/* Subtle grid overlay */}
              <div
                className="absolute inset-0 pointer-events-none rounded-[14px]"
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
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">The Paradigm Shift</h2>
          <p className="text-sm text-slate-400 mt-1">Why traditional hackathon judging is vulnerable to exploits, and how we fix it.</p>
        </div>

        {/* Detailed Breakdown: LineSidebar */}
        <div className="mt-8 flex justify-start pl-4 md:pl-8">
          <LineSidebar
            items={[
              '1. Inspection Depth',
              '2. Historical Clarity',
              '3. Fraud & Plagiarism',
              '4. Slide vs Implementation'
            ]}
            accentColor="#818cf8"
            textColor="#ffffff"
            markerColor="#64748b"
            defaultActive={null}
            itemGap={28}
            fontSize={1.15}
            maxShift={32}
          />
        </div>
      </section>

      {/* Interactive System Flow Section */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Interactive Platform Blueprint</h2>
          <p className="text-sm text-slate-400 mt-1">Click nodes to see how payloads route from Git commits to finalized judge scores.</p>
        </div>
        <ArchitectureFlow />
      </section>

      {/* Feature Grid Section */}
      <section className="space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2 flex-wrap">
            <span>Powering</span>
            <RotatingText
              texts={['Continuous Hackathons', 'Transparent Evaluation', 'Automated Code Audit', 'Fair Developer Judging']}
              mainClassName="px-3 py-1 bg-blue-600 text-white rounded-lg inline-flex items-center justify-center font-bold shadow-md shadow-blue-600/30"
              staggerFrom="first"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              staggerDuration={0.02}
              splitLevelClassName="overflow-hidden inline-flex"
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              rotationInterval={3000}
              splitBy="words"
              auto
              loop
            />
          </h2>
          <p className="text-sm text-slate-400 mt-2">Our comprehensive security, monitoring, and verification services built on robust algorithms.</p>
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
    </div>
  );
}
