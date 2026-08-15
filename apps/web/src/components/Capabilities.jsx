import React from "react";
import { motion as Motion } from "framer-motion";
import { Workflow, Gauge, ShieldCheck } from "lucide-react";

const CAPABILITIES = [
  {
    icon: Workflow,
    accent: "text-hal-primary-400",
    ring: "hover:border-hal-primary-500/40",
    glow: "bg-hal-primary-500/10",
    title: "Automation",
    tagline: "Design once, run on Playwright.",
    points: [
      "50+ visual nodes for DOM, flow control and data",
      "Smart element picker captures resilient selectors",
      "Live Playwright execution with step-by-step feedback",
      "Sessions, cookies and tokens managed for you",
    ],
  },
  {
    icon: Gauge,
    accent: "text-hal-warning-500",
    ring: "hover:border-hal-warning-500/40",
    glow: "bg-hal-warning-500/10",
    title: "Performance",
    tagline: "Know where it breaks before users do.",
    points: [
      "Load, soak and spike testing scenarios",
      "Automatic breaking-point detection",
      "Memory-leak and endurance analysis",
      "SLA evaluation with live telemetry dashboards",
    ],
  },
  {
    icon: ShieldCheck,
    accent: "text-emerald-400",
    ring: "hover:border-emerald-500/40",
    glow: "bg-emerald-500/10",
    title: "Security",
    tagline: "Ship compliant, not exposed.",
    points: [
      "CSP, security headers and TLS validation",
      "Auth and session hardening checks",
      "Data-leak and DOM exposure detection",
      "Compliance reports wired into your pipeline",
    ],
  },
];

export default function Capabilities() {
  return (
    <section
      id="platform"
      className="relative z-10 w-full max-w-6xl mx-auto px-4 py-24"
    >
      <div className="text-center mb-16">
        <Motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-bold uppercase tracking-[0.3em] text-hal-primary-400 mb-4"
        >
          One platform · Three disciplines
        </Motion.p>
        <Motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-balance"
        >
          Automation, performance and security{" "}
          <span className="text-hal-primary-400">in one workflow</span>
        </Motion.h2>
        <Motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 max-w-2xl mx-auto mt-4 text-pretty"
        >
          Stop stitching together three different tools. Haltest runs functional
          checks, load tests and security audits from the same visual flows.
        </Motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CAPABILITIES.map((cap, i) => (
          <Motion.div
            key={cap.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors ${cap.ring}`}
          >
            <div
              className={`absolute inset-0 rounded-2xl ${cap.glow} blur-2xl opacity-40 -z-10`}
            />
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <cap.icon size={22} className={cap.accent} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-widest text-white">
                {cap.title}
              </h3>
            </div>
            <p className={`text-sm font-bold mb-6 ${cap.accent}`}>
              {cap.tagline}
            </p>
            <ul className="space-y-3">
              {cap.points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm text-slate-300"
                >
                  <span
                    className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${cap.accent.replace("text-", "bg-")}`}
                  />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </Motion.div>
        ))}
      </div>
    </section>
  );
}
