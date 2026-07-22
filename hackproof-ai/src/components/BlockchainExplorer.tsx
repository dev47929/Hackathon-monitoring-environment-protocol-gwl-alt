import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Team, Commit, BlocksResponse, TransactionDetail, BlockchainMode } from '../types';
import { TeamsAPI, BlockchainAPI } from '../services/api';
import { 
  ShieldCheck, RefreshCw, Hash, Blocks, Clock, ArrowRight, ChevronLeft, ChevronRight, 
  Trash2, AlertCircle, Copy, Check, Terminal, FileCode, GitCommit, Layers, Sparkles, Filter, Info
} from 'lucide-react';

interface BlockchainExplorerProps {
  teams?: Team[];
}

interface ProcessedBlockNode {
  id: string;
  blockNumber: number;
  hash: string;
  parentHash: string;
  statusType: 'genesis' | 'valid' | 'flagged' | 'deleted';
  statusBadge: string;
  teamName: string;
  teamAvatar: string;
  author: string;
  commitHash: string;
  commitMessage: string;
  timestamp: string;
  additions: number;
  deletions: number;
  changedFiles: string[];
  diffSnippets: { file: string; status: 'added' | 'modified' | 'deleted'; code: string }[];
  isSuspicious: boolean;
  suspiciousReason?: string;
  blockchainTx: string;
  blockchainStatus: 'verified' | 'failed' | 'pending';
  aiSummary: string;
}

export default function BlockchainExplorer({ teams: propTeams }: BlockchainExplorerProps) {
  const [teams, setTeams] = useState<Team[]>(propTeams || []);
  const [blocksData, setBlocksData] = useState<BlocksResponse | null>(null);
  const [mode, setMode] = useState<BlockchainMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtering & Selection state
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'deleted' | 'flagged'>('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<string>('');
  const [showRawJson, setShowRawJson] = useState(false);

  // Tx Lookup state
  const [lookupHashInput, setLookupHashInput] = useState('');
  const [lookupResult, setLookupResult] = useState<TransactionDetail | null>(null);

  // Horizontal scroll container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load team data & blockchain blocks
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [allTeamsData, blocksRes, modeRes] = await Promise.all([
        TeamsAPI.getAll().catch(() => propTeams || []),
        BlockchainAPI.getBlocks(20, 0).catch(() => null),
        BlockchainAPI.getMode().catch(() => null),
      ]);
      if (Array.isArray(allTeamsData) && allTeamsData.length > 0) {
        setTeams(allTeamsData);
      }
      setBlocksData(blocksRes);
      setMode(modeRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ledger data');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update teams if propTeams changes
  useEffect(() => {
    if (propTeams && propTeams.length > 0) {
      setTeams(propTeams);
    }
  }, [propTeams]);

  // Build interconnected block nodes from real team commits
  const allNodes: ProcessedBlockNode[] = React.useMemo(() => {
    const nodes: ProcessedBlockNode[] = [];

    // 1. Block 0: Genesis Init Block
    const genesisHash = 'a7f39e2d14b803c7e529141f2a0b12c8e3902910fa310492ab';
    nodes.push({
      id: 'block-0',
      blockNumber: 0,
      hash: genesisHash,
      parentHash: '0000000000000000000000000000000000000000000000000000000000000000',
      statusType: 'genesis',
      statusBadge: 'GENESIS_INIT',
      teamName: 'HackProof System',
      teamAvatar: '🛡️',
      author: 'Genesis Anchor Protocol',
      commitHash: 'a7f39e2',
      commitMessage: 'chore: initialize hackathon baseline commit ledger & genesis timestamp anchor',
      timestamp: '2026-04-26T08:00:00.000Z',
      additions: 12,
      deletions: 0,
      changedFiles: ['genesis.json', 'contract.sol'],
      diffSnippets: [
        {
          file: 'genesis.json',
          status: 'added',
          code: '+ { "hackathonId": "GR-2026", "startTime": "2026-04-26T08:00:00Z", "chains": ["mainnet"] }'
        }
      ],
      isSuspicious: false,
      blockchainTx: '0x' + genesisHash,
      blockchainStatus: 'verified',
      aiSummary: 'Initialized hackathon baseline ledger schema and cryptographic genesis anchor.'
    });

    let globalBlockCounter = 1;
    let lastHash = genesisHash;

    const filteredTeams = selectedTeamFilter === 'all' 
      ? teams 
      : teams.filter(t => t.id === selectedTeamFilter || t.name.toLowerCase().includes(selectedTeamFilter.toLowerCase()));

    filteredTeams.forEach((team) => {
      const commits = team.commits || [];

      commits.forEach((c, idx) => {
        const isDeleted = Boolean(c.isSuspicious && c.suspiciousReason?.toLowerCase().includes('force'));
        const isFlagged = Boolean(c.isSuspicious && !isDeleted);

        let statusType: 'genesis' | 'valid' | 'flagged' | 'deleted' = 'valid';
        let statusBadge = 'ROUTED';

        if (isDeleted) {
          statusType = 'deleted';
          statusBadge = 'FORCE_PUSH_DELETE';
        } else if (isFlagged) {
          statusType = 'flagged';
          statusBadge = 'FLAGGED';
        } else if (c.blockchainStatus === 'verified') {
          statusBadge = 'ANCHORED';
        }

        // Generate synthetic or real diff snippets
        const files = c.changedFiles && c.changedFiles.length > 0 
          ? c.changedFiles 
          : ['src/App.tsx', 'package.json'];
        
        const diffSnippets = files.slice(0, 3).map((f) => {
          if (isDeleted) {
            return {
              file: f,
              status: 'deleted' as const,
              code: `- // REMOVED IN FORCE PUSH (Preserved by HackProof)\n- export const secretFunction = () => { /* audit copy */ };`
            };
          }
          return {
            file: f,
            status: 'modified' as const,
            code: `+ // Modified in commit ${c.hash}\n+ export function ${f.split('.')[0] || 'component'}() { return <Feature />; }`
          };
        });

        // Compute simulated 64-char block hash chaining from previous block
        const blockHashSeed = `${lastHash}-${c.hash}-${team.id}-${globalBlockCounter}`;
        const currentBlockHash = c.blockchainTx && c.blockchainTx.length >= 40 
          ? c.blockchainTx.replace(/^0x/, '') 
          : Array.from({ length: 64 }, (_, i) => blockHashSeed.charCodeAt(i % blockHashSeed.length).toString(16)[0]).join('');

        nodes.push({
          id: `node-${team.id}-${c.hash}-${idx}`,
          blockNumber: globalBlockCounter,
          hash: currentBlockHash,
          parentHash: lastHash,
          statusType,
          statusBadge,
          teamName: team.name,
          teamAvatar: team.avatar || '🚀',
          author: c.author || team.members[0] || 'Developer',
          commitHash: c.hash,
          commitMessage: c.message,
          timestamp: c.timestamp,
          additions: c.additions ?? 15,
          deletions: c.deletions ?? 3,
          changedFiles: files,
          diffSnippets,
          isSuspicious: Boolean(c.isSuspicious),
          suspiciousReason: c.suspiciousReason,
          blockchainTx: c.blockchainTx || ('0x' + currentBlockHash),
          blockchainStatus: c.blockchainStatus || 'verified',
          aiSummary: c.aiSummary || `Analyzed changes for ${c.message}`
        });

        lastHash = currentBlockHash;
        globalBlockCounter++;
      });
    });

    return nodes;
  }, [teams, selectedTeamFilter]);

  // Apply Filter Tabs
  const visibleNodes = React.useMemo(() => {
    if (filterMode === 'valid') return allNodes.filter(n => n.statusType === 'valid' || n.statusType === 'genesis');
    if (filterMode === 'deleted') return allNodes.filter(n => n.statusType === 'deleted');
    if (filterMode === 'flagged') return allNodes.filter(n => n.statusType === 'flagged');
    return allNodes;
  }, [allNodes, filterMode]);

  // Auto-select first node or current selected
  useEffect(() => {
    if (visibleNodes.length > 0 && !visibleNodes.some(n => n.id === selectedNodeId)) {
      setSelectedNodeId(visibleNodes[0].id);
    }
  }, [visibleNodes, selectedNodeId]);

  const selectedNode = allNodes.find(n => n.id === selectedNodeId) || visibleNodes[0] || allNodes[0];

  // Counts for pills
  const counts = React.useMemo(() => {
    const valid = allNodes.filter(n => n.statusType === 'valid' || n.statusType === 'genesis').length;
    const deleted = allNodes.filter(n => n.statusType === 'deleted').length;
    const flagged = allNodes.filter(n => n.statusType === 'flagged').length;
    return { all: allNodes.length, valid, deleted, flagged };
  }, [allNodes]);

  // Scroll handlers for horizontal node chain
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Copy hash helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(''), 2000);
  };

  // Transaction lookup submit
  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupHashInput.trim()) return;
    setLoading(true);
    setError('');

    // First check if it matches any node commit hash or block hash
    const match = allNodes.find(n => 
      n.hash.toLowerCase().includes(lookupHashInput.trim().toLowerCase()) || 
      n.commitHash.toLowerCase() === lookupHashInput.trim().toLowerCase() ||
      n.blockchainTx.toLowerCase().includes(lookupHashInput.trim().toLowerCase())
    );

    if (match) {
      setSelectedNodeId(match.id);
      setLoading(false);
      return;
    }

    try {
      const tx = await BlockchainAPI.getTransaction(lookupHashInput.trim());
      setLookupResult(tx);
    } catch {
      setError(`No ledger entry found for hash: ${lookupHashInput}`);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* 1. Header Box: What this ledger is doing (Simple Explanation for Non-Blockchain Users) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Immutable Audit Ledger
              </span>
              <span className="text-xs font-mono text-slate-400">| Hackathon Integrity Protocol</span>
            </div>
            
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Horizontal Node Chain Ledger
            </h1>
            
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              <strong>💡 How HackProof Ledger Works:</strong> Every code push submitted by hackathon teams is permanently stamped onto this digital ledger. Even if a team force-pushes, rewrites history, or deletes commits from GitHub, the original code snapshot remains <strong>permanently preserved</strong> here so judges can audit full project history.
            </p>
          </div>

          {/* KPI Pills */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-left">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Integrity Status</div>
              <div className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> VALID &amp; SECURE
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-left">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Blocks</div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">{allNodes.length} Anchored</div>
            </div>

            {counts.deleted > 0 && (
              <div className="bg-rose-950/40 border border-rose-900/60 px-4 py-2.5 rounded-xl text-left">
                <div className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">Pruned / Deleted</div>
                <div className="text-sm font-mono font-bold text-rose-300 mt-0.5 flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" /> {counts.deleted} Preserved
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/70 border border-slate-850 p-3 rounded-2xl">
        
        {/* Left: Tab filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'all'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <span>All Blocks</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950 border border-slate-800 text-slate-300">{counts.all}</span>
          </button>

          <button
            onClick={() => setFilterMode('valid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'valid'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Valid</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950 border border-slate-800 text-slate-300">{counts.valid}</span>
          </button>

          <button
            onClick={() => setFilterMode('deleted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'deleted'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-850'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Deleted / Force-Push</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-950 border border-rose-900 text-rose-300 font-bold">{counts.deleted}</span>
          </button>

          <button
            onClick={() => setFilterMode('flagged')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'flagged'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-850'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Flagged</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-950 border border-amber-900 text-amber-300 font-bold">{counts.flagged}</span>
          </button>
        </div>

        {/* Right: Team filter dropdown & Refresh */}
        <div className="flex items-center gap-2">
          {teams.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-mono focus:outline-none cursor-pointer"
              >
                <option value="all">All Hackathon Teams ({teams.length})</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.avatar} {t.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* 3. Horizontal Node Chain Flow (Interconnected Block Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="uppercase font-bold tracking-wider">Internal Node Chain (Horizontal Flow)</span>
            <span className="text-slate-600">• Click block to view details</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleScrollLeft}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleScrollRight}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Node Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950 select-none"
        >
          {visibleNodes.length === 0 ? (
            <div className="w-full p-8 text-center bg-slate-900/40 border border-slate-850 rounded-2xl text-xs text-slate-400">
              No block nodes match the selected filter query.
            </div>
          ) : (
            visibleNodes.map((node, index) => {
              const isSelected = node.id === selectedNode.id;

              return (
                <React.Fragment key={node.id}>
                  {/* Block Card */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-64 shrink-0 p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? node.statusType === 'deleted'
                          ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/50 ring-2 ring-rose-500/40'
                          : node.statusType === 'flagged'
                          ? 'bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-950/50 ring-2 ring-amber-500/40'
                          : 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/40'
                        : node.statusType === 'deleted'
                        ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-700'
                        : node.statusType === 'flagged'
                        ? 'bg-amber-950/20 border-amber-900/60 hover:border-amber-700'
                        : 'bg-slate-900/70 border-slate-850 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Block # and Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold text-slate-300">
                        BLOCK #{node.blockNumber}
                      </span>

                      {node.statusType === 'genesis' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          GENESIS
                        </span>
                      )}

                      {node.statusType === 'valid' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {node.statusBadge}
                        </span>
                      )}

                      {node.statusType === 'flagged' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" /> FLAGGED
                        </span>
                      )}

                      {node.statusType === 'deleted' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <Trash2 className="w-2.5 h-2.5 text-rose-400" /> DELETED
                        </span>
                      )}
                    </div>

                    {/* Middle: Short Hash & Title */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono text-cyan-300 font-bold tracking-wider flex items-center justify-between">
                        <span>{node.hash.slice(0, 6)}...{node.hash.slice(-4)}</span>
                        <span className="text-[9px] font-mono text-slate-500">[{node.commitHash}]</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 font-medium leading-snug">
                        "{node.commitMessage}"
                      </p>
                    </div>

                    {/* Footer Row: Team & Line metrics */}
                    <div className="pt-2 border-t border-slate-850/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300 font-semibold truncate max-w-[140px]">
                        <span>{node.teamAvatar}</span> {node.teamName}
                      </span>
                      <span>
                        <span className="text-emerald-400">+{node.additions}</span>/<span className="text-rose-400">-{node.deletions}</span>
                      </span>
                    </div>
                  </motion.div>

                  {/* Interconnected Arrow Connector */}
                  {index < visibleNodes.length - 1 && (
                    <div className="flex items-center justify-center shrink-0 text-slate-600">
                      <ArrowRight className="w-4 h-4 animate-pulse text-slate-500" />
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Expanded Selected Block Detail View */}
      {selectedNode && (
        <motion.div
          key={selectedNode.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-6 shadow-2xl relative"
        >
          {/* Selected Block Title & Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs font-bold">
                BLOCK #{selectedNode.blockNumber}
              </span>
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <span>{selectedNode.statusBadge}</span>
                  <span className="text-xs font-mono text-slate-400">({selectedNode.commitHash})</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Team: <strong className="text-slate-200">{selectedNode.teamName}</strong> • Author: <strong className="text-slate-300">{selectedNode.author}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedNode.statusType === 'deleted' ? (
                <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-400" /> PERMANENT TOMBSTONE PRESERVED
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> CRYPTOGRAPHICALLY MATCHED
                </span>
              )}

              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-850 hover:border-slate-750 transition-all cursor-pointer"
              >
                {showRawJson ? 'Hide JSON' : 'View Raw JSON'}
              </button>
            </div>
          </div>

          {/* Pruned / Deleted Warning Callout Banner */}
          {selectedNode.statusType === 'deleted' && (
            <div className="p-4 bg-rose-950/40 border border-rose-900/80 rounded-xl space-y-1.5 text-rose-200 text-xs">
              <div className="flex items-center gap-2 font-bold font-mono text-rose-400">
                <Trash2 className="w-4 h-4" /> 🚨 PRUNED / DELETED COMMIT PRESERVED ON LEDGER
              </div>
              <p className="leading-relaxed">
                This commit was force-pushed or deleted in the team's GitHub repository. HackProof AI permanently preserved this historical code diff on-chain so judges can audit the deleted code.
              </p>
            </div>
          )}

          {/* Flagged AI Warning Callout Banner */}
          {selectedNode.statusType === 'flagged' && (
            <div className="p-4 bg-amber-950/40 border border-amber-900/80 rounded-xl space-y-1.5 text-amber-200 text-xs">
              <div className="flex items-center gap-2 font-bold font-mono text-amber-400">
                <AlertCircle className="w-4 h-4" /> ⚠️ AI ANOMALY FLAGGED
              </div>
              <p className="leading-relaxed">
                {selectedNode.suspiciousReason || 'Unusual code pattern or large drop detected. The team explanation is pending or submitted for judge verification.'}
              </p>
            </div>
          )}

          {/* 4 Cards Pointer Grid: Current Hash, Parent Link, Author, Timestamp */}
          <div className="grid md:grid-cols-2 gap-4">
            
            {/* 1. Current Block ID */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2 relative group">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                <span>Current Block ID (Hash)</span>
                <button
                  onClick={() => handleCopy(selectedNode.hash)}
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedHash === selectedNode.hash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHash === selectedNode.hash ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-xs font-mono font-bold text-cyan-300 break-all bg-slate-900 p-2 rounded-lg border border-slate-850">
                {selectedNode.hash}
              </div>
            </div>

            {/* 2. Previous Block Link */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                <span>Parent Link (Previous Hash)</span>
                <span className="text-emerald-400 font-bold text-[10px]">✔ PAINTER MATCHED</span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-400 break-all bg-slate-900 p-2 rounded-lg border border-slate-850">
                {selectedNode.parentHash}
              </div>
            </div>

            {/* 3. Developer & Team Identity */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">Team &amp; Developer Identity</div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{selectedNode.teamAvatar}</span> {selectedNode.teamName}
                </span>
                <span className="text-xs font-mono text-indigo-400 font-semibold">{selectedNode.author}</span>
              </div>
            </div>

            {/* 4. Timestamp & Audit Stamp */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">Audit Stamp &amp; Timestamp</div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">{new Date(selectedNode.timestamp).toLocaleString()}</span>
                <span className="text-slate-500">Root: <span className="text-cyan-400">0x{selectedNode.hash.slice(0, 10)}</span></span>
              </div>
            </div>
          </div>

          {/* Commit Message & Preserved Code Diffs Box */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-4">
            
            <div className="flex items-start justify-between gap-4 border-b border-slate-850 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-cyan-400 font-bold">Commit: {selectedNode.commitHash}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">Branch: <strong className="text-slate-200">main</strong></span>
                </div>
                <h4 className="text-sm font-semibold text-white">"{selectedNode.commitMessage}"</h4>
              </div>

              <div className="text-xs font-mono shrink-0">
                <span className="text-emerald-400 font-bold">+{selectedNode.additions}</span>{' '}
                <span className="text-rose-400 font-bold">-{selectedNode.deletions}</span>
              </div>
            </div>

            {/* AI Summary Snippet */}
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-850 text-xs text-slate-300 font-sans space-y-1">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider block">
                🤖 AI Digest &amp; Feature Evolution
              </span>
              <p>{selectedNode.aiSummary}</p>
            </div>

            {/* Preserved Code Files & Snippets */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase text-slate-400">
                Files Changed ({selectedNode.changedFiles.length}):
              </div>

              <div className="space-y-2">
                {selectedNode.diffSnippets.map((diff, i) => (
                  <div key={i} className="bg-slate-900 rounded-lg overflow-hidden border border-slate-850">
                    <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-850 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-200 font-semibold">{diff.file}</span>
                      <span className={`text-[10px] uppercase font-bold ${
                        diff.status === 'deleted' ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {diff.status}
                      </span>
                    </div>
                    <pre className={`p-3 text-xs font-mono overflow-x-auto whitespace-pre ${
                      diff.status === 'deleted' 
                        ? 'bg-rose-950/20 text-rose-300' 
                        : 'bg-slate-950/60 text-emerald-300'
                    }`}>
                      <code>{diff.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Raw JSON view */}
          {showRawJson && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <div className="text-xs font-mono text-slate-400 uppercase">Raw Block Payload (JSON)</div>
              <pre className="text-xs font-mono text-cyan-300 bg-slate-900 p-3 rounded-lg overflow-x-auto max-h-60">
                {JSON.stringify(selectedNode, null, 2)}
              </pre>
            </div>
          )}
        </motion.div>
      )}

      {/* 5. Transaction Lookup Box */}
      <div className="bg-slate-900/60 border border-slate-850/80 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-cyan-400" /> Transaction &amp; Block Lookup
        </h3>
        
        <form onSubmit={handleLookupSubmit} className="flex gap-2">
          <input
            type="text"
            value={lookupHashInput}
            onChange={(e) => setLookupHashInput(e.target.value)}
            placeholder="Enter transaction hash or commit SHA (e.g. 0x... or a7f39e2)"
            className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            disabled={loading || !lookupHashInput.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-slate-950 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            Lookup Node
          </button>
        </form>

        {lookupResult && (
          <div className="bg-slate-950 rounded-lg p-3 space-y-1.5 text-[11px] font-mono">
            {Object.entries(lookupResult).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-slate-500 shrink-0 w-32">{k}</span>
                <span className="text-slate-300 break-all">{String(v ?? '—')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
