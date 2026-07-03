import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

/**
 * PerformancePanel — Live Metrics Dashboard
 * 
 * Subscribes to backend socket events for real-time load testing metrics.
 */
const PerformancePanel = ({ flowId }) => {
    const [metrics, setMetrics] = useState(null);
    const [vuStatus, setVuStatus] = useState(null);
    const [resourceWarning, setResourceWarning] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to the backend socket
        // Adjust URL as needed based on your environment
        const socket = io(process.env.VITE_API_URL || 'http://localhost:2001');

        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('perf-metrics-update', (data) => {
            if (data.flowId === flowId) {
                setMetrics(data);
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
                // Could also trigger a final report download or modal here
            }
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('perf-metrics-update');
            socket.off('perf-vu-status');
            socket.off('perf-resource-warning');
            socket.off('perf-run-finished');
            socket.disconnect();
        };
    }, [flowId]);

    if (!metrics) {
        return (
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 text-slate-400">
                Waiting for performance data... {isConnected ? '(Connected)' : '(Connecting...)'}
            </div>
        );
    }

    return (
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 text-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <h3 className="font-semibold text-lg text-indigo-400">Live Metrics Dashboard</h3>
                <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm text-slate-400">{isConnected ? 'Live' : 'Offline'}</span>
                </div>
            </div>

            {resourceWarning && resourceWarning.health !== 'continue' && (
                <div className={`p-2 rounded text-sm ${resourceWarning.health === 'abort' ? 'bg-red-900/50 text-red-200 border-red-800' : 'bg-yellow-900/50 text-yellow-200 border-yellow-800'} border`}>
                    ⚠️ System RAM low ({resourceWarning.usedPercent}% used). Health: {resourceWarning.health}
                </div>
            )}

            <div className="grid grid-cols-3 gap-4">
                {/* Throughput */}
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Throughput</div>
                    <div className="text-2xl font-bold">{metrics.throughput} <span className="text-sm font-normal text-slate-500">req/s</span></div>
                    <div className="text-xs text-slate-500 mt-1">Total: {metrics.totalRequests} reqs</div>
                </div>

                {/* Latency */}
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Latency (p95)</div>
                    <div className="text-2xl font-bold">{metrics.latency.p95} <span className="text-sm font-normal text-slate-500">ms</span></div>
                    <div className="text-xs text-slate-500 mt-1">Avg: {metrics.latency.avg}ms</div>
                </div>

                {/* Errors */}
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Error Rate</div>
                    <div className={`text-2xl font-bold ${metrics.errorCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {metrics.errorRate}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{metrics.errorCount} failed reqs</div>
                </div>
            </div>

            {/* Timeline/Progress */}
            {vuStatus && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Active VUs: {vuStatus.activeVUs}</span>
                        <span>Completed: {vuStatus.completedVUs}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                            className="bg-indigo-500 h-full transition-all duration-300" 
                            style={{ width: `${Math.min(100, (vuStatus.completedVUs / (vuStatus.activeVUs + vuStatus.completedVUs)) * 100)}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformancePanel;
