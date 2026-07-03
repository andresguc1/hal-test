import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Activity, Users, Clock, AlertTriangle, ChevronRight, X } from 'lucide-react';

const PerformanceRunModal = ({ isOpen, onClose, onRun, flowName }) => {
    const [vus, setVus] = useState(5);
    const [duration, setDuration] = useState(30);
    const [profile, setProfile] = useState('constant');

    if (!isOpen) return null;

    // Simple estimation (like in ThrottlePolicy)
    const estimatedRamMb = vus * 250; 
    const isDangerous = estimatedRamMb > 4000; // Warning if > 4GB

    const handleSubmit = (e) => {
        e.preventDefault();
        onRun({ vus, duration, profile });
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-indigo-500/10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-100">Performance Test</h3>
                                <p className="text-xs text-slate-400">Target: <span className="font-medium text-slate-300">{flowName}</span></p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-6">
                        
                        <div className="space-y-4">
                            {/* Virtual Users */}
                            <div className="space-y-2">
                                <label className="flex justify-between items-center text-sm font-medium text-slate-300">
                                    <span className="flex items-center gap-2"><Users size={16} className="text-slate-400"/> Virtual Users (Concurrency)</span>
                                    <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">{vus} VUs</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="1" max="50" step="1" 
                                    value={vus} 
                                    onChange={(e) => setVus(Number(e.target.value))}
                                    className="w-full accent-indigo-500"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                    <span>1</span>
                                    <span>50</span>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="space-y-2">
                                <label className="flex justify-between items-center text-sm font-medium text-slate-300">
                                    <span className="flex items-center gap-2"><Clock size={16} className="text-slate-400"/> Test Duration (Seconds)</span>
                                    <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">{duration}s</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="10" max="300" step="10" 
                                    value={duration} 
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="w-full accent-emerald-500"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                    <span>10s</span>
                                    <span>5m</span>
                                </div>
                            </div>
                        </div>

                        {/* Resource Warning */}
                        <div className={`p-3 rounded-xl border ${isDangerous ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-slate-800/50 border-slate-700/50 text-slate-300'} text-xs flex items-start gap-3 transition-colors`}>
                            <AlertTriangle size={16} className={isDangerous ? 'text-red-400 mt-0.5 shrink-0' : 'text-slate-400 mt-0.5 shrink-0'} />
                            <div>
                                <strong className={`block mb-1 ${isDangerous ? 'text-red-300' : 'text-slate-200'}`}>Resource Estimation</strong>
                                This execution will launch {vus} isolated headless browsers concurrently. 
                                Estimated memory peak: <strong className={isDangerous ? 'text-red-300' : 'text-indigo-300'}>~{(estimatedRamMb / 1024).toFixed(1)} GB</strong>.
                                {isDangerous && <span className="block mt-1 font-bold">⚠️ Warning: High risk of System Out-Of-Memory (OOM).</span>}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-2 flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                                Launch Load Test <ChevronRight size={16} />
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PerformanceRunModal;
