import React from "react";
import { useTranslation } from "react-i18next";
import { motion as Motion } from "framer-motion";
import { Slack, Copy, Check, Workflow, Gauge, ShieldCheck } from "lucide-react";
import FlowCanvasMock from "./FlowCanvasMock";

const PILLARS = [
  { icon: Workflow, label: "Automation", color: "text-hal-primary-400" },
  { icon: Gauge, label: "Performance", color: "text-hal-warning-500" },
  { icon: ShieldCheck, label: "Security", color: "text-emerald-400" },
];

const STATS = [
  { value: "50+", label: "Node Types" },
  { value: "3-in-1", label: "Automation · Perf · Security" },
  { value: "10+", label: "Frameworks In / Out" },
  { value: "Playwright", label: "Native Engine" },
];

export default function Hero() {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("npx haltest@latest");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="top"
      className="relative z-10 flex flex-col items-center justify-center px-4 text-center pt-36 pb-24"
    >
      {/* Eyebrow */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
          Visual QA platform · Built on Playwright
        </span>
      </Motion.div>

      {/* Headline */}
      <Motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-5xl md:text-7xl font-bold uppercase tracking-tight mb-6 max-w-4xl text-balance"
      >
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
          The Missing Link
        </span>
        <br />
        <span className="text-hal-primary-400">in Browser Automation</span>
      </Motion.h1>

      {/* Literal definition */}
      <Motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-lg md:text-xl text-slate-300 max-w-2xl mb-8 leading-relaxed text-pretty"
      >
        Design browser tests visually, run them live on Playwright, and cover
        automation, performance, and security in one place — with AI that
        repairs broken selectors and exports to real code.
      </Motion.p>

      {/* Pillars */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.28 }}
        className="flex flex-wrap items-center justify-center gap-3 mb-10"
      >
        {PILLARS.map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <Icon size={16} className={color} />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-200">
              {label}
            </span>
          </div>
        ))}
      </Motion.div>

      {/* CTAs */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.34 }}
        className="flex flex-col sm:flex-row gap-4 items-center mb-10"
      >
        <Motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="/app"
          className="group relative px-8 py-4 bg-hal-primary-500 hover:bg-hal-primary-400 text-white rounded-lg font-bold uppercase tracking-wider transition-all shadow-xl shadow-hal-primary-900/40 border border-hal-primary-400/30 no-underline flex items-center gap-2"
        >
          {t("cta.launch_app") || "Launch App"}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transform group-hover:translate-x-1 transition-transform"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Motion.a>

        <Motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="https://github.com/andresguc1/hal-test"
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-4 bg-white/5 border border-white/20 hover:border-white/40 text-white rounded-lg font-bold uppercase tracking-wider transition-all backdrop-blur-md shadow-lg no-underline"
        >
          {t("cta.star_github") || "GitHub"}
        </Motion.a>

        <Motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="https://join.slack.com/t/haltest-talk/shared_invite/zt-3tzii9nxh-vgdIcI5A8bg~GCG8QF6MuA"
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-4 bg-white/5 border border-white/20 hover:border-white/40 text-white rounded-lg font-bold uppercase tracking-wider transition-all backdrop-blur-md shadow-lg flex items-center gap-2 no-underline"
        >
          <Slack size={18} className="text-[#E01E5A]" />
          {t("cta.community") || "Slack"}
        </Motion.a>
      </Motion.div>

      {/* Terminal snippet */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mb-20 max-w-md w-full"
      >
        <div className="flex items-center justify-between bg-slate-800/80 border border-white/10 rounded-xl p-4 shadow-2xl shadow-hal-primary-900/40 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-hal-primary-400 font-bold">$</span>
            <code className="text-white font-mono text-sm tracking-tight">
              npx haltest@latest
            </code>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white relative border border-white/5"
            title="Copy to clipboard"
            aria-label="Copy install command"
          >
            {copied ? (
              <Check size={18} className="text-emerald-400" />
            ) : (
              <Copy size={18} />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Zero config. No cloning required.
        </p>
      </Motion.div>

      {/* Product visual */}
      <Motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="w-full max-w-5xl mb-16"
      >
        <FlowCanvasMock />
      </Motion.div>

      {/* Honest stats */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.55 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/5 pt-8 w-full max-w-4xl"
      >
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">{stat.value}</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 text-center mt-1">
              {stat.label}
            </span>
          </div>
        ))}
      </Motion.div>
    </section>
  );
}
