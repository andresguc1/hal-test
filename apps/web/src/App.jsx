import React from "react";
import { useTranslation } from "react-i18next";
import { Slack } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Pricing from "./Pricing";
import { Copy, Check } from "lucide-react";

export default function App() {
  const { t, i18n } = useTranslation();

  const [currentView, setCurrentView] = React.useState("hero");
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("npx haltest");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith("es") ? "en" : "es";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="relative min-h-screen bg-slate-900 text-white overflow-x-hidden overflow-y-auto font-mono selection:bg-hal-primary-500/30">
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
      <nav className="fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center bg-slate-900/50 backdrop-blur-md border-b border-white/5">
        {/* Logo Area */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setCurrentView("hero")}
        >
          <img
            src="/images/haltest_logo.jpeg"
            alt="HAL-TEST"
            className="w-8 h-8 rounded-md shadow-lg shadow-hal-primary-500/20 group-hover:scale-110 transition-transform"
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
          <span
            onClick={() => setCurrentView("hero")}
            className={`hover:text-hal-primary-400 cursor-pointer transition-colors ${currentView === "hero" ? "text-hal-primary-400" : ""}`}
          >
            Home
          </span>
          <span
            onClick={() =>
              window.open("https://deepwiki.com/andresguc1/hal-test", "_blank")
            }
            className="hover:text-hal-primary-400 cursor-pointer transition-colors"
          >
            Docs
          </span>
          <span
            onClick={() =>
              window.open(
                "https://github.com/users/andresguc1/projects/8",
                "_blank",
              )
            }
            className="hover:text-hal-primary-400 cursor-pointer transition-colors"
          >
            Roadmap
          </span>
          <span
            onClick={() => setCurrentView("pricing")}
            className={`hover:text-hal-primary-400 cursor-pointer transition-colors ${currentView === "pricing" ? "text-hal-primary-400" : ""}`}
          >
            Pricing
          </span>
          <span
            onClick={() =>
              window.open(
                "https://join.slack.com/t/haltest-talk/shared_invite/zt-3o7wqlt53-tzFebjhK5TxQtYZbwK~f~g",
                "_blank",
              )
            }
            className="hover:text-hal-primary-400 cursor-pointer transition-colors flex items-center gap-2"
          >
            Community
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
      <AnimatePresence mode="wait">
        {currentView === "hero" ? (
          <motion.main
            key="hero"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-20"
          >
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
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open("/app", "_self")}
                className="group relative px-8 py-4 bg-hal-primary-500 hover:bg-hal-primary-400 text-white rounded-lg font-bold uppercase tracking-wider overflow-hidden transition-all shadow-xl shadow-hal-primary-900/40 border border-hal-primary-400/30"
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
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transform group-hover:translate-x-1 transition-transform"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </motion.button>

              {/* Docs / GitHub Button */}
              <motion.button
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  window.open(
                    "https://github.com/andresguc1/hal-test",
                    "_blank",
                  )
                }
                className="px-8 py-4 bg-white/5 border border-white/20 hover:border-white/40 text-white rounded-lg font-bold uppercase tracking-wider transition-all backdrop-blur-md shadow-lg"
              >
                {t("cta.star_github") || "GitHub"}
              </motion.button>

              {/* Community / Slack Button */}
              <motion.button
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  window.open(
                    "https://join.slack.com/t/haltest-talk/shared_invite/zt-3o7wqlt53-tzFebjhK5TxQtYZbwK~f~g",
                    "_blank",
                  )
                }
                className="px-8 py-4 bg-white/5 border border-white/20 hover:border-white/40 text-white rounded-lg font-bold uppercase tracking-wider transition-all backdrop-blur-md shadow-lg flex items-center gap-2"
              >
                <Slack size={18} className="text-[#E01E5A]" />
                {t("cta.community") || "Slack"}
              </motion.button>
            </motion.div>

            {/* Terminal Snippet (NPM) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="mb-16 max-w-md w-full"
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
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white group relative border border-white/5"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check size={18} className="text-emerald-400" />
                  ) : (
                    <Copy size={18} />
                  )}

                  {/* Tooltip */}
                  {copied && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                Zero config. No cloning required.
              </p>
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
          </motion.main>
        ) : (
          <motion.main
            key="pricing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pt-20"
          >
            <Pricing onBack={() => setCurrentView("hero")} />
            <div className="flex justify-center pb-24">
              <button
                onClick={() => {
                  console.log("Navigating home...");
                  setCurrentView("hero");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-8 py-3 border border-white/20 hover:border-hal-primary-400 text-white/80 hover:text-white rounded-full bg-white/5 hover:bg-hal-primary-400/10 transition-all flex items-center gap-3 group backdrop-blur-sm shadow-xl shadow-black/20"
              >
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
                  className="group-hover:-translate-x-1 transition-transform"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                <span className="text-sm font-bold uppercase tracking-widest">
                  Back to Home
                </span>
              </button>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
