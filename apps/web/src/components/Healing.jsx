import React from "react";
import { motion as Motion } from "framer-motion";
import { Wand2, ArrowRight, ShieldCheck } from "lucide-react";

export default function Healing() {
  return (
    <section
      id="healing"
      className="relative z-10 w-full max-w-6xl mx-auto px-4 py-24"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Copy */}
        <Motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400 mb-4">
            AI auto-healing
          </p>
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight mb-6 text-balance">
            Tests that repair{" "}
            <span className="text-emerald-400">themselves</span>
          </h2>
          <p className="text-slate-300 leading-relaxed mb-6 text-pretty">
            The biggest cost in QA is not writing tests — it is fixing them when
            the UI changes. When a selector breaks, Haltest proposes a resilient
            replacement, scores its confidence, verifies it against the live
            page, and logs every decision so you stay in control.
          </p>
          <ul className="space-y-3">
            {[
              "Deterministic healing with confidence scoring",
              "Every fix verified against the running page",
              "Full audit trail: original, healed, reasoning",
            ].map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 text-sm text-slate-300"
              >
                <ShieldCheck
                  size={18}
                  className="text-emerald-400 shrink-0 mt-0.5"
                />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </Motion.div>

        {/* Visual: healing diff */}
        <Motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
            <Wand2 size={14} className="text-emerald-400" />
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              healing log
            </span>
          </div>
          <div className="p-6 space-y-4 font-mono text-sm">
            <div className="rounded-lg border border-hal-error-500/30 bg-hal-error-500/10 p-3">
              <span className="text-[10px] uppercase tracking-widest text-hal-error-500 font-bold block mb-1">
                Broken
              </span>
              <code className="text-slate-300 break-all">
                button.btn-primary.submit-2024
              </code>
            </div>

            <div className="flex items-center gap-2 text-slate-500 pl-2">
              <ArrowRight size={16} className="text-emerald-400" />
              <span className="text-[11px] uppercase tracking-widest">
                healed automatically
              </span>
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                Applied
              </span>
              <code className="text-emerald-200 break-all">
                {'[data-test="submit"]'}
              </code>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] uppercase tracking-widest">
              <span className="text-slate-500">confidence</span>
              <span className="text-emerald-400 font-bold">98% · verified</span>
            </div>
          </div>
        </Motion.div>
      </div>
    </section>
  );
}
