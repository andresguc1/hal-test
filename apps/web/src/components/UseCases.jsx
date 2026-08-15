import React from "react";
import { motion as Motion } from "framer-motion";
import { UserCheck, RefreshCw, Rocket, ShieldAlert } from "lucide-react";

const USE_CASES = [
  {
    icon: UserCheck,
    title: "From manual QA to automation",
    desc: "Manual testers build reliable flows visually — no boilerplate, no framework onboarding — and hand devs real code.",
  },
  {
    icon: RefreshCw,
    title: "Regression that maintains itself",
    desc: "Auto-healing keeps selectors alive as the UI changes, so nightly regression suites stop failing on cosmetic edits.",
  },
  {
    icon: Rocket,
    title: "Load testing before every release",
    desc: "Run soak and spike scenarios against staging and catch the breaking point long before your users find it.",
  },
  {
    icon: ShieldAlert,
    title: "A security gate in the pipeline",
    desc: "Wire CSP, TLS and data-leak audits into CI so a non-compliant build never reaches production.",
  },
];

export default function UseCases() {
  return (
    <section
      id="use-cases"
      className="relative z-10 w-full max-w-6xl mx-auto px-4 py-24"
    >
      <div className="text-center mb-16">
        <Motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-bold uppercase tracking-[0.3em] text-hal-primary-400 mb-4"
        >
          Where teams use it
        </Motion.p>
        <Motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-balance"
        >
          Built for the way{" "}
          <span className="text-hal-primary-400">QA actually works</span>
        </Motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {USE_CASES.map((uc, i) => (
          <Motion.div
            key={uc.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex gap-5 p-7 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:border-hal-primary-500/40 transition-colors"
          >
            <div className="shrink-0">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <uc.icon size={22} className="text-hal-primary-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold uppercase tracking-widest text-white mb-2">
                {uc.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed text-pretty">
                {uc.desc}
              </p>
            </div>
          </Motion.div>
        ))}
      </div>
    </section>
  );
}
