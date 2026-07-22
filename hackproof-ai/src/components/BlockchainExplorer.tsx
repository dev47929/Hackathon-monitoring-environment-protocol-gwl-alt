import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Team, Commit, BlockchainMode } from '../types';
import { TeamsAPI, BlockchainAPI } from '../services/api';
import { 
  ShieldCheck, RefreshCw, Search, ArrowRight, ChevronLeft, ChevronRight, 
  Trash2, AlertCircle, Filter, GitCommit, Layers, CheckCircle2, Cpu
} from 'lucide-react';

interface BlockchainExplorerProps {
  teams?: Team[];
}

export interface MinimalBlockNode {
  id: string;
  blockNumber: number;
  commitHash: string;
  shortHash: string;
  statusType: 'genesis' | 'valid' | 'flagged' | 'deleted';
  statusBadge: string;
  isSuspicious?: boolean;
}

export default function BlockchainExplorer({ teams: propTeams }: BlockchainExplorerProps) {
  const [teams, setTeams] = useState<Team[]>(propTeams || []);
  const [mode, setMode] = useState<BlockchainMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [blockFilter, setBlockFilter] = useState<'all' | 'deleted' | 'flagged'>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Refs for scrolling to teams
  const teamSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Refs for team horizontal scrolling
  const teamScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Load team data & blockchain mode
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [allTeamsData, modeRes] = await Promise.all([
        TeamsAPI.getAll().catch(() => propTeams || []),
        BlockchainAPI.getMode().catch(() => null),
      ]);
      if (Array.isArray(allTeamsData) && allTeamsData.length > 0) {
        setTeams(allTeamsData);
      }
      setMode(modeRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ledger data');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (propTeams && propTeams.length > 0) {
      setTeams(propTeams);
    }
  }, [propTeams]);

  // Jump to searched team
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matchedTeam = teams.find(t => 
      t.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    if (matchedTeam && teamSectionRefs.current[matchedTeam.id]) {
      teamSectionRefs.current[matchedTeam.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Build team-grouped minimal block chains
  const teamChains = React.useMemo(() => {
    return teams.map((team) => {
      const commits = team.commits || [];
      const blocks: MinimalBlockNode[] = [];

      // 1. Genesis block for the team's chain
      blocks.push({
        id: `genesis-${team.id}`,
        blockNumber: 0,
        commitHash: 'a7f39e2',
        shortHash: 'a7f3...92ab',
        statusType: 'genesis',
        statusBadge: 'GENESIS_INIT',
      });

      // 2. Commit blocks
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

        const hashSeed = `${team.id}-${c.hash}-${idx}`;
        const shortHash = c.hash ? `${c.hash.slice(0, 4)}...${c.hash.slice(-4)}` : `${hashSeed.slice(0, 4)}...${hashSeed.slice(-4)}`;

        blocks.push({
          id: `block-${team.id}-${c.hash}-${idx}`,
          blockNumber: idx + 1,
          commitHash: c.hash || 'init001',
          shortHash,
          statusType,
          statusBadge,
          isSuspicious: Boolean(c.isSuspicious),
        });
      });

      // Apply filter
      let filteredBlocks = blocks;
      if (blockFilter === 'deleted') {
        filteredBlocks = blocks.filter(b => b.statusType === 'deleted');
      } else if (blockFilter === 'flagged') {
        filteredBlocks = blocks.filter(b => b.statusType === 'flagged');
      }

      return {
        team,
        blocks: filteredBlocks,
        totalCommitsCount: commits.length,
        hasDeleted: blocks.some(b => b.statusType === 'deleted'),
        hasFlagged: blocks.some(b => b.statusType === 'flagged'),
      };
    });
  }, [teams, blockFilter]);

  // Filtered teams based on search query
  const visibleTeamChains = React.useMemo(() => {
    if (!searchQuery.trim()) return teamChains;
    const q = searchQuery.trim().toLowerCase();
    return teamChains.filter(tc => 
      tc.team.name.toLowerCase().includes(q) || 
      tc.team.techStack.some(t => t.toLowerCase().includes(q))
    );
  }, [teamChains, searchQuery]);

  // Horizontal scroll helpers per team
  const scrollTeamLeft = (teamId: string) => {
    const el = teamScrollRefs.current[teamId];
    if (el) el.scrollBy({ left: -280, behavior: 'smooth' });
  };

  const scrollTeamRight = (teamId: string) => {
    const el = teamScrollRefs.current[teamId];
    if (el) el.scrollBy({ left: 280, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* 1. Header Box: Simple explanation for non-blockchain users */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 max-w-4xl relative z-10">
          <h1 className="text-xl md:text-2xl font-extrabold text-blue-400 tracking-tight flex items-center gap-2">
            Horizontal Node Chain Ledger
          </h1>
          
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            <strong>💡 How HackProof Ledger Works:</strong> Every code push submitted by hackathon teams is permanently stamped onto this digital ledger. Even if a team force-pushes, rewrites history, or deletes commits from GitHub, the original code snapshot remains <strong>permanently preserved</strong> here so judges can audit full project history.
          </p>
        </div>
      </div>

      {/* 2. Search & Filter Bar (Directly below header) */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team name"
            className="w-full bg-slate-900 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300 font-mono"
            >
              Clear
            </button>
          )}
        </form>

        {/* Filter Button & Options */}
        <div className="relative shrink-0 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-850 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setBlockFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                blockFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Blocks
            </button>

            <button
              type="button"
              onClick={() => setBlockFilter('deleted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                blockFilter === 'deleted'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <Trash2 className="w-3 h-3 text-rose-300" /> Deleted / Force-Push
            </button>

            <button
              type="button"
              onClick={() => setBlockFilter('flagged')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                blockFilter === 'flagged'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-amber-300" /> AI Flagged
            </button>
          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer shrink-0"
          title="Refresh Chains"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* 3. Group By Team — Separate chains stacked one below another */}
      <div className="space-y-6">
        {visibleTeamChains.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-850 rounded-2xl text-xs text-slate-400">
            No team chains match the search query "{searchQuery}".
          </div>
        ) : (
          visibleTeamChains.map(({ team, blocks, totalCommitsCount, hasDeleted, hasFlagged }) => (
            <div
              key={team.id}
              ref={(el) => { if (el) teamSectionRefs.current[team.id] = el; }}
              className="bg-slate-900/80 border border-slate-850 rounded-2xl p-5 space-y-3.5 shadow-lg relative"
            >
              {/* Team Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl p-1.5 bg-slate-950 border border-slate-800 rounded-xl">{team.avatar || '🚀'}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{team.name}</span>
                      <span className="text-[10px] font-mono font-normal text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                        {team.techStack.slice(0, 3).join(', ')}
                      </span>
                    </h3>
                    <a
                      href={team.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-blue-400 hover:underline truncate max-w-md block mt-0.5"
                    >
                      {team.repoUrl}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  {hasDeleted && (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-900 text-rose-300 font-semibold text-[10px] flex items-center gap-1">
                      <Trash2 className="w-3 h-3 text-rose-400" /> Force-Push Deleted
                    </span>
                  )}
                  {hasFlagged && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-900 text-amber-300 font-semibold text-[10px] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400" /> AI Flagged
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-850 text-slate-300 font-semibold text-[10px]">
                    {blocks.length} Blocks
                  </span>

                  {/* Navigation scroll arrows */}
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => scrollTeamLeft(team.id)}
                      className="p-1 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Scroll Left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => scrollTeamRight(team.id)}
                      className="p-1 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Scroll Right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Horizontal Node Chain Flow for this Team */}
              <div
                ref={(el) => { if (el) teamScrollRefs.current[team.id] = el; }}
                className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950 select-none"
              >
                {blocks.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono py-2">
                    No blocks match filter "{blockFilter}" for this team.
                  </div>
                ) : (
                  blocks.map((block, index) => (
                    <React.Fragment key={block.id}>
                      {/* Minimal Block Card */}
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className={`w-52 shrink-0 p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                          block.statusType === 'deleted'
                            ? 'bg-rose-950/30 border-rose-900/80 hover:border-rose-500 shadow-md shadow-rose-950/40'
                            : block.statusType === 'flagged'
                            ? 'bg-amber-950/30 border-amber-900/80 hover:border-amber-500 shadow-md shadow-amber-950/40'
                            : block.statusType === 'genesis'
                            ? 'bg-emerald-950/20 border-emerald-900/60 hover:border-emerald-500'
                            : 'bg-slate-950/90 border-slate-850 hover:border-blue-500/60 shadow-md'
                        }`}
                      >
                        {/* Header: Block ID & Minimal Status Badge */}
                        <div className="flex items-center justify-between text-xs font-mono font-bold">
                          <span className="text-slate-300">BLOCK #{block.blockNumber}</span>

                          {block.statusType === 'genesis' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              GENESIS
                            </span>
                          )}

                          {block.statusType === 'valid' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {block.statusBadge}
                            </span>
                          )}

                          {block.statusType === 'flagged' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5 text-amber-400" /> FLAGGED
                            </span>
                          )}

                          {block.statusType === 'deleted' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-0.5">
                              <Trash2 className="w-2.5 h-2.5 text-rose-400" /> DELETED
                            </span>
                          )}
                        </div>

                        {/* Minimal Identifying Info: Commit SHA */}
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-850 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500 text-[10px]">SHA:</span>
                          <span className="text-blue-400 font-bold tracking-wider">{block.commitHash.slice(0, 7)}</span>
                        </div>
                      </motion.div>

                      {/* Arrow link between consecutive blocks */}
                      {index < blocks.length - 1 && (
                        <div className="flex items-center justify-center shrink-0 text-slate-600">
                          <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
