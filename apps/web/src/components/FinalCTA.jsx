import React from "react";
import { motion as Motion } from "framer-motion";
import { Slack, ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="relative z-10 w-full max-w-4xl mx-auto px-4 py-24">
      <Motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-3xl border border-white/10 bg-slate-800/50 backdrop-blur-xl p-10 md:p-16 text-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_60%)] -z-10" />
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4 text-balance">
          Ship browser tests that{" "}
          <span className="text-hal-primary-400">keep working</span>
        </h2>
        <p className="text-slate-300 max-w-xl mx-auto mb-8 text-pretty">
          Spin up the studio in seconds and build your first self-healing flow.
        </p>

        <div className="mx-auto max-w-md mb-8">
          <div className="flex items-center justify-center gap-3 bg-slate-900/80 border border-white/10 rounded-xl p-4">
            <span className="text-hal-primary-400 font-bold">$</span>
            <code className="text-white font-mono text-sm">
              npx haltest@latest
            </code>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/app"
            className="group px-8 py-4 bg-hal-primary-500 hover:bg-hal-primary-400 text-white rounded-lg font-bold uppercase tracking-wider transition-all shadow-xl shadow-hal-primary-900/40 no-underline flex items-center gap-2"
          >
            Launch App
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Motion.a>
          <Motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://join.slack.com/t/haltest-talk/shared_invite/zt-3tzii9nxh-vgdIcI5A8bg~GCG8QF6MuA"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white/5 border border-white/20 hover:border-white/40 text-white rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-2 no-underline"
          >
            <Slack size={18} className="text-[#E01E5A]" />
            Join the community
          </Motion.a>
        </div>
      </Motion.div>
    </section>
  );
}
