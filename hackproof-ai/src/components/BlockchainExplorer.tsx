import { useState, useEffect } from 'react';
import { BlockchainAPI } from '../services/api';
import type { BlocksResponse, TransactionDetail, BlockchainMode } from '../types';
import { RefreshCw, Link, Hash, Blocks, Clock } from 'lucide-react';

export default function BlockchainExplorer() {
  const [blocks, setBlocks] = useState<BlocksResponse | null>(null);
  const [mode, setMode] = useState<BlockchainMode | null>(null);
  const [txDetail, setTxDetail] = useState<TransactionDetail | null>(null);
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [b, m] = await Promise.all([
        BlockchainAPI.getBlocks(10, 0),
        BlockchainAPI.getMode(),
      ]);
      setBlocks(b);
      setMode(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load blockchain data');
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleLookupTx = async () => {
    if (!txHash.trim()) return;
    setLoading(true);
    setError('');
    try {
      const tx = await BlockchainAPI.getTransaction(txHash.trim());
      setTxDetail(tx);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction not found');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Blocks className="w-5 h-5 text-indigo-400" /> Blockchain Explorer
        </h2>
        <div className="flex items-center gap-3">
          {mode && (
            <span className="text-[10px] font-mono text-slate-500">
              Mode: <span className="text-emerald-400 font-bold">{mode.mode}</span>
              {mode.configured ? ' • Configured' : ' • Not configured'}
            </span>
          )}
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition-all cursor-pointer disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono">{error}</div>
      )}

      {/* Transaction lookup */}
      <div className="bg-slate-900/60 border border-slate-850/80 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-indigo-400" /> Transaction Lookup
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="Enter transaction hash (e.g. 0x...)"
            className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500/50"
          />
          <button onClick={handleLookupTx} disabled={loading || !txHash.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer">
            Lookup
          </button>
        </div>
        {txDetail && (
          <div className="bg-slate-950 rounded-lg p-3 space-y-1.5 text-[11px] font-mono">
            {Object.entries(txDetail).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-slate-500 shrink-0 w-28">{k}</span>
                <span className="text-slate-300 break-all">{String(v ?? '—')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocks list */}
      <div className="bg-slate-900/60 border border-slate-850/80 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Link className="w-3.5 h-3.5 text-indigo-400" /> Recent Blocks
        </h3>
        {!blocks ? (
          <p className="text-xs text-slate-500">No blocks found.</p>
        ) : (
          <div className="space-y-2">
            {blocks.blocks.map((block) => (
              <div key={block.number} className="bg-slate-950 rounded-lg p-3 border border-slate-850/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-indigo-400">Block #{block.number}</span>
                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(block.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-3 text-[10px] font-mono">
                  <span className="text-slate-500">Hash: <span className="text-slate-300">{block.hash.slice(0, 20)}…</span></span>
                  <span className="text-slate-500">Tx: <span className="text-slate-300">{block.txCount}</span></span>
                  <span className="text-slate-500">Gas: <span className="text-slate-300">{block.gasUsed}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
