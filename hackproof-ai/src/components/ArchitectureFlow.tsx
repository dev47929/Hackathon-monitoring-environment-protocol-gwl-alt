import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code2, GitFork, Bot, Database, ShieldAlert, Terminal, ArrowRight, Layers, FileText } from 'lucide-react';
import Grainient from '@/components/Grainient';

interface Step {
  id: string;
  title: string;
  icon: any;
  color: string;
  description: string;
  details: string[];
}

export default function ArchitectureFlow() {
  const [activeStep, setActiveStep] = useState<string>('ai-engine');

  const steps: Step[] = [
    {
      id: 'developer',
      title: '1. Developer Action',
      icon: Code2,
      color: 'from-blue-500 to-indigo-500',
      description: 'Developers commit and push code changes directly to their GitHub repository.',
      details: [
        'Developer runs: git commit -am "Added user registration" && git push',
        'Traditional systems lose this step (only final state remains)',
        'HackProof AI captures the push metadata instantly'
      ]
    },
    {
      id: 'webhooks',
      title: '2. GitHub Webhook',
      icon: GitFork,
      color: 'from-purple-500 to-pink-500',
      description: 'GitHub fires a secure real-time payload containing commit hashes, authors, and file diffs.',
      details: [
        'Payload arrives at /api/webhooks/github within milliseconds',
        'Verifies webhook cryptographic signature for absolute security',
        'Extracts precise unified diff of all changed lines'
      ]
    },
    {
      id: 'ai-engine',
      title: '3. AI Monitoring Engine',
      icon: Bot,
      color: 'from-amber-500 to-orange-500',
      description: 'The core AI parsing layer reviews file changes, generates summaries, and updates the knowledge graph.',
      details: [
        'Code Summarization: Translates complex diffs into human logs',
        'Feature Evolution: Maps commits to functional features (e.g. JWT Auth)',
        'Pattern Scanner: Detects anomalous behavior (force push, huge copy-pastes)',
        'No source code is stored to protect intellectual property'
      ]
    },
    {
      id: 'blockchain',
      title: '4. Blockchain Audit Layer',
      icon: Layers,
      color: 'from-emerald-500 to-teal-500',
      description: 'Commit metadata, AI hashes, and status receipts are securely anchored onto an immutable ledger.',
      details: [
        'Anchors metadata: Commit SHA, timestamp, contributor, risk score',
        'Creates an tamper-proof, immutable audit record of progress',
        'Failed checks flag rollbacks, force pushes, or rewritten history',
        'Ensures total evaluation transparency'
      ]
    },
    {
      id: 'database',
      title: '5. Relational Cache',
      icon: Database,
      color: 'from-cyan-500 to-blue-600',
      description: 'Saves cached views for the web application dashboard enabling instant searching and filtering.',
      details: [
        'Indexes verified timelines for high-performance reading',
        'Updates overall hacker risk scores on the fly',
        'Maintains notification queues for team alerts'
      ]
    },
    {
      id: 'judge-dash',
      title: '6. Judge & Org cockpit',
      icon: FileText,
      color: 'from-rose-500 to-red-500',
      description: 'Judges view complete development stories, run live presentation checks, and export certified reports.',
      details: [
        'Chronological timeline reconstructs the entire 48hr build journey',
        'Generates customized technical interview questions',
        'Matches speech claims against actual repository code references',
        'Produces an objective, automated 1-click evaluation scorecard'
      ]
    }
  ];

  const activeStepData = steps.find(s => s.id === activeStep) || steps[2];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8" id="architecture-flow-section">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
            How HackProof AI Works
          </h3>
        </div>
      </div>

      {/* Interactive Node Map */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8 relative">
        {/* Connection line helper behind nodes on desktop */}
        <div className="hidden md:block absolute top-12 left-8 right-8 h-0.5 bg-slate-800 z-0"></div>

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.id === activeStep;

          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`relative z-10 flex flex-col items-center p-4 rounded-xl border transition-all text-center group cursor-pointer ${
                isActive
                  ? 'bg-slate-950 border-slate-700 shadow-xl shadow-slate-950/50'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/40'
              }`}
            >
              {/* Dynamic pulse background on active */}
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-slate-800/10 to-slate-950/10 pointer-events-none" />
              )}

              {/* Number Bubble */}
              <div className="text-[10px] font-mono text-slate-500 mb-2">
                STEP 0{idx + 1}
              </div>

              {/* Icon Bubble */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${step.color} text-white shadow-lg shadow-slate-900/40 transition-transform group-hover:scale-105 duration-200`}>
                <Icon className="w-6 h-6" />
              </div>

              <div className="mt-3">
                <h4 className={`text-xs font-medium tracking-tight transition-colors ${isActive ? 'text-white font-semibold' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {step.title.split('. ')[1]}
                </h4>
              </div>

              {/* Active Arrow Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeArrow"
                  className="absolute -bottom-2 w-4 h-4 bg-slate-950 border-r border-b border-slate-700 rotate-45"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Interactive Detail Panel with Grainient Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative overflow-hidden border border-slate-800 rounded-xl p-5 md:p-6 shadow-2xl"
        >
          {/* Grainient Background for Elaboration Box */}
          <div className="absolute inset-0 pointer-events-none opacity-80 -z-0">
            <Grainient
              color1="#03131a"
              color2="#104e63"
              color3="#076085"
              timeSpeed={0.25}
              grainAmount={0.08}
              grainScale={1.5}
              contrast={1.6}
            />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row gap-6">
            {/* Left summary info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${activeStepData.color} text-white shadow-md`}>
                  <activeStepData.icon className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-white">
                  {activeStepData.title}
                </h4>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed mb-4">
                {activeStepData.description}
              </p>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-4">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>INTEGRATION PROTOCOL // STATUS: SECURE</span>
              </div>
            </div>

            {/* Right bullet executions */}
            <div className="flex-1 bg-slate-950/70 border border-slate-800/60 rounded-lg p-4 backdrop-blur-md">
              <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-3 font-semibold">
                Execution Steps
              </div>
              <ul className="space-y-2.5">
                {activeStepData.details.map((detail, dIdx) => (
                  <li key={dIdx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                    <span className="text-indigo-400 font-mono mt-0.5">✔</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
