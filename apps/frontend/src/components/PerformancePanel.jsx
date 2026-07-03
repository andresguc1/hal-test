import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * PerformancePanel — Live Metrics Dashboard
 * 
 * Subscribes to backend socket events for real-time load testing metrics.
 */
const PerformancePanel = ({ flowId, socket }) => {
    const [runConfig, setRunConfig] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [vuStatus, setVuStatus] = useState(null);
    const [resourceWarning, setResourceWarning] = useState(null);
    const [isConnected, setIsConnected] = useState(socket ? socket.connected : false);
    const [status, setStatus] = useState('connecting'); // connecting, preparing, running, completed

    useEffect(() => {
        if (!socket) {
            console.warn('[PerformancePanel] No socket provided!');
            return;
        }

        // If it's already connected, set waiting state
        if (socket.connected) {
            setIsConnected(true);
            setStatus('waiting');
        }

        const handleConnect = () => {
            setIsConnected(true);
            setStatus('waiting');
        };

        const handleDisconnect = () => {
            setIsConnected(false);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        socket.on('perf-run-started', (config) => {
            if (config.flowId === flowId) {
                setRunConfig(config);
                setStatus('preparing');
            }
        });

        socket.on('perf-metrics-update', (data) => {
            if (data.flowId === flowId) {
                setMetrics(data);
                
                // Fallback: If we missed the 'perf-run-started' event, extract config from the metrics stream
                if (data.runConfig) {
                    setRunConfig(prev => prev || data.runConfig);
                }

                if (status !== 'completed') {
                    setStatus('running');
                }
            }
        });

        socket.on('perf-vu-status', (data) => {
            setVuStatus(data);
        });

        socket.on('perf-resource-warning', (data) => {
            setResourceWarning(data);
        });

        socket.on('perf-run-finished', (summary) => {
            if (summary.data && summary.data.flowId === flowId) {
                setMetrics(summary.data);
                setStatus('completed');
            }
        });

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('perf-run-started');
            socket.off('perf-metrics-update');
            socket.off('perf-vu-status');
            socket.off('perf-resource-warning');
            socket.off('perf-run-finished');
        };
    }, [flowId, socket]);

    // Render loading or preparing state
    if (status === 'connecting' || status === 'waiting' || status === 'preparing' || (!metrics && status === 'running')) {
        return (
            <div className="p-6 bg-slate-900 rounded-lg border border-slate-700 shadow-xl w-full">
                <div className="flex items-center space-x-3 mb-4">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    <h3 className="font-semibold text-lg text-white">
                        {status === 'preparing' ? 'Inicializando Workers...' : 'Conectando Motor de Pruebas...'}
                    </h3>
                </div>
                {runConfig ? (
                    <div className="space-y-2 text-sm text-slate-400">
                        <p>Preparando navegadores aislados para <strong className="text-white">{runConfig.totalVUs} VUs</strong>.</p>
                        <p>Duración esperada: <strong className="text-white">{runConfig.durationSec}s</strong></p>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                            <div className="bg-indigo-500/50 h-full w-full animate-pulse"></div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">A la espera de configuración...</p>
                )}
            </div>
        );
    }

    // Main running/completed UI
    const isCompleted = status === 'completed';
    const progressPercent = runConfig && runConfig.durationSec > 0 
        ? Math.min(100, (metrics.elapsed / (runConfig.durationSec * 1000)) * 100)
        : 0;

    return (
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 text-white shadow-xl space-y-4 w-full">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                <div>
                    <h3 className="font-semibold text-lg text-indigo-400 flex items-center space-x-2">
                        <span>Live Metrics</span>
                        {isCompleted && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded ml-2">COMPLETED</span>}
                    </h3>
                    {runConfig && (
                        <p className="text-xs text-slate-400 mt-1">
                            {runConfig.totalVUs} VUs • {runConfig.durationSec}s
                        </p>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-green-500' : (isConnected ? 'bg-indigo-500 animate-pulse' : 'bg-red-500')}`}></span>
                    <span className="text-sm text-slate-400">{isCompleted ? 'Finalizado' : (isConnected ? 'Corriendo' : 'Offline')}</span>
                </div>
            </div>

            {/* Time Progress Bar */}
            {runConfig && !isCompleted && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Tiempo: {(metrics.elapsed / 1000).toFixed(1)}s</span>
                        <span>{runConfig.durationSec}s</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className="bg-indigo-500 h-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {resourceWarning && resourceWarning.health !== 'continue' && (
                <div className={`p-2 rounded text-sm ${resourceWarning.health === 'abort' ? 'bg-red-900/50 text-red-200 border-red-800' : 'bg-yellow-900/50 text-yellow-200 border-yellow-800'} border`}>
                    ⚠️ Memoria RAM baja ({resourceWarning.usedPercent}% usada).
                </div>
            )}

            <div className="grid grid-cols-3 gap-3">
                {/* Throughput */}
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Throughput</div>
                    <div className="text-2xl font-bold">{metrics.throughput} <span className="text-sm font-normal text-slate-500">req/s</span></div>
                    <div className="text-xs text-slate-500 mt-1">Total: {metrics.totalRequests} reqs</div>
                </div>

                {/* Latency */}
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Latencia (p95)</div>
                    <div className="text-2xl font-bold">{metrics.latency.p95} <span className="text-sm font-normal text-slate-500">ms</span></div>
                    <div className="text-xs text-slate-500 mt-1">Avg: {metrics.latency.avg}ms</div>
                </div>

                {/* Errors */}
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Error Rate</div>
                    <div className={`text-2xl font-bold ${metrics.errorCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {metrics.errorRate}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{metrics.errorCount} failed</div>
                </div>
            </div>

            {/* Bottlenecks (Top Slowest Nodes) */}
            {metrics.bottlenecks && metrics.bottlenecks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-700">
                    <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
                        Cuellos de Botella (P95 Latencia)
                    </div>
                    <div className="space-y-1.5">
                        {metrics.bottlenecks.map((b, idx) => (
                            <div key={b.nodeId} className="flex justify-between items-center text-sm p-1.5 rounded bg-slate-800/30 hover:bg-slate-800/80 transition-colors">
                                <div className="flex items-center space-x-2 overflow-hidden">
                                    <span className="text-slate-500 font-mono text-xs">{idx + 1}.</span>
                                    <span className="truncate text-slate-200" title={b.nodeId}>{b.label}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-xs text-slate-500">{b.count} reqs</span>
                                    <span className={`font-mono font-medium ${b.p95 > 2000 ? 'text-red-400' : b.p95 > 500 ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {b.p95}ms
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VU Status timeline (Active Iterations) */}
            {vuStatus && (
                <div className="mt-2 pt-3 border-t border-slate-700">
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>VUs Activos (Browsers): {vuStatus.activeVUs}</span>
                        <span>Iteraciones Completadas: {vuStatus.completedVUs}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformancePanel;
