import React from "react";
import {
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Code,
  ArrowRight,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * StepDetailsModal - Displays detailed information about a replay step
 * Shows: status, duration, error message, screenshot, input/output data
 */
export default function StepDetailsModal({ isOpen, onClose, nodeData }) {
  if (!isOpen || !nodeData) return null;

  const { state, error, replayData, type, label } = nodeData;
  const isError = state === "error";
  const isSuccess = state === "success";

  // Build screenshot URL if available
  const screenshotUrl = replayData?.screenshot_path
    ? `${import.meta.env.PROD ? "https://hal-test-backend.onrender.com" : "http://localhost:2001"}/${replayData.screenshot_path}`.replace(
        "//storage",
        "/storage",
      )
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90vw] max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl bg-[#1a1a2e] border border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-slate-900/50 to-transparent">
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

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] space-y-6">
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
