import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, Zap, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVectorSearch } from '@/hooks/useVectorSearch';

export function CommandPalette({
    isOpen,
    onClose,
    flowId,
    onSelectNode,
    reactFlowInstance,
}) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const { results, loading, error, search, clear } = useVectorSearch();

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setSelectedIndex(0);
            clear();
        } else {
            clear();
        }
    }, [isOpen, clear]);

    useEffect(() => {
        if (isOpen && query) {
            const timer = setTimeout(() => {
                search(query, flowId, 10);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isOpen, query, flowId, search]);

    const handleKeyDown = useCallback((e) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'Escape':
                onClose();
                break;
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
                break;
            default:
                break;
        }
    }, [isOpen, results, selectedIndex, onClose]);

    useEffect(() => {
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    const handleSelect = (node) => {
        if (onSelectNode && reactFlowInstance) {
            reactFlowInstance.fitView({
                nodes: [node.nodeId],
                duration: 300,
                zoom: 1.1,
            });
            reactFlowInstance.setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === node.nodeId ? { ...n, selected: true } : { ...n, selected: false }
                )
            );
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-start justify-center pt-20"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="relative p-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search nodes... (e.g., 'click login', 'input email')"
                                className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base"
                                autoComplete="off"
                                spellCheck={false}
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {loading && (
                            <div className="mt-3 flex items-center gap-2 text-slate-500 text-sm">
                                <Zap className="animate-spin" size={16} />
                                Searching vector index...
                            </div>
                        )}

                        {error && (
                            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {results.length > 0 && (
                            <AnimatePresence mode="popLayout">
                                <ul className="mt-3 max-h-[400px] overflow-y-auto space-y-1">
                                    {results.map((node, index) => (
                                        <motion.li
                                            key={node.nodeId}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ delay: index * 0.02 }}
                                        >
                                            <button
                                                onClick={() => handleSelect(node)}
                                                className={cn(
                                                    'w-full px-4 py-3 rounded-xl text-left transition-all group flex items-center gap-3',
                                                    selectedIndex === index
                                                        ? 'bg-blue-500/10 border border-blue-500/30'
                                                        : 'bg-slate-900/50 hover:bg-slate-800/50 border border-transparent'
                                                )}
                                            >
                                                <div className={cn(
                                                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                                                    selectedIndex === index
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'bg-slate-800 text-slate-500'
                                                )}>
                                                    <Database size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-white truncate">
                                                            {node.label || 'Unnamed Node'}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">
                                                            {node.nodeType}
                                                        </span>
                                                    </div>
                                                    {node.description && (
                                                        <p className="mt-1 text-sm text-slate-500 truncate">
                                                            {node.description}
                                                        </p>
                                                    )}
                                                    {node.tags?.length && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {node.tags.slice(0, 4).map((tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                            {node.tags.length > 4 && (
                                                                <span className="text-xs text-slate-500">
                                                                    +{node.tags.length - 4} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Zap size={12} />
                                                            {(node.similarity * 100).toFixed(0)}% match
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <ChevronRight size={12} />
                                                            Press Enter to navigate
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        </motion.li>
                                    ))}
                                </ul>
                            </AnimatePresence>
                        )}

                        {!loading && !error && results.length === 0 && query && (
                            <div className="mt-6 p-6 text-center text-slate-500">
                                <Database size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No nodes found matching "{query}"</p>
                                <p className="text-xs text-slate-600 mt-1">
                                    Try different keywords or check if vector cache is enabled
                                </p>
                            </div>
                        )}

                        {!query && (
                            <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <p className="text-sm text-slate-400 text-center">
                                    Type to search nodes by label, description, or type using semantic search
                                </p>
                                <div className="mt-3 flex flex-wrap justify-center gap-2">
                                    {['click login', 'input email', 'navigate dashboard', 'assert element'].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setQuery(suggestion)}
                                            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                                        >
                                            "{suggestion}"
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}