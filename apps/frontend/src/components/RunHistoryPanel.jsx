import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { cn } from '../lib/utils';
import { History, X, RefreshCw } from 'lucide-react';

export default function RunHistoryPanel({ isOpen, onClose, onSelectRun }) {
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRunId, setSelectedRunId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadRuns();
        }
    }, [isOpen]);

    const loadRuns = async () => {
        setLoading(true);
        try {
            const res = await api.get('/runs');
            if (res.success) {
                setRuns(res.data);
            }
        } catch (error) {
            console.error('Failed to load runs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunClick = (run) => {
        setSelectedRunId(run.id);
        onSelectRun(run);
    };

    if (!isOpen) return null;

    return (
        <div className="relative h-full flex flex-col shrink-0 w-80 glass-panel z-[var(--z-hud)]">
            {/* HEADER - Matches Toolbox style */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 shrink-0 bg-[#0f172a]/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-white/10">
                        <History size={16} className="text-emerald-400" />
                    </div>
                    <span className="font-bold text-sm tracking-wide text-slate-100">
                        HISTORY
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadRuns}
                        className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                {loading ? (
                    <div className="flex items-center justify-center p-8 text-slate-500 text-xs">
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Loading...
                    </div>
                ) : runs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-slate-500 text-xs gap-2">
                        <History size={24} className="opacity-30" />
                        <span>No runs recorded yet.</span>
                        <span className="text-[10px] text-slate-600">Execute a flow to see history</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {runs.map((run) => (
                            <button
                                key={run.id}
                                onClick={() => handleRunClick(run)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg transition-all border",
                                    "bg-slate-900/50 hover:bg-slate-800/50",
                                    selectedRunId === run.id
                                        ? "border-emerald-500/50 bg-emerald-500/5"
                                        : "border-white/5 hover:border-white/10"
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={cn(
                                        "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                                        run.status === 'completed' && "bg-green-500/20 text-green-400",
                                        run.status === 'failed' && "bg-red-500/20 text-red-400",
                                        run.status === 'running' && "bg-blue-500/20 text-blue-400"
                                    )}>
                                        {run.status}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '-'}
                                    </span>
                                </div>
                                {run.flow_name && (
                                    <div className="text-xs font-medium text-slate-200 mb-1 truncate">
                                        {run.flow_name}
                                    </div>
                                )}
                                <div className="text-[11px] text-slate-400 font-mono mb-1">
                                    {new Date(run.started_at).toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-600">
                                    {run.trigger} • {run.id.slice(0, 8)}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
