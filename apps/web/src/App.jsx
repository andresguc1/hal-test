import React, { useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function App() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith("es") ? "en" : "es";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="relative min-h-screen bg-slate-900 text-white overflow-hidden font-mono selection:bg-hal-primary-500/30">
      {/* Global Styles for fonts/scrollbar */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap');
        body { margin: 0; cursor: default; }
        .font-mono { font-family: 'Geist Mono', monospace; }
      `,
        }}
      />

      {/* --- BACKGROUND LAYERS --- */}
      {/* 1. Animated GIF Background (Ambient) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <img
          src="/video/base1.gif"
          alt="Background Animation"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 2. Gradient Overlay (Vignette & Color Tint) */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.4)_0%,#0f172a_100%)] mix-blend-multiply"></div>

      {/* 3. Grid Pattern Overlay (Tech feel) */}
      <div
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>

      {/* --- NAVBAR --- */}
      <nav className="absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-center">
        {/* Logo Area */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <img
            src="/images/haltest_logo.jpeg"
            alt="HAL-TEST"
            className="w-8 h-8 rounded-md shadow-lg shadow-hal-primary-500/20"
          />
          <div className="text-xl font-bold tracking-widest flex gap-1">
            <span className="text-hal-primary-400">HAL</span>
            <span className="text-white/30">-</span>
            <span className="text-hal-warning-400">TEST</span>
          </div>
        </motion.div>

        {/* Phantom Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-500"
        >
          <span className="hover:text-hal-primary-400 cursor-pointer transition-colors">
            Docs
          </span>
          <span className="hover:text-hal-primary-400 cursor-pointer transition-colors">
            Roadmap
          </span>
          <span className="hover:text-hal-primary-400 cursor-pointer transition-colors">
            Pricing
          </span>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-6"
        >
          <button
            onClick={toggleLanguage}
            className="text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors"
          >
            {i18n.language.startsWith("es") ? "EN" : "ES"}
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] uppercase text-emerald-500/80 font-bold tracking-wider">
              {t("nav.status") || "ONLINE"}
            </span>
          </div>
        </motion.div>
      </nav>

      {/* --- HERO CONTENT --- */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-20">
        {/* Floating Logo/Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 bg-hal-primary-500/20 blur-3xl rounded-full"></div>
          <img
            src="/images/haltest_logo.jpeg"
            alt="Hero Logo"
            className="w-32 h-32 md:w-32 md:h-32 rounded-2xl shadow-2xl shadow-hal-primary-500/30 relative z-10 border border-white/10"
          />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold uppercase tracking-tight mb-4 max-w-4xl"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
            The Missing Link
          </span>
          <br />
          <span className="text-hal-primary-400">in Automation</span>
        </motion.h1>

        {/* Main Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg md:text-xl text-slate-300 max-w-2xl mb-4 leading-relaxed font-bold"
        >
          No-code flow builder with AI-powered healing
          <br />
          and real-time Playwright execution.
        </motion.p>

        {/* Secondary Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-sm md:text-base text-slate-500 max-w-lg mb-12"
        >
          {t("hero.subtitle") ||
            "Unified platform for visual workflows, mock services, and intelligent testing."}
        </motion.p>

        {/* Call to Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 items-center mb-16"
        >
          {/* Launch App Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open("/app", "_self")}
            className="group relative px-8 py-4 bg-hal-primary-600 hover:bg-hal-primary-500 text-white rounded-lg font-bold uppercase tracking-wider overflow-hidden transition-all shadow-lg shadow-hal-primary-900/50"
          >
            <span className="relative z-10 flex items-center gap-2">
              {t("cta.launch_app") || "Launch App"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transform group-hover:translate-x-1 transition-transform"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </motion.button>

          {/* Docs / GitHub Button */}
          <motion.button
            whileHover={{
              scale: 1.05,
              backgroundColor: "rgba(255,255,255,0.05)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              window.open("https://github.com/andresguc1/hal-test", "_blank")
            }
            className="px-8 py-4 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white rounded-lg font-bold uppercase tracking-wider transition-all backdrop-blur-sm"
          >
            {t("cta.star_github") || "GitHub"}
          </motion.button>
        </motion.div>

        {/* --- SOCIAL PROOF --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/5 pt-8"
        >
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">2.5k+</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500">
              Flows Executed
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">45+</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500">
              Node Types
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">99%</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500">
              Success Rate
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">Open</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500">
              Source
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
