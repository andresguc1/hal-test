import React from "react";
import { Cloud, Lock, X } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function GuestModeModal({ isOpen, onClose, onLogin }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <Motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden p-8"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6">
                <Cloud size={40} className="text-indigo-500" />
              </div>

              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                Login to HalTest Cloud
              </h2>

              <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
                Sync your results, collaborate with your team, and access the
                cloud dashboard by connecting your account.
              </p>

              <div className="flex flex-col w-full gap-3">
                <Button
                  onClick={onLogin}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-12 text-lg font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                >
                  Sign In / Sign Up
                </Button>

                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full h-12 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Continue in Guest Mode
                </Button>
              </div>

              <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-slate-500/5 rounded-full border border-slate-500/10">
                <Lock size={12} className="text-slate-500" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Local execution remains active
                </span>
              </div>
            </div>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
