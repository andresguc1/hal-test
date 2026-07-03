import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Server, Clock, AlertTriangle, Zap, Target, Gauge, Cpu, CheckCircle2, ChevronRight } from 'lucide-react';

/**
 * PerformanceDashboard — Professional Full-Screen Load Testing Dashboard
 */
const PerformanceDashboard = ({ flowId, flowName, socket, onClose }) => {
    const [runConfig, setRunConfig] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [vuStatus, setVuStatus] = useState(null);
    const [resourceWarning, setResourceWarning] = useState(null);
    const [status, setStatus] = useState('connecting'); // connecting, preparing, running, completed
    const [timeline, setTimeline] = useState([]);

    useEffect(() => {
        if (!socket) return;
        if (socket.connected) setStatus('waiting');

        const handleConnect = () => setStatus('waiting');
        socket.on('connect', handleConnect);

        socket.on('perf-run-started', (config) => {
            if (config.flowId === flowId) {
                setRunConfig(config);
                setStatus('preparing');
            }
        });

        socket.on('perf-metrics-update', (data) => {
            if (data.flowId === flowId) {
                setMetrics(data);
                if (data.runConfig) setRunConfig(prev => prev || data.runConfig);
                if (status !== 'completed') setStatus('running');

                // Update timeline for chart
                setTimeline(prev => {
                    const newTimeline = [...prev, { time: new Date().toLocaleTimeString(), throughput: data.throughput, latency: data.latency.p95 }];
                    return newTimeline.slice(-20); // Keep last 20 points
                });
            }
        });

        socket.on('perf-vu-status', (data) => setVuStatus(data));
        socket.on('perf-resource-warning', (data) => setResourceWarning(data));

        socket.on('perf-run-finished', (summary) => {
            if (summary.data && summary.data.flowId === flowId) {
                setMetrics(summary.data);
                setStatus('completed');
            }
        });

        return () => {
            socket.off('connect', handleConnect);
            socket.off('perf-run-started');
            socket.off('perf-metrics-update');
            socket.off('perf-vu-status');
            socket.off('perf-resource-warning');
            socket.off('perf-run-finished');
        };
    }, [flowId, socket, status]);

    // Calculate Progress
    const duration = runConfig?.durationSec || 0;
    const elapsed = metrics?.elapsed ? metrics.elapsed / 1000 : 0;
    const progressPercent = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

    // Loading State
    if (!metrics && status !== 'completed') {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center text-slate-200">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                        <Activity size={64} className="text-blue-400 animate-pulse relative z-10" />
                    </div>
                    <h2 className="text-3xl font-light tracking-wide mb-2">HalTest Performance Engine</h2>
                    <p className="text-slate-400 text-lg flex items-center space-x-2">
                        <Gauge size={18} className="animate-spin-slow" />
                        <span>
                            {status === 'connecting' ? 'Estableciendo telemetría...' : 
                             status === 'waiting' ? 'A la espera de los Workers...' : 
                             'Inicializando el Banco de Pruebas...'}
                        </span>
                    </p>
                </motion.div>
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-full transition-colors border border-slate-700/50 text-slate-400 hover:text-white"
                >
                    <X size={24} />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col font-sans text-slate-300 overflow-hidden">
            {/* Header */}
            <div className="flex-none h-20 border-b border-slate-800 bg-slate-900/50 px-8 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20">
                        <Activity className="text-blue-400" size={24} />
                        <div>
                            <div className="text-xs text-blue-400/80 font-semibold uppercase tracking-wider">Dashboard de Rendimiento</div>
                            <div className="text-slate-200 font-medium text-lg leading-tight truncate max-w-sm">{flowName || 'Load Test'}</div>
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50 flex flex-col justify-center">
                            <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Estado</div>
                            <div className="flex items-center space-x-2">
                                <span className={`w-2 h-2 rounded-full ${status === 'completed' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></span>
                                <span className="text-sm font-medium text-slate-200 capitalize">
                                    {status === 'completed' ? 'Finalizado' : 'Ejecutando...'}
                                </span>
                            </div>
                        </div>
                        {runConfig && (
                            <>
                                <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50 flex flex-col justify-center">
                                    <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Virtual Users</div>
                                    <div className="text-sm font-medium text-slate-200">{runConfig.totalVUs} VUs</div>
                                </div>
                                <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50 flex flex-col justify-center">
                                    <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Duración</div>
                                    <div className="text-sm font-medium text-slate-200">{runConfig.durationSec}s</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors border border-slate-600 text-slate-300 hover:text-white"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Global Progress Bar */}
            {runConfig && (
                <div className="h-1.5 w-full bg-slate-800 overflow-hidden">
                    <motion.div 
                        className={`h-full ${status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ ease: "linear" }}
                    />
                </div>
            )}

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Resource Warnings */}
                    <AnimatePresence>
                        {resourceWarning && resourceWarning.health !== 'continue' && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`p-4 rounded-xl flex items-center space-x-4 border ${resourceWarning.health === 'abort' ? 'bg-red-950/50 border-red-900/50 text-red-200' : 'bg-amber-950/50 border-amber-900/50 text-amber-200'}`}
                            >
                                <AlertTriangle size={24} className={resourceWarning.health === 'abort' ? 'text-red-400' : 'text-amber-400'} />
                                <div>
                                    <h4 className="font-semibold text-lg">{resourceWarning.health === 'abort' ? 'Estrés de Memoria Crítico' : 'Advertencia de Recursos'}</h4>
                                    <p className="text-sm opacity-80">El sistema ha consumido el {resourceWarning.usedPercent}% de la RAM. {resourceWarning.health === 'abort' && 'La prueba ha sido abortada por seguridad.'}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Throughput */}
                        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 text-slate-800/30 group-hover:text-blue-900/20 transition-colors">
                                <Zap size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2 flex items-center space-x-2">
                                    <span>Throughput</span>
                                </div>
                                <div className="text-5xl font-light text-white mb-2 flex items-baseline space-x-2">
                                    <span>{metrics?.throughput || 0}</span>
                                    <span className="text-xl text-slate-500 font-normal">req/s</span>
                                </div>
                                <div className="text-sm text-slate-400 flex justify-between">
                                    <span>Total Peticiones:</span>
                                    <span className="font-mono text-slate-300">{metrics?.totalRequests || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Latency P95 */}
                        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 text-slate-800/30 group-hover:text-indigo-900/20 transition-colors">
                                <Clock size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2 flex items-center space-x-2">
                                    <span>Latencia (P95)</span>
                                </div>
                                <div className="text-5xl font-light text-white mb-2 flex items-baseline space-x-2">
                                    <span>{metrics?.latency?.p95 || 0}</span>
                                    <span className="text-xl text-slate-500 font-normal">ms</span>
                                </div>
                                <div className="text-sm text-slate-400 flex justify-between">
                                    <span>Mediana (P50):</span>
                                    <span className="font-mono text-slate-300">{metrics?.latency?.median || 0}ms</span>
                                </div>
                            </div>
                        </div>

                        {/* Error Rate */}
                        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 text-slate-800/30 group-hover:text-red-900/10 transition-colors">
                                <Target size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2 flex items-center space-x-2">
                                    <span>Tasa de Error</span>
                                </div>
                                <div className={`text-5xl font-light mb-2 flex items-baseline space-x-2 ${(metrics?.errorCount || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    <span>{metrics?.errorRate || '0.00'}</span>
                                    <span className="text-xl font-normal">%</span>
                                </div>
                                <div className="text-sm text-slate-400 flex justify-between">
                                    <span>Iteraciones Fallidas:</span>
                                    <span className="font-mono text-slate-300">{metrics?.errorCount || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Active VUs */}
                        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 text-slate-800/30 group-hover:text-sky-900/20 transition-colors">
                                <Server size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2 flex items-center space-x-2">
                                    <span>VUs Activos</span>
                                </div>
                                <div className="text-5xl font-light text-white mb-2 flex items-baseline space-x-2">
                                    <span>{vuStatus?.activeVUs || 0}</span>
                                    <span className="text-xl text-slate-500 font-normal">Navegadores</span>
                                </div>
                                <div className="text-sm text-slate-400 flex justify-between">
                                    <span>Iteraciones Completadas:</span>
                                    <span className="font-mono text-slate-300">{vuStatus?.completedVUs || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bottlenecks Panel */}
                        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-medium text-slate-200 flex items-center space-x-2">
                                    <Gauge className="text-amber-400" size={20} />
                                    <span>Cuellos de Botella</span>
                                </h3>
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">Por Latencia P95</span>
                            </div>
                            
                            <div className="flex-1 space-y-3">
                                {metrics?.bottlenecks && metrics.bottlenecks.length > 0 ? (
                                    metrics.bottlenecks.map((node, index) => {
                                        const isCritical = node.p95 > 2000;
                                        const isWarning = node.p95 > 800;
                                        
                                        return (
                                            <div key={node.nodeId} className="group bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 p-3 rounded-xl transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center space-x-2 overflow-hidden pr-2">
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isCritical ? 'bg-red-500/20 text-red-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                                                            {index + 1}
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-200 truncate">{node.label}</span>
                                                    </div>
                                                    <span className={`font-mono text-sm font-bold ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                        {node.p95}ms
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>Promedio: <span className="font-mono text-slate-400">{node.avg}ms</span></span>
                                                    <span>Muestras: <span className="font-mono text-slate-400">{node.count}</span></span>
                                                </div>
                                                {/* Mini progress bar relative to 3000ms max scale */}
                                                <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                                        style={{ width: `${Math.min(100, (node.p95 / 3000) * 100)}%` }} 
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 py-10">
                                        <CheckCircle2 size={48} className="text-slate-700" />
                                        <p className="text-sm text-center">No hay cuellos de botella<br/>registrados todavía.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Simulated Live Chart Area */}
                        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-medium text-slate-200 flex items-center space-x-2">
                                    <Activity className="text-blue-400" size={20} />
                                    <span>Rendimiento en Tiempo Real</span>
                                </h3>
                            </div>
                            
                            <div className="flex-1 relative bg-slate-950/50 border border-slate-800/50 rounded-xl overflow-hidden flex items-end p-4 gap-1 min-h-[300px]">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 pb-8">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="w-full border-t border-slate-800/50 border-dashed opacity-50"></div>
                                    ))}
                                </div>
                                
                                {/* Vertical Bars (Throughput) */}
                                {timeline.length > 0 ? timeline.map((point, i) => {
                                    // Scale throughput max 50 req/s roughly
                                    const heightPercent = Math.min(100, (point.throughput / (runConfig?.totalVUs || 10)) * 100);
                                    return (
                                        <div key={i} className="relative flex-1 flex flex-col justify-end group h-full">
                                            {/* Tooltip */}
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                {point.throughput} req/s @ {point.time}
                                            </div>
                                            <motion.div 
                                                initial={{ height: 0 }}
                                                animate={{ height: `${heightPercent}%` }}
                                                className="bg-blue-500/40 hover:bg-blue-400/60 rounded-t-sm transition-colors border-t border-blue-400/50 w-full mx-[1px]"
                                            />
                                        </div>
                                    );
                                }) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-600 italic">
                                        Recolectando datos...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDashboard;
