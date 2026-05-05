import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { LinkIcon, ShieldCheckIcon, CubeIcon } from '@heroicons/react/24/outline';

const BlockchainViewer = () => {
  const [chain, setChain] = useState([]);
  const [verifyResult, setVerifyResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchChain(); }, []);

  const fetchChain = async () => {
    setLoading(true);
    try {
      const res = await api.get('/blockchain/chain');
      setChain(res.data.reverse()); // Newest first
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyChain = async () => {
    const res = await api.get('/blockchain/verify');
    setVerifyResult(res.data);
  };

  const actionColors = {
    EMPLOYEE_ADDED: 'badge-green',
    EMPLOYEE_UPDATED: 'badge-blue',
    EMPLOYEE_INACTIVATED: 'badge-red',
    PAYROLL_GENERATED: 'badge-purple',
    PAYROLL_APPROVED: 'badge-blue',
    PAYSLIP_DOWNLOADED: 'badge-yellow',
  };

  const filtered = (chain || []).filter(b => {
    if (!b) return false;
    if (!search) return true;
    const searchLower = search.toLowerCase();
    
    // Safely handle data stringification
    let dataStr = "";
    try {
      dataStr = typeof b.data === 'object' ? JSON.stringify(b.data) : String(b.data || "");
    } catch (e) {
      dataStr = "";
    }
    
    return dataStr.toLowerCase().includes(searchLower) ||
           String(b.block_index || "").includes(searchLower) ||
           String(b.hash || "").toLowerCase().includes(searchLower) ||
           String(b.previous_hash || "").toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title gradient-text">Blockchain Audit Log</h1>
          <p className="page-subtitle">Immutable audit trail of all payroll operations</p>
        </div>
        <div className="flex gap-3">
          <button onClick={verifyChain} className="btn-secondary flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4" /> Verify Chain
          </button>
          <button onClick={fetchChain} className="btn-primary flex items-center gap-2">
            <LinkIcon className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Verify Result */}
      {verifyResult && (
        <div className={`px-5 py-4 rounded-2xl border text-sm font-medium flex items-center gap-3 ${
          verifyResult.valid
            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
        }`}>
          <span className="text-xl">{verifyResult.valid ? '🔒' : '⚠️'}</span>
          <div>
            <span className="font-bold">{verifyResult.valid ? 'Chain Integrity Verified' : 'Chain Integrity Failed'}</span>
            <span className="ml-2 opacity-70">— {verifyResult.total_blocks} blocks verified</span>
            {verifyResult.errors?.length > 0 && <p className="text-xs mt-0.5">{verifyResult.errors.join(', ')}</p>}
          </div>
          <button onClick={() => setVerifyResult(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Total Blocks', value: chain.length, color: 'text-indigo-600', bg: 'bg-indigo-100', emoji: '⛓️' },
          { label: 'Employee Events', value: chain.filter(b => typeof b.data === 'object' && b.data?.action?.startsWith('EMPLOYEE')).length, color: 'text-blue-600', bg: 'bg-blue-100', emoji: '👤' },
          { label: 'Payroll Events', value: chain.filter(b => typeof b.data === 'object' && b.data?.action?.startsWith('PAYROLL')).length, color: 'text-purple-600', bg: 'bg-purple-100', emoji: '💰' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`${s.bg} dark:bg-opacity-10 w-12 h-12 rounded-xl flex items-center justify-center text-xl`}>{s.emoji}</div>
            <div>
              <p className={`text-2xl font-black ${s.color} dark:text-indigo-400`}>{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="glass-card p-3">
        <input
          type="text"
          placeholder="Search blocks by content or index..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Chain Blocks */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((block, i) => {
            const data = typeof block.data === 'object' ? block.data : (() => {
              try { return JSON.parse(block.data); } catch { return { raw: block.data }; }
            })();
            const action = data?.action || (block.block_index === 0 ? 'GENESIS' : 'DATA');
            return (
              <div key={block.block_index}
                className="glass-card p-5 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      block.block_index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {block.block_index === 0 ? '⚡' : <CubeIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 dark:text-white">Block #{block.block_index}</span>
                        <span className={`badge ${actionColors[action] || 'badge-gray'}`}>{action}</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{block.timestamp}</p>
                    </div>
                  </div>
                </div>

                {/* Data */}
                {Object.keys(data).length > 0 && action !== 'GENESIS' && (
                  <div className="mt-3 bg-gray-50/80 dark:bg-slate-900/50 rounded-xl p-3 flex flex-wrap gap-x-4 gap-y-1">
                    {Object.entries(data).filter(([k]) => k !== 'action').map(([k, v]) => (
                      <span key={k} className="text-xs">
                        <span className="text-gray-500 dark:text-slate-500 font-medium">{k}: </span>
                        <span className="text-gray-800 dark:text-slate-300 font-semibold">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Hashes */}
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <div className="text-xs bg-white/60 dark:bg-slate-900/40 rounded-lg p-2.5 font-mono border border-gray-100 dark:border-slate-800">
                    <span className="text-gray-400 dark:text-slate-500 font-sans">prev: </span>
                    <span className="text-gray-600 dark:text-slate-400 break-all">{String(block.previous_hash).slice(0, 32)}…</span>
                  </div>
                  <div className="text-xs bg-indigo-50/60 dark:bg-indigo-900/20 rounded-lg p-2.5 font-mono border border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-indigo-400 dark:text-indigo-500 font-sans">hash: </span>
                    <span className="text-indigo-700 dark:text-indigo-400 break-all">{String(block.hash).slice(0, 32)}…</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">No blocks match your search.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlockchainViewer;
