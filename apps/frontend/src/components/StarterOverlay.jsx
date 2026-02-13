import React from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Play, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const StarterOverlay = ({ isVisible, onLoadTemplate, onDismiss }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-md pointer-events-auto"
        >
          <Motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-xl p-8 rounded-2xl bg-[#0f172a]/90 border border-white/10 shadow-2xl relative overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 blur-[100px] -ml-32 -mb-32 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
                <Sparkles className="text-white w-8 h-8" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Welcome to HaltTest!
              </h2>

              <p className="text-slate-400 text-lg mb-8 max-w-md leading-relaxed">
                Your workspace is empty. Want to see how a professional E2E flow
                looks like?
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-10">
                {[
                  { icon: Play, label: "Navigation", color: "text-blue-400" },
                  {
                    icon: ArrowRight,
                    label: "Interactions",
                    color: "text-pink-400",
                  },
                  {
                    icon: CheckCircle,
                    label: "Assertions",
                    color: "text-emerald-400",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center gap-2"
                  >
                    <item.icon className={cn("w-5 h-5", item.color)} />
                    <span className="text-xs font-semibold text-slate-300">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button
                  onClick={onLoadTemplate}
                  className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                  Load Starter Template
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onDismiss}
                  className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-all active:scale-[0.98]"
                >
                  I'll start from scratch
                </button>
              </div>

              <p className="mt-8 text-[11px] text-slate-500 uppercase tracking-widest font-bold">
                PRO TIP: YOU CAN ALWAYS ADD NODES MANUALLY FROM THE TOOLBOX
              </p>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default StarterOverlay;
