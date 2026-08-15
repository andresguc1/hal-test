import React from "react";
import { motion as Motion } from "framer-motion";
import { Gauge, ShieldCheck, Boxes } from "lucide-react";

const PANELS = [
  {
    src: "/images/panel_performance.png",
    icon: Gauge,
    accent: "text-hal-warning-500",
    label: "Performance",
    caption: "Ramp-up, spike and soak scenarios with live VU projection.",
    alt: "Haltest load testing panel with scenario types, virtual-user projection chart and duration controls.",
  },
  {
    src: "/images/panel_security.png",
    icon: ShieldCheck,
    accent: "text-emerald-400",
    label: "Security",
    caption: "DAST audits mapped to OWASP, PCI-DSS, ISO 27001 and GDPR.",
    alt: "Haltest security audit configuration with compliance frameworks and active inspection vectors.",
  },
  {
    src: "/images/panel_toolbox.png",
    icon: Boxes,
    accent: "text-hal-primary-400",
    label: "50+ nodes",
    caption: "A categorized toolbox: browser, DOM, network, AI, databases.",
    alt: "Haltest node toolbox showing categories such as Security, Browser, DOM, AI Models, Network and Databases.",
  },
];

export default function Showcase() {
  return (
    <section
      id="tour"
      className="relative z-10 w-full max-w-6xl mx-auto px-4 py-24"
    >
      <div className="text-center mb-14">
        <Motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-bold uppercase tracking-[0.3em] text-hal-primary-400 mb-4"
        >
          Inside the studio
        </Motion.p>
        <Motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-balance"
        >
          The whole platform,{" "}
          <span className="text-hal-primary-400">not a slide deck</span>
        </Motion.h2>
      </div>

      {/* Featured full studio */}
      <Motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-xl overflow-hidden border border-white/10 bg-slate-900/60 shadow-2xl shadow-hal-primary-900/40 backdrop-blur-xl mb-8"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-slate-950/60">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-hal-warning-500/70" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
          <span className="ml-3 text-[11px] font-mono text-slate-500 tracking-tight">
            haltest · quality · performance · security
          </span>
        </div>
        <img
          src="/images/studio_full.png"
          alt="Full Haltest studio showing a branching browser automation flow with quality, performance and security tabs."
          className="w-full block"
          loading="lazy"
        />
      </Motion.div>

      {/* Panel grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PANELS.map((panel, i) => (
          <Motion.div
            key={panel.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl overflow-hidden border border-white/10 bg-slate-900/60 backdrop-blur-md flex flex-col"
          >
            <div className="aspect-[4/3] overflow-hidden bg-slate-950/40 border-b border-white/10">
              <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <panel.icon size={18} className={panel.accent} />
                <span className="text-sm font-bold uppercase tracking-widest text-white">
                  {panel.label}
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed text-pretty">
                {panel.caption}
              </p>
            </div>
          </Motion.div>
        ))}
      </div>
    </section>
  );
}
