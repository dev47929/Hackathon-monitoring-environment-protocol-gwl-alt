import { useState, useEffect } from 'react';
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
  const [hoveredSidebarIndex, setHoveredSidebarIndex] = useState<number>(0);

  const paradigmCards = [
    {
      title: 'Inspection Depth',
      icon: '🔍',
      traditional: 'Only inspects the final code state or a pre-recorded video demo submitted at the deadline.',
      solution: 'Continuous real-time monitoring from the very first git commit all the way to the final push — every diff tracked.'
    },
    {
      title: 'Historical Clarity',
      icon: '📜',
      traditional: 'No historical clarity: teams can copy-paste 10,000 lines at the 40th hour without any detection.',
      solution: 'AI tracks incremental developer journeys, commit cadence, author signatures, and velocity patterns over time.'
    },
    {
      title: 'Fraud & Plagiarism',
      icon: '🔐',
      traditional: 'Plagiarism, pre-built templates, or purchased projects are easily disguised in a final submission.',
      solution: 'Blockchain certifies commit SHA histories, making force-pushes and origin rewrites instantly visible and flagged.'
    },
    {
      title: 'Slide vs Implementation',
      icon: '🎯',
      traditional: 'Exaggerated presentation slides overstate what was actually implemented, judges have no way to verify.',
      solution: 'AI cross-references live presentation speech claims against actual code file references in real time.'
    }
  ];

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
    <div className="relative overflow-x-hidden min-h-screen">
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
      <div className="relative z-10 space-y-12 md:space-y-16 lg:space-y-24 px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto py-1 sm:py-2">
      {/* Hero Section — two-column layout */}
      <section className="py-0 space-y-8 sm:space-y-10">

        {/* Top row: text left, video right */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 sm:gap-10 lg:gap-12">

          {/* LEFT: Text & badge */}
          <div className="flex-1 space-y-4 sm:space-y-6 text-left w-full">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-extrabold text-white tracking-tight leading-[1.15] w-full">
                <span className="whitespace-nowrap">Continuous, Transparent</span> &amp; Intelligent{' '}
                <span className="bg-gradient-to-r from-blue-300 via-indigo-400 to-indigo-500 bg-clip-text text-transparent block mt-1.5">
                  Hackathon Evaluation
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-base md:text-lg text-slate-300 max-w-lg leading-relaxed"
            >
              Beyond pitch decks: Real-time commit tracking, on-chain audit trails, and instant AI verification for fair hackathon judging.
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
                <li key={item} className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                  <span>{item}</span>
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
            <div className="relative aspect-video overflow-hidden rounded-xl sm:rounded-2xl border-2 border-slate-700/60 bg-slate-950 shadow-2xl transition-all duration-300 hover:border-slate-500 hover:shadow-indigo-500/20 hover:shadow-2xl">
              <video
                className="absolute inset-0 w-full h-full object-cover rounded-[12px] sm:rounded-[14px]"
                src="/make_a_video_with_zoom_in_zoom.webm"
                autoPlay
                loop
                muted
                playsInline
              />

              {/* Subtle grid overlay */}
              <div
                className="absolute inset-0 pointer-events-none rounded-[12px] sm:rounded-[14px]"
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
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto mt-8 sm:mt-12"
        >
          <button
            onClick={() => onSelectRole('judge')}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer text-sm sm:text-base"
          >
            Launch Judge Cockpit <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectRole('team')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm sm:text-base"
          >
            Enter Team Hub
          </button>
          <button
            onClick={() => onSelectRole('organizer')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-white font-medium rounded-xl transition-all cursor-pointer text-sm sm:text-base"
          >
            Organizer
          </button>
        </motion.div>

      </section>


      {/* Comparative Section: Traditional vs HackProof AI */}
      <section className="space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">The Paradigm Shift</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Why traditional hackathon judging is vulnerable to exploits, and how we fix it.</p>
        </div>

        {/* LineSidebar + explanation card side by side */}
        <div className="mt-6 sm:mt-8 flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 pl-2 sm:pl-4 md:pl-8">
          {/* Left: LineSidebar */}
          <div className="shrink-0 flex items-center border border-slate-800/60 rounded-2xl px-8 py-6 bg-slate-900/40">
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
              defaultActive={0}
              itemGap={28}
              fontSize={1.05}
              maxShift={28}
              onHover={(idx) => { if (idx !== null) setHoveredSidebarIndex(idx); }}
            />
          </div>

          {/* Right: Explanation card — animates on hover */}
          <div className="flex-1 min-w-0 relative" style={{ minHeight: '300px' }}>
            {paradigmCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={false}
                animate={{
                  opacity: hoveredSidebarIndex === idx ? 1 : 0,
                  y: hoveredSidebarIndex === idx ? 0 : 12,
                  scale: hoveredSidebarIndex === idx ? 1 : 0.97,
                  pointerEvents: hoveredSidebarIndex === idx ? 'auto' : 'none'
                }}
                transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                className="absolute inset-0 rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-6 flex flex-col gap-4 overflow-hidden"
              >
                {/* Background image only for card index 2 (Fraud & Plagiarism) */}
                {idx === 2 && (
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      backgroundImage: 'url(/blockchain_bg.png)',
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center center',
                      opacity: 0.35,
                      filter: 'blur(1.5px)',
                    }}
                  />
                )}
                {/* Dark overlay to keep text readable */}
                {idx === 2 && (
                  <div className="absolute inset-0 rounded-2xl bg-slate-900/50" />
                )}

                <div className="relative flex items-center gap-3">
                  <span className="text-2xl">{card.icon}</span>
                  <h3 className="text-base sm:text-lg font-bold text-white">{card.title}</h3>
                </div>
                <div className="relative space-y-3">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-red-400 mt-0.5 text-xs font-bold uppercase tracking-wider shrink-0">Traditional</span>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{card.traditional}</p>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-indigo-400 mt-0.5 text-xs font-bold uppercase tracking-wider shrink-0">HackProof</span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{card.solution}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive System Flow Section */}
      <section>
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">Interactive Platform Blueprint</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Click nodes to see how payloads route from Git commits to finalized judge scores.</p>
        </div>
        <ArchitectureFlow />
      </section>

      {/* Feature Grid Section */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2 flex-wrap">
            <span>Powering</span>
            <RotatingText
              texts={['Continuous Hackathons', 'Transparent Evaluation', 'Automated Code Audit', 'Fair Developer Judging']}
              mainClassName="px-2.5 sm:px-3 py-1 bg-blue-600 text-white rounded-lg inline-flex items-center justify-center font-bold shadow-md shadow-blue-600/30 text-base sm:text-lg md:text-2xl"
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
          <p className="text-xs sm:text-sm text-slate-400 mt-2">Our comprehensive security, monitoring, and verification services built on robust algorithms.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all duration-300 shadow-lg hover:shadow-indigo-500/10 hover:shadow-2xl cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center mb-4 text-indigo-400 group-hover:text-indigo-300 group-hover:scale-110 transition-transform duration-200 shadow-md">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  {feat.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>


    </div>
    </div>
  );
}
