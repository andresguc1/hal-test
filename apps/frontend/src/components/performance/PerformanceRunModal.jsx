import React, { useState, useMemo } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  X,
  Gauge,
  Activity,
  Users,
  Clock,
  Play,
  AlertTriangle,
  TrendingUp,
  Zap,
  BarChart2,
  Settings,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/useToast";
import { useNavigate } from "react-router-dom";

import { useProjectManager } from "@/components/hooks/useProjectManager";

export default function PerformanceRunModal({
  isOpen,
  onClose,
  flowId,
  projectId,
  onRunProfiling,
  flowName,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { currentProject } = useProjectManager();

  // Run Type: "profiling" (single user latency) or "load_test" (concurrent)
  const [runType, setRunType] = useState("profiling");

  // Load Test Config
  const [profile, setProfile] = useState("ramp");
  const [vus, setVus] = useState(25);
  const [duration, setDuration] = useState(60);
  const [rampUp, _setRampUp] = useState(15);
  const [startVUs, _setStartVUs] = useState(1);
  const [holdTime, _setHoldTime] = useState(30);
  const [rampDown, setRampDown] = useState(15);
  const [stepCount, setStepCount] = useState(4);
  const [spikeBaseVUs, setSpikeBaseVUs] = useState(5);
  const [spikeCount, setSpikeCount] = useState(1);
  const [maxP95Ms, setMaxP95Ms] = useState(500);
  const [maxErrorRatePct, setMaxErrorRatePct] = useState(1.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CPU/RAM Resource calculation
  const estimatedRamGb = useMemo(() => {
    const activeVUs =
      runType === "profiling" ? 1 : profile === "baseline" ? 1 : vus;
    return ((activeVUs * 250) / 1024).toFixed(2);
  }, [runType, profile, vus]);

  const isDangerous = parseFloat(estimatedRamGb) > 4.0;

  const handleLaunch = async () => {
    if (runType === "profiling") {
      if (onRunProfiling) onRunProfiling({ executionMode: "performance" });
      onClose();
      return;
    }

    // Concurrent Load Test Execution
    if (!flowId) {
      toast.info("Selecciona un flujo de automatización válido.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Lanzando motor de pruebas de carga...");

    const activeFlowObj = currentProject?.flows?.find((f) => f.id === flowId);

    try {
      const effectiveDuration = profile === "soak" ? duration * 60 : duration;

      const response = await api.post("/runs/performance", {
        flowId,
        projectId,
        nodes: activeFlowObj?.nodes || [],
        edges: activeFlowObj?.edges || [],
        performanceConfig: {
          virtualUsers: vus,
          duration: effectiveDuration,
          profile,
          rampUp: profile === "ramp" || profile === "stepped" ? rampUp : 0,
          rampDown: profile === "ramp" || profile === "stepped" ? rampDown : 10,
          holdTime: profile === "ramp" || profile === "stepped" ? holdTime : 0,
          startVUs,
          stepCount,
          spikeBaseVUs,
          spikeCount,
          stopAtErrorRate: maxErrorRatePct,
          maxLatencyMs: maxP95Ms,
          slaConfig: {
            maxP95Ms,
            maxErrorRatePct,
            targetApdex: 0.85,
          },
          headless: true,
        },
      });

      if (response.success || response.data?.success) {
        toast.dismiss(toastId);
        toast.success("Prueba de carga concurrente lanzada con éxito!");
        onClose();
        // Redirect to performance live view on the dashboard
        navigate("/dashboard", {
          state: {
            activePage: "performance",
            activeTab: "live",
            perfConfig: {
              virtualUsers: vus,
              duration: effectiveDuration,
              profile,
              rampUp: profile === "ramp" || profile === "stepped" ? rampUp : 0,
              rampDown:
                profile === "ramp" || profile === "stepped" ? rampDown : 10,
              holdTime:
                profile === "ramp" || profile === "stepped" ? holdTime : 0,
              startVUs,
              stepCount,
              slaConfig: { maxP95Ms, maxErrorRatePct },
            },
          },
        });
      } else {
        toast.dismiss(toastId);
        toast.error(
          response.message ||
            response.data?.message ||
            "Error al lanzar la prueba de carga",
        );
      }
    } catch (error) {
      toast.dismiss(toastId);
      console.error("[PerformanceRunModal] Launch load test failed:", error);
      toast.error("Error del motor: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />

          {/* MODAL CONTAINER */}
          <Motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] bg-[#0c0f17] border border-blue-500/20 shadow-2xl shadow-blue-500/5 rounded-2xl flex flex-col overflow-hidden text-slate-300 font-sans"
          >
            {/* HEADER */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-[#0e1321]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Gauge size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
                    {t(
                      "performance_modal.title",
                      "Configurar Ejecución de Performance",
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Flujo:{" "}
                    <span className="text-slate-300 font-medium">
                      {flowName || "Sin Nombre"}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* RUN TYPE SELECTOR */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {t("performance_modal.execution_mode", "Modo de Ejecución")}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Profiling option */}
                  <button
                    type="button"
                    onClick={() => setRunType("profiling")}
                    className={cn(
                      "flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                      runType === "profiling"
                        ? "bg-blue-500/5 border-blue-500/80 text-slate-200 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                        : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700 text-slate-400",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Activity
                        size={16}
                        className={
                          runType === "profiling"
                            ? "text-blue-400"
                            : "text-slate-500"
                        }
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {t(
                          "performance_modal.latency_profiling",
                          "Perfilado de Latencia",
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-relaxed">
                      {t(
                        "performance_modal.latency_profiling_desc",
                        "Ejecuta el flujo una vez de forma visual. Mide y resalta el tiempo exacto de respuesta de cada paso sobre el lienzo.",
                      )}
                    </span>
                  </button>

                  {/* Load test option */}
                  <button
                    type="button"
                    onClick={() => setRunType("load_test")}
                    className={cn(
                      "flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                      runType === "load_test"
                        ? "bg-purple-500/5 border-purple-500/80 text-slate-200 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                        : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700 text-slate-400",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Users
                        size={16}
                        className={
                          runType === "load_test"
                            ? "text-purple-400"
                            : "text-slate-500"
                        }
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {t(
                          "performance_modal.load_testing",
                          "Prueba de Carga (Multi-User)",
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-relaxed">
                      {t(
                        "performance_modal.load_testing_desc",
                        "Simula accesos concurrentes paralelos de múltiples usuarios virtuales (VUs) para probar los límites y estrés del sistema.",
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* CONCURRENT LOAD TEST CONFIGURATION */}
              {runType === "load_test" && (
                <div className="space-y-4 pt-2 border-t border-slate-800/60">
                  {/* ── Profile cards ── */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      {t("performance_modal.test_type", "Tipo de Prueba")}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {[
                        {
                          id: "ramp",
                          icon: TrendingUp,
                          label: "Ramp-Up",
                          desc: "Incremento gradual.",
                          active:
                            "border-emerald-500/70 bg-emerald-500/10 text-emerald-400",
                        },
                        {
                          id: "stepped",
                          icon: TrendingUp,
                          label: "Escalonado",
                          desc: "Pasos progresivos.",
                          active:
                            "border-teal-500/70 bg-teal-500/10 text-teal-400",
                        },
                        {
                          id: "constant",
                          icon: BarChart2,
                          label: "Constante",
                          desc: "Carga fija.",
                          active:
                            "border-blue-500/70 bg-blue-500/10 text-blue-400",
                        },
                        {
                          id: "stress",
                          icon: AlertTriangle,
                          label: "Estrés",
                          desc: "Escala hasta colapso.",
                          active:
                            "border-orange-500/70 bg-orange-500/10 text-orange-400",
                        },
                        {
                          id: "spike",
                          icon: Zap,
                          label: "Spike",
                          desc: "Pico súbito.",
                          active:
                            "border-yellow-500/70 bg-yellow-500/10 text-yellow-400",
                        },
                        {
                          id: "soak",
                          icon: Clock,
                          label: "Soak",
                          desc: "Carga sostenida.",
                          active:
                            "border-purple-500/70 bg-purple-500/10 text-purple-400",
                        },
                      ].map((p) => {
                        const Icon = p.icon;
                        const isActive = profile === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setProfile(p.id)}
                            className={cn(
                              "flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all",
                              isActive
                                ? p.active
                                : "border-slate-800 bg-slate-900/40 text-slate-500 hover:border-slate-700 hover:text-slate-300",
                            )}
                          >
                            <Icon size={14} />
                            <span className="text-[10px] font-semibold">
                              {t("performance_modal.profile_" + p.id, p.label)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* SVG Load Profile Preview */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>
                          {t(
                            "performance_modal.curve_preview",
                            "Vista Previa de la Curva de Carga",
                          )}
                        </span>
                        <span className="text-emerald-400 font-mono">
                          {vus} VUs Max | {duration}s Total
                        </span>
                      </div>
                      <div className="h-14 w-full bg-slate-900/60 rounded-lg p-1.5 flex items-center justify-center border border-slate-800/80">
                        <svg
                          viewBox="0 0 300 60"
                          className="w-full h-full stroke-emerald-400 fill-none stroke-2"
                        >
                          {profile === "stepped" && (
                            <path d="M 10 50 L 50 50 L 50 38 L 90 38 L 90 26 L 130 26 L 130 14 L 230 14 L 280 50" />
                          )}
                          {profile === "ramp" && (
                            <path d="M 10 50 L 80 14 L 220 14 L 280 50" />
                          )}
                          {profile === "constant" && (
                            <path d="M 10 14 L 240 14 L 280 50" />
                          )}
                          {profile === "stress" && (
                            <path d="M 10 50 L 60 40 L 110 30 L 160 20 L 210 10 L 280 50" />
                          )}
                          {profile === "spike" && (
                            <path d="M 10 45 L 80 45 L 90 10 L 160 10 L 170 45 L 280 45" />
                          )}
                          {profile === "soak" && <path d="M 10 20 L 280 20" />}
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* ── Adaptive parameters per profile ── */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* VUs */}
                    {profile !== "soak" && (
                      <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between text-xs font-semibold text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Users size={12} className="text-purple-400" />{" "}
                            {t("performance_modal.target_vus", "VUs Objetivo")}
                          </span>
                          <span className="text-purple-400 font-mono">
                            {vus} VUs
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={vus}
                          onChange={(e) => setVus(Number(e.target.value))}
                          className="w-full accent-purple-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Duration */}
                    <div
                      className={cn(
                        "space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/80",
                        profile === "soak" && "col-span-2",
                      )}
                    >
                      <div className="flex justify-between text-xs font-semibold text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} className="text-purple-400" />{" "}
                          {t(
                            "performance_modal.total_duration",
                            "Duración Total",
                          )}
                        </span>
                        <span className="text-purple-400 font-mono">
                          {profile === "soak"
                            ? `${duration} min`
                            : `${duration}s`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={profile === "soak" ? 5 : 10}
                        max={profile === "soak" ? 60 : 300}
                        step={profile === "soak" ? 5 : 10}
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                    </div>

                    {/* Stepped Options */}
                    {profile === "stepped" && (
                      <>
                        <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex justify-between text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <TrendingUp size={12} className="text-teal-400" />{" "}
                              {t(
                                "performance_modal.steps_count",
                                "N° de Escalones",
                              )}
                            </span>
                            <span className="text-teal-400 font-mono">
                              {stepCount}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="10"
                            value={stepCount}
                            onChange={(e) =>
                              setStepCount(Number(e.target.value))
                            }
                            className="w-full accent-teal-500 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex justify-between text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Clock size={12} className="text-teal-400" />{" "}
                              {t(
                                "performance_modal.ramp_down",
                                "Descenso (Ramp-Down)",
                              )}
                            </span>
                            <span className="text-teal-400 font-mono">
                              {rampDown}s
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="60"
                            step="5"
                            value={rampDown}
                            onChange={(e) =>
                              setRampDown(Number(e.target.value))
                            }
                            className="w-full accent-teal-500 cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                    {profile === "spike" && (
                      <>
                        <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex justify-between text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Users size={12} className="text-yellow-400" />{" "}
                              {t(
                                "performance_modal.base_vus",
                                "Carga Base (VUs)",
                              )}
                            </span>
                            <span className="text-yellow-400 font-mono">
                              {spikeBaseVUs} VUs
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={spikeBaseVUs}
                            onChange={(e) =>
                              setSpikeBaseVUs(Number(e.target.value))
                            }
                            className="w-full accent-yellow-500 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex justify-between text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Zap size={12} className="text-yellow-400" />{" "}
                              {t(
                                "performance_modal.spike_count",
                                "Cantidad de Picos",
                              )}
                            </span>
                            <span className="text-yellow-400 font-mono">
                              {spikeCount} Pico(s)
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={spikeCount}
                            onChange={(e) =>
                              setSpikeCount(Number(e.target.value))
                            }
                            className="w-full accent-yellow-500 cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Cloud SLA Threshold Rules */}
                  <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>
                        {t(
                          "performance_modal.sla_thresholds",
                          "Criterios de Aceptación Cloud (SLA / Thresholds)",
                        )}
                      </span>
                      <span className="text-emerald-400 text-[10px] font-mono">
                        {t("performance_modal.auto_evaluated", "Auto Evaluado")}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400">
                          Max P95 Latencia (ms)
                        </label>
                        <input
                          type="number"
                          min="50"
                          max="10000"
                          value={maxP95Ms}
                          onChange={(e) => setMaxP95Ms(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">
                          Max Error Rate (%)
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          max="50"
                          step="0.5"
                          value={maxErrorRatePct}
                          onChange={(e) =>
                            setMaxErrorRatePct(Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Soak VUs (separate row for soak) */}
                  {profile === "soak" && (
                    <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/80">
                      <div className="flex justify-between text-xs font-semibold text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Users size={12} className="text-purple-400" />{" "}
                          {t(
                            "performance_modal.target_vus",
                            "Usuarios Virtuales",
                          )}
                        </span>
                        <span className="text-purple-400 font-mono">
                          {vus} VUs
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={vus}
                        onChange={(e) => setVus(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ESTIMATED HARDWARE RESOURCES ADVISORY */}
              <div
                className={cn(
                  "p-4 rounded-xl border flex items-start gap-3 transition-colors",
                  isDangerous
                    ? "bg-red-950/20 border-red-900/30 text-red-300"
                    : "bg-slate-900/40 border-slate-800 text-slate-400",
                )}
              >
                <AlertTriangle
                  size={16}
                  className={cn(
                    "mt-0.5 shrink-0",
                    isDangerous ? "text-red-400" : "text-slate-500",
                  )}
                />
                <div>
                  <h4
                    className={cn(
                      "text-xs font-semibold mb-0.5",
                      isDangerous ? "text-red-200" : "text-slate-300",
                    )}
                  >
                    {t(
                      "performance_modal.estimated_resources",
                      "Uso Estimado de Recursos Locales",
                    )}
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    {t(
                      "performance_modal.estimated_resources_desc",
                      "Se ejecutarán instancias de navegador en modo headless para capturar telemetría. Consumo de RAM estimado:",
                    )}{" "}
                    <strong className="font-mono text-blue-400">
                      {estimatedRamGb} GB
                    </strong>
                    .
                  </p>
                  {isDangerous && (
                    <p className="text-[10px] text-red-400 font-semibold mt-1">
                      {t(
                        "performance_modal.oom_warning",
                        "⚠️ Advertencia: Alto consumo de recursos. Podría colapsar la memoria local (OOM). Se aconseja reducir los VUs.",
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-4 border-t border-slate-800 bg-[#0e1321] flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {t("performance_modal.cancel", "Cancelar")}
              </button>
              <button
                type="button"
                onClick={handleLaunch}
                disabled={isSubmitting}
                className={cn(
                  "px-6 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-1.5",
                  runType === "profiling"
                    ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/10"
                    : "bg-purple-600 hover:bg-purple-500 shadow-purple-500/10",
                )}
              >
                <Play size={12} fill="currentColor" />
                {runType === "profiling"
                  ? t("performance_modal.launch_profiling", "Iniciar Perfilado")
                  : t(
                      "performance_modal.launch_load_test",
                      "Lanzar Prueba de Carga",
                    )}
              </button>
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
