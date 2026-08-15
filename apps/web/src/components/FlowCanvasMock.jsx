import React from "react";
import { motion as Motion } from "framer-motion";
import {
  Globe,
  MousePointerClick,
  Wand2,
  CheckCircle2,
  Play,
} from "lucide-react";

const NODES = [
  {
    icon: Globe,
    title: "Go to URL",
    sub: "app.example.com/login",
    accent: "text-hal-primary-400",
    ring: "border-hal-primary-500/40",
  },
  {
    icon: MousePointerClick,
    title: "Smart Click",
    sub: 'button[data-test="submit"]',
    accent: "text-hal-warning-500",
    ring: "border-hal-warning-500/40",
  },
  {
    icon: Wand2,
    title: "AI Validate",
    sub: "Dashboard is visible",
    accent: "text-emerald-400",
    ring: "border-emerald-500/40",
  },
  {
    icon: CheckCircle2,
    title: "Assert",
    sub: "status === 200",
    accent: "text-hal-primary-400",
    ring: "border-hal-primary-500/40",
  },
];

export default function FlowCanvasMock() {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
      {/* Window bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
        <span className="w-3 h-3 rounded-full bg-hal-error-500/70" />
        <span className="w-3 h-3 rounded-full bg-hal-warning-500/70" />
        <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
        <span className="ml-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          haltest · studio
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
          <Play size={12} /> Running
        </span>
      </div>

      {/* Canvas */}
      <div
        className="relative p-8 md:p-12"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-0">
          {NODES.map((node, i) => (
            <React.Fragment key={node.title}>
              <Motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                className={`flex-1 min-w-0 rounded-xl border ${node.ring} bg-slate-800/80 px-4 py-3 shadow-lg`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <node.icon size={16} className={node.accent} />
                  <span className="text-xs font-bold uppercase tracking-wider text-white truncate">
                    {node.title}
                  </span>
                </div>
                <code className="block text-[11px] text-slate-400 truncate">
                  {node.sub}
                </code>
              </Motion.div>

              {i < NODES.length - 1 && (
                <div className="flex md:flex-col items-center justify-center px-2 py-1 md:py-0">
                  <span className="hidden md:block h-px w-6 bg-gradient-to-r from-hal-primary-500/60 to-hal-primary-400/60" />
                  <span className="md:hidden w-px h-4 bg-gradient-to-b from-hal-primary-500/60 to-hal-primary-400/60" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Healing badge */}
        <Motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2"
        >
          <Wand2 size={14} className="text-emerald-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
            Selector healed · 98% confidence · verified
          </span>
        </Motion.div>
      </div>
    </div>
  );
}
