import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Code,
  ArrowRight,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * StepDetailsModal - Displays detailed information about a replay step
 * Shows: status, duration, error message, screenshot, input/output data
 */
export default function StepDetailsModal({ isOpen, onClose, nodeData }) {
  const [activeTab, setActiveTab] = useState("general");

  // Reset tab to general when modal opens or nodeData changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab("general");
    }
  }, [isOpen, nodeData]);

  if (!isOpen || !nodeData) return null;

  const { state, error, replayData, type, label } = nodeData;
  const isError = state === "error";
  const isSuccess = state === "success";

  // Gather security alerts
  const alerts =
    nodeData.securityAlerts || replayData?.output_data?.securityAlerts || [];

  // Determine API Base URL
  const apiBase =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? window.location.origin : "http://localhost:2001");

  // Build screenshot URL if available
  const screenshotUrl = replayData?.screenshot_path
    ? `${apiBase}/${replayData.screenshot_path}`.replace(
        "//storage",
        "/storage",
      )
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <Motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90vw] max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl bg-[#1a1a2e] border border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-slate-900/50 to-transparent flex-none">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isError && "bg-red-500/20 text-red-400",
                    isSuccess && "bg-green-500/20 text-green-400",
                    !isError && !isSuccess && "bg-blue-500/20 text-blue-400",
                  )}
                >
                  {isError ? (
                    <AlertCircle size={20} />
                  ) : isSuccess ? (
                    <CheckCircle size={20} />
                  ) : (
                    <ArrowRight size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {label || type}
                  </h2>
                  <span
                    className={cn(
                      "text-xs font-medium uppercase tracking-wider",
                      isError && "text-red-400",
                      isSuccess && "text-green-400",
                      !isError && !isSuccess && "text-blue-400",
                    )}
                  >
                    {state}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/5 px-6 bg-slate-900/20 flex-none">
              <button
                onClick={() => setActiveTab("general")}
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 ui-transition-colors",
                  activeTab === "general"
                    ? "border-cyan-500 text-cyan-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200",
                )}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 ui-transition-colors flex items-center gap-1.5",
                  activeTab === "security"
                    ? "border-red-500 text-red-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200",
                )}
              >
                <Shield size={12} />
                Seguridad
                {alerts.length > 0 && (
                  <span className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                    {alerts.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {activeTab === "general" ? (
                <>
                  {/* Duration */}
                  {replayData?.duration_ms != null && (
                    <div className="flex items-center gap-3 text-slate-300">
                      <Clock size={16} className="text-cyan-400" />
                      <span className="text-sm">
                        Duration:{" "}
                        <strong>
                          {(replayData.duration_ms / 1000).toFixed(2)}s
                        </strong>
                      </span>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className="text-red-400" />
                        <span className="text-sm font-bold text-red-400 uppercase tracking-wider">
                          Error
                        </span>
                      </div>
                      <pre className="text-sm text-red-300 font-mono whitespace-pre-wrap break-words">
                        {error}
                      </pre>
                    </div>
                  )}

                  {/* Screenshot */}
                  {screenshotUrl && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon size={16} className="text-purple-400" />
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                          Screenshot
                        </span>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                        <img
                          src={screenshotUrl}
                          alt="Step Screenshot"
                          className="w-full h-auto"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Input Data */}
                  {replayData?.input_data &&
                    Object.keys(replayData.input_data).length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Code size={16} className="text-emerald-400" />
                          <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                            Input
                          </span>
                        </div>
                        <pre className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-xs text-slate-300 font-mono overflow-x-auto">
                          {JSON.stringify(replayData.input_data, null, 2)}
                        </pre>
                      </div>
                    )}

                  {/* Output Data */}
                  {replayData?.output_data &&
                    Object.keys(replayData.output_data).length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Code size={16} className="text-amber-400" />
                          <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                            Output
                          </span>
                        </div>
                        <pre className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-xs text-slate-300 font-mono overflow-x-auto">
                          {JSON.stringify(replayData.output_data, null, 2)}
                        </pre>
                      </div>
                    )}

                  {/* No replay data message */}
                  {!replayData && !error && (
                    <div className="text-center text-slate-500 py-8">
                      <p className="text-sm">
                        No detailed replay data available for this step.
                      </p>
                      <p className="text-xs mt-1">
                        Run the flow to capture execution details.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert, idx) => {
                    const isHigh =
                      alert.severity === "critical" ||
                      alert.severity === "high";
                    const isMedium = alert.severity === "medium";
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "p-4 rounded-xl border",
                          isHigh &&
                            "bg-red-500/5 border-red-500/20 text-red-200",
                          isMedium &&
                            "bg-amber-500/5 border-amber-500/20 text-amber-200",
                          !isHigh &&
                            !isMedium &&
                            "bg-blue-500/5 border-blue-500/20 text-blue-200",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {isHigh ? (
                              <AlertCircle
                                size={16}
                                className="text-red-400 shrink-0"
                              />
                            ) : isMedium ? (
                              <AlertTriangle
                                size={16}
                                className="text-amber-400 shrink-0"
                              />
                            ) : (
                              <Shield
                                size={16}
                                className="text-blue-400 shrink-0"
                              />
                            )}
                            <span className="text-xs font-bold uppercase tracking-wider">
                              {alert.ruleId || "Security Finding"}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                              isHigh && "bg-red-500/20 text-red-300",
                              isMedium && "bg-amber-500/20 text-amber-300",
                              !isHigh &&
                                !isMedium &&
                                "bg-blue-500/20 text-blue-300",
                            )}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-2 font-medium">
                          {alert.message}
                        </p>
                        {/* OWASP & CVSS metadata */}
                        <div className="mt-2.5 grid grid-cols-2 gap-2 p-2 bg-slate-950/50 rounded-lg border border-white/5 text-[10px]">
                          <div>
                            <span className="text-slate-500 block font-semibold uppercase">
                              OWASP Category
                            </span>
                            <span className="text-indigo-300 font-medium">
                              {alert.owasp ||
                                "A05:2021-Security Misconfiguration"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-semibold uppercase">
                              CVSS rating
                            </span>
                            <span className="text-orange-400 font-bold">
                              {alert.cvss != null
                                ? alert.cvss.toFixed(1)
                                : "5.0"}
                              <span className="text-slate-500 font-normal ml-1">
                                ({alert.severity || "medium"})
                              </span>
                            </span>
                          </div>
                          {alert.cvssVector && (
                            <div className="col-span-2 border-t border-white/5 pt-1.5 mt-0.5">
                              <span className="text-slate-500 block font-semibold uppercase font-mono">
                                CVSS Vector
                              </span>
                              <span className="text-slate-400 font-mono select-all break-all">
                                {alert.cvssVector}
                              </span>
                            </div>
                          )}
                        </div>
                        {alert.evidence && (
                          <div className="mt-3">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">
                              Evidence
                            </span>
                            <pre className="text-[10px] text-slate-300 font-mono bg-black/40 border border-white/5 p-2 rounded-lg mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                              {typeof alert.evidence === "object"
                                ? JSON.stringify(alert.evidence, null, 2)
                                : alert.evidence}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {alerts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ShieldCheck
                        size={48}
                        className="text-emerald-500/20 mb-3"
                      />
                      <h3 className="text-sm font-bold text-emerald-400">
                        Clean Step
                      </h3>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        No security alerts or vulnerabilities detected during
                        this step's execution.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
