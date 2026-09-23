import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Capabilities from "./components/Capabilities";
import Showcase from "./components/Showcase";
import Healing from "./components/Healing";
import Interop from "./components/Interop";
import UseCases from "./components/UseCases";
import Comparison from "./components/Comparison";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="relative min-h-screen bg-slate-900 text-white overflow-x-hidden font-mono selection:bg-hal-primary-500/30">
      {/* Global Styles for scrollbar/base */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        body { margin: 0; cursor: default; }
        html { scroll-behavior: smooth; }
        .font-mono { font-family: 'Geist Mono', monospace; }
      `,
        }}
      />

      {/* --- BACKGROUND LAYERS --- */}
      {/* 1. Gradient Overlay (Vignette & Color Tint) */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12)_0%,rgba(15,23,42,0)_45%),radial-gradient(circle_at_center,rgba(15,23,42,0.4)_0%,#0f172a_100%)] pointer-events-none" />

      {/* 2. Grid Pattern Overlay (Tech feel) */}
      <div
        className="fixed inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <Navbar />

      <main className="relative z-10">
        <Hero />
        <Capabilities />
        <Showcase />
        <Healing />
        <Interop />
        <UseCases />
        <Comparison />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
