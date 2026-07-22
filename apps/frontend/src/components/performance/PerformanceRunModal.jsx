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
import { useExecutionStore } from "@/stores/useExecutionStore";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/useToast";
import { useNavigate } from "react-router-dom";

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

  // Run Type: "profiling" (single user latency) or "load_test" (concurrent)
  const [runType, setRunType] = useState("profiling");

  // Load Test Config
  const [profile, setProfile] = useState("constant");
  const [vus, setVus] = useState(10);
  const [duration, setDuration] = useState(30);
  const [rampUp, setRampUp] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CPU/RAM Resource calculation
  const estimatedRamGb = useMemo(() => {
    const activeVUs = runType === "profiling" ? 1 : profile === "baseline" ? 1 : vus;
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

    try {
      const response = await api.post("/runs/performance", {
        flowId,
        projectId,
        performanceConfig: {
          virtualUsers: vus,
          duration,
          profile,
          rampUp,
          headless: true,
        },
      });

      if (response.success || response.data?.success) {
        toast.dismiss(toastId);
        toast.success("Prueba de carga concurrente lanzada con éxito!");
        onClose();
        // Redirect to performance live view on the dashboard
        navigate("/dashboard", { state: { activePage: "performance" } });
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || response.data?.message || "Error al lanzar la prueba de carga");
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
                    {t("performance_modal.title", "Configurar Ejecución de Performance")}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Flujo: <span className="text-slate-300 font-medium">{flowName || "Sin Nombre"}</span>
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
                        : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700 text-slate-400"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Activity size={16} className={runType === "profiling" ? "text-blue-400" : "text-slate-500"} />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {t("performance_modal.latency_profiling", "Perfilado de Latencia")}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-relaxed">
                      {t("performance_modal.latency_profiling_desc", "Ejecuta el flujo una vez de forma visual. Mide y resalta el tiempo exacto de respuesta de cada paso sobre el lienzo.")}
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
                        : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700 text-slate-400"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Users size={16} className={runType === "load_test" ? "text-purple-400" : "text-slate-500"} />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {t("performance_modal.load_testing", "Prueba de Carga (Multi-User)")}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-relaxed">
                      {t("performance_modal.load_testing_desc", "Simula accesos concurrentes paralelos de múltiples usuarios virtuales (VUs) para probar los límites y estrés del sistema.")}
                    </span>
                  </button>
                </div>
              </div>

              {/* CONCURRENT LOAD TEST CONFIGURATION */}
              {runType === "load_test" && (
                <div className="space-y-4 pt-2 border-t border-slate-800/60">
                  {/* Load profile selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      {t("performance_modal.load_profile", "Perfil de Carga")}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "constant", icon: BarChart2, label: "Constant" },
                        { id: "ramp", icon: TrendingUp, label: "Ramp-Up" },
                        { id: "stress", icon: AlertTriangle, label: "Stress Test" },
                        { id: "spike", icon: Zap, label: "Spike Test" },
                        { id: "endurance", icon: Clock, label: "Endurance" },
                        { id: "capacity", icon: Users, label: "Capacity" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProfile(p.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all",
                            profile === p.id
                              ? "bg-purple-500/10 border-purple-500/40 text-purple-400 font-medium"
                              : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:border-slate-700"
                          )}
                        >
                          <p.icon size={13} />
                          <span className="text-[11px] font-medium">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* VUs and Duration Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 bg-slate-900/30 p-4 rounded-xl border border-slate-850">
                      <div className="flex justify-between text-xs font-semibold text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Users size={14} className="text-purple-400" /> {t("performance_modal.max_vus", "VUs Máximos")}
                        </span>
                        <span className="text-purple-400 font-mono">{vus} VUs</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={vus}
                        onChange={(e) => setVus(Number(e.target.value))}
                        className="w-full accent-purple-500 mt-2 cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-500 block mt-1">
                        Número de instancias paralelas concurrentes a simular.
                      </span>
                    </div>

                    <div className="space-y-1.5 bg-slate-900/30 p-4 rounded-xl border border-slate-850">
                      <div className="flex justify-between text-xs font-semibold text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-purple-400" /> {t("performance_modal.total_duration", "Duración Total")}
                        </span>
                        <span className="text-purple-400 font-mono">{duration}s</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="300"
                        step="10"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full accent-purple-500 mt-2 cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-500 block mt-1">
                        Límite máximo de duración del ciclo de carga en segundos.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ESTIMATED HARDWARE RESOURCES ADVISORY */}
              <div
                className={cn(
                  "p-4 rounded-xl border flex items-start gap-3 transition-colors",
                  isDangerous
                    ? "bg-red-950/20 border-red-900/30 text-red-300"
                    : "bg-slate-900/40 border-slate-800 text-slate-400"
                )}
              >
                <AlertTriangle
                  size={16}
                  className={cn("mt-0.5 shrink-0", isDangerous ? "text-red-400" : "text-slate-500")}
                />
                <div>
                  <h4 className={cn("text-xs font-semibold mb-0.5", isDangerous ? "text-red-200" : "text-slate-300")}>
                    {t("performance_modal.estimated_resources", "Uso Estimado de Recursos Locales")}
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    Se ejecutarán instancias de navegador en modo headless para capturar telemetría. Consumo de RAM estimado:{" "}
                    <strong className="font-mono text-blue-400">{estimatedRamGb} GB</strong>.
                  </p>
                  {isDangerous && (
                    <p className="text-[10px] text-red-400 font-semibold mt-1">
                      ⚠️ Advertencia: Alto consumo de recursos. Podría colapsar la memoria local (OOM). Se aconseja reducir los VUs.
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
                    : "bg-purple-600 hover:bg-purple-500 shadow-purple-500/10"
                )}
              >
                <Play size={12} fill="currentColor" />
                {runType === "profiling"
                  ? t("performance_modal.launch_profiling", "Iniciar Perfilado")
                  : t("performance_modal.launch_load_test", "Lanzar Prueba de Carga")}
              </button>
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
