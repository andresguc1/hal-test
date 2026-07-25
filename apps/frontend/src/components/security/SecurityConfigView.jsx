import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Shield,
  Sliders,
  CheckSquare,
  Square,
  Play,
  Lock,
  Globe,
  FileCode,
  AlertTriangle,
} from "lucide-react";

export default function SecurityConfigView({ onStartAudit, isRunning, flowName }) {
  const { t } = useTranslation();
  const [intensity, setIntensity] = useState("standard"); // 'quick' | 'standard' | 'deep'
  const [options, setOptions] = useState({
    headerAudit: true,
    cspValidation: true,
    cookieAttributes: true,
    inputSanitization: true,
    sensitiveDataCheck: true,
    corsWildcardCheck: true,
    mixedContentScan: true,
  });

  const toggleOption = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLaunch = () => {
    if (onStartAudit) {
      onStartAudit({
        intensity,
        securityConfig: options,
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900/80 to-slate-900/40 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Shield size={160} className="text-red-500" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-semibold uppercase tracking-wider">
            <Shield size={14} />
            <span>{t("security_config.dast_header", "DAST Audit Configuration")}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            {t("security_config.security_parameters", "Security Parameters")}: <span className="text-red-400">{flowName || t("security_config.active_flow", "Active Flow")}</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl">
            {t("security_config.header_desc", "Adjust passive attack vectors and quality gate compliance checks before starting the security scan.")}
          </p>
        </div>
      </div>

      {/* Intensity Profile Cards */}
      <div className="space-y-3">
        <label className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center space-x-2">
          <Sliders size={14} className="text-red-400" />
          <span>{t("security_config.aggressiveness_profile", "Audit Aggressiveness Profile")}</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setIntensity("quick")}
            className={`p-4 rounded-xl border text-left transition-all ${
              intensity === "quick"
                ? "bg-slate-900 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-slate-100"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="font-bold text-sm text-slate-200 mb-1 flex items-center justify-between">
              <span>{t("security_config.quick_title", "Quick (Quality Gate)")}</span>
              {intensity === "quick" && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
            </div>
            <p className="text-xs text-slate-400">
              {t("security_config.quick_desc", "Passive scan of HTTP headers (CSP, HSTS, XFO) and password transmission.")}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setIntensity("standard")}
            className={`p-4 rounded-xl border text-left transition-all ${
              intensity === "standard"
                ? "bg-slate-900 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-slate-100"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="font-bold text-sm text-slate-200 mb-1 flex items-center justify-between">
              <span>{t("security_config.standard_title", "Standard (Recommended)")}</span>
              {intensity === "standard" && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
            </div>
            <p className="text-xs text-slate-400">
              {t("security_config.standard_desc", "Complete check of OWASP policies, cookie attributes, CORS, and input sanitization.")}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setIntensity("deep")}
            className={`p-4 rounded-xl border text-left transition-all ${
              intensity === "deep"
                ? "bg-slate-900 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-slate-100"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="font-bold text-sm text-slate-200 mb-1 flex items-center justify-between">
              <span>{t("security_config.deep_title", "Deep (Exhaustive)")}</span>
              {intensity === "deep" && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
            </div>
            <p className="text-xs text-slate-400">
              {t("security_config.deep_desc", "Intensive audit including inline DOM traps, payload injection, and PII leakage.")}
            </p>
          </button>
        </div>
      </div>

      {/* Rules Toggles Grid */}
      <div className="space-y-3">
        <label className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center space-x-2">
          <Lock size={14} className="text-red-400" />
          <span>{t("security_config.active_vectors", "Active Inspection Vectors")}</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              key: "headerAudit",
              title: t("security_config.vectors.headerAudit_title", "HTTP Security Headers"),
              desc: t("security_config.vectors.headerAudit_desc", "Validation of HSTS, X-Frame-Options, and X-Content-Type-Options."),
              icon: Globe,
            },
            {
              key: "cspValidation",
              title: t("security_config.vectors.cspValidation_title", "Content Security Policy (CSP)"),
              desc: t("security_config.vectors.cspValidation_desc", "Detection of unsafe directives ('unsafe-inline', 'unsafe-eval')."),
              icon: FileCode,
            },
            {
              key: "cookieAttributes",
              title: t("security_config.vectors.cookieAttributes_title", "Cookie Attributes (Secure/HttpOnly/SameSite)"),
              desc: t("security_config.vectors.cookieAttributes_desc", "Verification of protection against CSRF attacks and session hijacking."),
              icon: Lock,
            },
            {
              key: "inputSanitization",
              title: t("security_config.vectors.inputSanitization_title", "Input Sanitization & XSS"),
              desc: t("security_config.vectors.inputSanitization_desc", "Inspection of inline DOM events and 'javascript:' links."),
              icon: AlertTriangle,
            },
            {
              key: "sensitiveDataCheck",
              title: t("security_config.vectors.sensitiveDataCheck_title", "Sensitive Data Leak (PII/Credentials)"),
              desc: t("security_config.vectors.sensitiveDataCheck_desc", "Monitoring of password storage and API responses."),
              icon: Shield,
            },
            {
              key: "corsWildcardCheck",
              title: t("security_config.vectors.corsWildcardCheck_title", "Excessive CORS Permissions"),
              desc: t("security_config.vectors.corsWildcardCheck_desc", "Alert if 'Access-Control-Allow-Origin' uses wildcards with credentials."),
              icon: Globe,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isChecked = options[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggleOption(item.key)}
                className={`p-4 rounded-xl border cursor-pointer flex items-start space-x-3 transition-all ${
                  isChecked
                    ? "bg-slate-900/80 border-slate-700 text-slate-200"
                    : "bg-slate-950/40 border-slate-900 text-slate-500 hover:border-slate-800"
                }`}
              >
                <div className="mt-0.5">
                  {isChecked ? (
                    <CheckSquare size={18} className="text-red-400" />
                  ) : (
                    <Square size={18} className="text-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold flex items-center space-x-2">
                    <Icon size={14} className={isChecked ? "text-red-400" : "text-slate-600"} />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-4 flex justify-end">
        <button
          type="button"
          disabled={isRunning}
          onClick={handleLaunch}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(225,29,72,0.3)] disabled:opacity-50 flex items-center space-x-2 transition-all"
        >
          <Play size={16} fill="currentColor" />
          <span>{isRunning ? t("security_config.running_audit", "Audit In Progress...") : t("security_config.start_audit", "Start Security Audit")}</span>
        </button>
      </div>
    </div>
  );
}
