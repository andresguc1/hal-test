import React from "react";
import { motion as Motion } from "framer-motion";
import { Download, Upload, GitBranch, Terminal } from "lucide-react";

const FRAMEWORKS = [
  "Playwright",
  "Cypress",
  "Selenium",
  "Puppeteer",
  "WebdriverIO",
  "TestCafe",
  "Nightwatch",
  "Katalon",
  "TestRigor",
];

const FEATURES = [
  {
    icon: Upload,
    title: "Import your suite",
    desc: "Bring existing tests from 10+ frameworks into a visual flow in minutes.",
  },
  {
    icon: Download,
    title: "Export to real code",
    desc: "Generate clean Playwright, Cypress or Selenium code you fully own.",
  },
  {
    icon: Terminal,
    title: "Run in CI/CD",
    desc: "Drop haltest into GitHub Actions, Jenkins or any pipeline with one command.",
  },
];

export default function Interop() {
  return (
    <section
      id="interop"
      className="relative z-10 w-full max-w-6xl mx-auto px-4 py-24"
    >
      <div className="text-center mb-16">
        <Motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-bold uppercase tracking-[0.3em] text-hal-warning-500 mb-4"
        >
          No lock-in
        </Motion.p>
        <Motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-balance"
        >
          Works with the tools{" "}
          <span className="text-hal-warning-500">you already use</span>
        </Motion.h2>
        <Motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 max-w-2xl mx-auto mt-4 text-pretty"
        >
          Haltest sits on top of Playwright and speaks the language of your
          stack. Import what you have, export what you build — the code is
          always yours.
        </Motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {FEATURES.map((f, i) => (
          <Motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
          >
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 w-fit mb-4">
              <f.icon size={20} className="text-hal-warning-500" />
            </div>
            <h3 className="text-base font-bold uppercase tracking-widest text-white mb-2">
              {f.title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
          </Motion.div>
        ))}
      </div>

      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mr-2">
          <GitBranch size={14} /> Interoperable with
        </span>
        {FRAMEWORKS.map((name) => (
          <span
            key={name}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold tracking-wider text-slate-300"
          >
            {name}
          </span>
        ))}
      </Motion.div>
    </section>
  );
}
