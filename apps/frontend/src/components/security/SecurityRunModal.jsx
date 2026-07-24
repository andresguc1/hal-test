import React, { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { X, Shield, Play, AlertTriangle, Lock, LockOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useExecutionStore } from "@/stores/useExecutionStore";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/useToast";
import { useNavigate } from "react-router-dom";

export default function SecurityRunModal({
  isOpen,
  onClose,
  flowId,
  projectId,
  onRunSecurity,
  flowName,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  // "policy_compliance", "data_leak_prevention"
  const [scanType, setScanType] = useState("policy_compliance");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLaunch = async () => {
    if (!flowId) {
      toast.info(
        t(
          "common.select_default",
          "Selecciona un flujo de automatización válido.",
        ),
      );
      return;
    }

    useExecutionStore.getState().startExecution({ mode: "seguridad", flowId });
    setIsSubmitting(true);
    const toastId = toast.loading(t("common.processing", "Procesando..."));

    try {
      const response = await api.post("/runs/security", {
        flowId,
        projectId,
        securityConfig: {
          scanType,
          headless: true,
        },
      });

      if (response.success || response.data?.success) {
        toast.dismiss(toastId);
        toast.success(
          t(
            "common.flow_exec_success",
            "Auditoría pasiva de seguridad lanzada con éxito!",
          ),
        );
        onClose();
        navigate("/dashboard", {
          state: { activePage: "security", activeTab: "live" },
        });
      } else {
        console.warn("[SecurityRunModal] Falling back to standard execution");
        if (onRunSecurity) onRunSecurity({ executionMode: "seguridad" });
        toast.dismiss(toastId);
        onClose();
      }
    } catch (error) {
      console.warn(
        "[SecurityRunModal] Error hitting /runs/security, falling back to onRunSecurity",
        error,
      );
      toast.dismiss(toastId);
      if (onRunSecurity) onRunSecurity({ executionMode: "seguridad" });
      onClose();
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
            className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] bg-[#0c0f17] border border-red-500/20 shadow-2xl shadow-red-500/5 rounded-2xl flex flex-col overflow-hidden text-slate-300 font-sans"
          >
            {/* HEADER */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-[#0e1321]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <Shield size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
                    {t(
                      "security_modal.title",
                      "Configurar Auditoría de Seguridad (Quality Gate)",
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {t("security_modal.target_flow", "Target Flow:")}{" "}
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
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {t(
                    "security_modal.subtitle",
                    "Auditorías de Confianza Activas",
                  )}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Policy Compliance option */}
                  <button
                    type="button"
                    onClick={() => setScanType("policy_compliance")}
                    className={cn(
                      "flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                      scanType === "policy_compliance"
                        ? "bg-red-500/10 border-red-500/80 text-slate-200 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                        : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700 text-slate-400",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Lock
                        size={16}
                        className={
                          scanType === "policy_compliance"
                            ? "text-red-400"
                            : "text-slate-500"
                        }
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {t(
                          "security_modal.policy_compliance",
                          "Cumplimiento de Políticas",
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-relaxed">
                      {t(
                        "security_modal.policy_compliance_desc",
                        "Audita cabeceras de respuesta HTTP (CSP, HSTS, X-Frame-Options) y la seguridad de las cookies de sesión.",
                      )}
                    </span>
                  </button>

                  {/* Data Leak & DOM Protection Option */}
                  <button
                    type="button"
                    onClick={() => setScanType("data_leak_prevention")}
                    className={cn(
                      "flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                      scanType === "data_leak_prevention"
                        ? "bg-red-500/10 border-red-500/80 text-slate-200 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                        : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700 text-slate-400",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <LockOpen
                        size={16}
                        className={
                          scanType === "data_leak_prevention"
                            ? "text-red-400"
                            : "text-slate-500"
                        }
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {t(
                          "security_modal.data_leak",
                          "Fugas y Protección de Datos",
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-relaxed">
                      {t(
                        "security_modal.data_leak_desc",
                        "Monitorea datos sensibles en el DOM, previene la transmisión de texto plano (HTTP) y audita entradas vulnerables.",
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* WARNING SECTION */}
              <div className="p-4 rounded-xl border flex items-start gap-3 transition-colors bg-slate-900/40 border-slate-800 text-slate-400 mt-2">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-red-500/80"
                />
                <div>
                  <h4 className="text-xs font-semibold mb-0.5 text-slate-300">
                    {t(
                      "security_modal.warning_title",
                      "Aviso de Auditoría No Intrusiva (Quality Gate)",
                    )}
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    {t(
                      "security_modal.warning_desc",
                      "La auditoría de seguridad se realiza de forma pasiva y no destructiva durante la ejecución normal del flujo E2E, sirviendo como un Quality Gate que genera alertas de confianza sin bloquear la ejecución ni sobrecargar el servidor objetivo.",
                    )}
                  </p>
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
                {t("common.cancel", "Cancelar")}
              </button>
              <button
                type="button"
                onClick={handleLaunch}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg text-xs font-bold text-white shadow-lg bg-red-600 hover:bg-red-550 shadow-red-500/10 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Play size={12} fill="currentColor" />
                {t("security_modal.start_audit", "Iniciar Auditoría")}
              </button>
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
