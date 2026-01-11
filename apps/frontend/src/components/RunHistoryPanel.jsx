import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { cn } from '../lib/utils'; // Assuming cn utility exists

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
        <div className="fixed left-0 top-14 bottom-14 w-80 bg-[var(--bg-surface)] border-r border-[var(--border-primary)] z-20 flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-surface)]">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Execution History</h2>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center p-8 text-[var(--text-muted)] text-xs">
                        Loading...
                    </div>
                ) : runs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-[var(--text-muted)] text-xs gap-2">
                        <span>No runs recorded yet.</span>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border-secondary)]">
                        {runs.map((run) => (
                            <button
                                key={run.id}
                                onClick={() => handleRunClick(run)}
                                className={cn(
                                    "w-full text-left px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors group relative",
                                    selectedRunId === run.id && "bg-[var(--bg-active)] border-l-2 border-[var(--accent-primary)]"
                                )}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={cn(
                                        "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                                        run.status === 'completed' && "bg-green-500/10 text-green-500",
                                        run.status === 'failed' && "bg-red-500/10 text-red-500",
                                        run.status === 'running' && "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {run.status}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-muted)]">
                                        {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '-'}
                                    </span>
                                </div>
                                <div className="text-xs text-[var(--text-primary)] font-mono truncate mb-0.5">
                                    {new Date(run.started_at).toLocaleString()}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)]">
                                    Trigger: {run.trigger}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
