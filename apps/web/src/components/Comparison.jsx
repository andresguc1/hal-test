import React from "react";
import { motion as Motion } from "framer-motion";
import { Check, Minus, X } from "lucide-react";

const COLUMNS = ["Haltest", "Raw Playwright", "SaaS test cloud"];

const ROWS = [
  { label: "Visual flow editor", values: [true, false, "partial"] },
  { label: "Smart element picker", values: [true, false, true] },
  { label: "Exports to real code you own", values: [true, true, false] },
  { label: "Imports existing suites", values: [true, false, "partial"] },
  { label: "Performance & load testing", values: [true, false, "partial"] },
  { label: "Security & compliance audits", values: [true, false, false] },
  { label: "Deterministic auto-healing", values: [true, false, "partial"] },
  { label: "Real-time collaboration", values: [true, false, true] },
  { label: "Runs in your own CI/CD", values: [true, true, "partial"] },
];

function Cell({ value }) {
  if (value === true)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-hal-primary-500/15">
        <Check size={16} className="text-hal-primary-400" strokeWidth={3} />
      </span>
    );
  if (value === "partial")
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/5">
        <Minus size={16} className="text-slate-500" strokeWidth={3} />
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/5">
      <X size={16} className="text-slate-600" strokeWidth={3} />
    </span>
  );
}

export default function Comparison() {
  return (
    <section
      id="compare"
      className="relative z-10 w-full max-w-5xl mx-auto px-4 py-24"
    >
      <div className="text-center mb-16">
        <Motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-bold uppercase tracking-[0.3em] text-hal-primary-400 mb-4"
        >
          Why Haltest
        </Motion.p>
        <Motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-balance"
        >
          The whole picture,{" "}
          <span className="text-hal-primary-400">not a slice</span>
        </Motion.h2>
        <Motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 max-w-2xl mx-auto mt-4 text-pretty"
        >
          Code frameworks give you control but no coverage. Test clouds give you
          coverage but lock you in. Haltest gives you both.
        </Motion.p>
      </div>

      <Motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
      >
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-5 text-xs font-bold uppercase tracking-widest text-slate-500">
                Capability
              </th>
              {COLUMNS.map((col, i) => (
                <th
                  key={col}
                  className={`p-5 text-center text-xs font-bold uppercase tracking-widest ${
                    i === 0 ? "text-hal-primary-400" : "text-slate-400"
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.label}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                <td className="p-5 text-sm text-slate-300 font-medium">
                  {row.label}
                </td>
                {row.values.map((value, i) => (
                  <td
                    key={`${row.label}-${i}`}
                    className={`p-5 text-center ${
                      i === 0 ? "bg-hal-primary-500/[0.04]" : ""
                    }`}
                  >
                    <Cell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Motion.div>

      <Motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="flex flex-wrap items-center justify-center gap-6 mt-6 text-[11px] uppercase tracking-wider text-slate-500"
      >
        <span className="flex items-center gap-2">
          <Check size={14} className="text-hal-primary-400" strokeWidth={3} />{" "}
          Full support
        </span>
        <span className="flex items-center gap-2">
          <Minus size={14} className="text-slate-500" strokeWidth={3} /> Partial
          / add-on
        </span>
        <span className="flex items-center gap-2">
          <X size={14} className="text-slate-600" strokeWidth={3} /> Not
          available
        </span>
      </Motion.div>
    </section>
  );
}
