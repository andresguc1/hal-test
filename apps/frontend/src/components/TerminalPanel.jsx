import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Maximize2,
  Minimize2,
  Trash2,
  Terminal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLogs } from "../context/LogContext";

export default function TerminalPanel() {
  const { logs, clearLogs, isPanelVisible, togglePanel } = useLogs();
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isPanelVisible) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 250, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="relative w-full bg-slate-950 border-t border-slate-800 z-10 flex flex-col shadow-2xl font-mono overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Terminal size={14} className="text-hal-primary-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Execution Logs
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-[9px] text-slate-500">
            {logs.length} entries
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearLogs}
            title="Clear Logs"
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded transition-all"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={togglePanel}
            title="Minimize"
            className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded transition-all"
          >
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar scroll-smooth"
      >
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50">
            <Terminal size={32} strokeWidth={1} />
            <span className="text-[10px] uppercase tracking-widest">
              Awaiting execution...
            </span>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 group animate-in fade-in slide-in-from-left-1 duration-300"
            >
              <span className="text-[10px] text-slate-600 shrink-0 select-none pt-0.5">
                [{log.timestamp}]
              </span>
              <span
                className={`text-xs break-all ${
                  log.type === "error"
                    ? "text-rose-400"
                    : log.type === "success"
                      ? "text-emerald-400"
                      : log.type === "warning"
                        ? "text-amber-400"
                        : "text-slate-300"
                }`}
              >
                {log.nodeId && (
                  <span className="text-slate-500 mr-2 opacity-50 select-none">
                    [{log.nodeId.split("-")[0]}]
                  </span>
                )}
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
