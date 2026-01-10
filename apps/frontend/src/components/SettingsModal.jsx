import React, { useState } from "react";
import { motion as Motion, AnimatePresence } from "motion/react";
import { X, Grid, Monitor, Zap, Cable } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { Switch } from "@/components/ui/switch";
import { CATEGORY_STYLES } from "@/config/nodeConstants";

// Styled Components for Layout
const SectionHeader = ({ icon: _Icon, title, colorKey }) => {
  const colorClass = CATEGORY_STYLES[colorKey]?.text || "text-slate-100";
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
      <_Icon size={18} className={colorClass} />
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
        {title}
      </h3>
    </div>
  );
};

const SettingRow = ({
  label,
  description,
  checked,
  onChange,
  colorKey: _colorKey,
}) => {
  // Dynamic switch colors could be applied here if Switch component supports it
  // For now we use standard component but layout is key.
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {description && (
          <span className="text-xs text-slate-500">{description}</span>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-indigo-500"
      />
    </div>
  );
};

const IntegrationStatus = ({ label, status }) => {
  const isReady = status === "connected" || status === "ready";
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-lg border border-white/5 mb-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isReady ? "bg-emerald-500" : "bg-slate-500",
          )}
        />
        <span
          className={cn(
            "text-xs font-mono uppercase",
            isReady ? "text-emerald-400" : "text-slate-500",
          )}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

export default function SettingsModal() {
  const {
    isSettingsOpen,
    closeSettings,
    showGrid,
    toggleGrid,
    enableSnapping,
    toggleSnapping,
    highQualityRendering,
    toggleQuality,
    integrations,
  } = useSettings();

  const [activeTab, setActiveTab] = useState("canvas"); // canvas | system

  const menuItems = [
    { id: "canvas", label: "Canvas & Editor", icon: Grid },
    { id: "system", label: "System & Integrations", icon: Monitor },
  ];

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          {/* BACKDROP */}
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSettings}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* MODAL */}
          <Motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#121212] border border-[#333] shadow-2xl rounded-xl flex overflow-hidden"
          >
            {/* LEFT COLUMN: NAVIGATION */}
            <div className="w-64 bg-black/20 border-r border-[#333] p-4 flex flex-col">
              <h2 className="text-lg font-bold text-white mb-6 px-2 tracking-tight">
                Settings
              </h2>
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                      activeTab === item.id
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent",
                    )}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#121212]">
              {/* Header */}
              <div className="h-14 flex items-center justify-between px-6 border-b border-[#333]">
                <span className="font-semibold text-slate-200">
                  {menuItems.find((i) => i.id === activeTab)?.label}
                </span>
                <button
                  onClick={closeSettings}
                  className="p-1.5 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "canvas" && (
                  <div className="space-y-8 animate-in fade-in duration-300 slide-in-from-right-4">
                    {/* Editor Settings */}
                    <section>
                      <SectionHeader
                        icon={Grid}
                        title="View Options"
                        colorKey="blue"
                      />
                      <div className="space-y-1">
                        <SettingRow
                          label="Show Grid"
                          description="Display dot grid pattern on canvas"
                          checked={showGrid}
                          onChange={toggleGrid}
                        />
                        <SettingRow
                          label="Snap to Grid"
                          description="Align nodes to grid points automatically"
                          checked={enableSnapping}
                          onChange={toggleSnapping}
                        />
                      </div>
                    </section>

                    {/* Performance */}
                    <section>
                      <SectionHeader
                        icon={Zap}
                        title="Performance"
                        colorKey="orange"
                      />
                      <div className="space-y-1">
                        <SettingRow
                          label="High Quality Rendering"
                          description="Enable anti-aliasing and smooth edges (may reduce fps)"
                          checked={highQualityRendering}
                          onChange={toggleQuality}
                        />
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === "system" && (
                  <div className="space-y-8 animate-in fade-in duration-300 slide-in-from-right-4">
                    {/* Integrations */}
                    <section>
                      <SectionHeader
                        icon={Cable}
                        title="Service Status"
                        colorKey="emerald"
                      />
                      <div className="space-y-1">
                        <IntegrationStatus
                          label={integrations.browser.label}
                          status={integrations.browser.status}
                        />
                        <IntegrationStatus
                          label={integrations.network.label}
                          status={integrations.network.status}
                        />
                        <IntegrationStatus
                          label={integrations.ai.label}
                          status={integrations.ai.status}
                        />
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
