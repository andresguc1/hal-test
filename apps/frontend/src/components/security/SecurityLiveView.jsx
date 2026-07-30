import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Square,
  Sparkles,
  ArrowRight,
  Shield,
  Search,
  Filter,
  Zap,
  Layers,
  ChevronDown,
  X,
  FileCode,
} from "lucide-react";

export default function SecurityLiveView({
  status, // 'idle' | 'preparing' | 'running' | 'completed' | 'failed'
  progressPercent = 0,
  currentNode,
  liveAlerts = [],
  onStopExecution,
  onViewResults,
}) {
  const { t } = useTranslation();
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [selectedAlertDetails, setSelectedAlertDetails] = useState(null);

  const isRunning = status === "running" || status === "preparing";

  // Calculate live counters
  const criticalCount = liveAlerts.filter(
    (a) => a.severity === "critical" || a.severity === "high",
  ).length;
  const mediumCount = liveAlerts.filter((a) => a.severity === "medium").length;
  const lowCount = liveAlerts.filter(
    (a) => a.severity === "low" || a.severity === "info",
  ).length;

  const filteredLiveAlerts = liveAlerts.filter((a) => {
    if (filterSeverity === "all") return true;
    if (filterSeverity === "critical")
      return a.severity === "critical" || a.severity === "high";
    return a.severity === filterSeverity;
  });

  // Vector categorization for security control monitor
  const headerAlerts = liveAlerts.filter(
    (a) =>
      a.ruleId?.includes("HDR") ||
      a.ruleId?.includes("HEADER") ||
      a.message?.toLowerCase().includes("header") ||
      a.message?.toLowerCase().includes("csp") ||
      a.message?.toLowerCase().includes("hsts") ||
      a.message?.toLowerCase().includes("x-frame"),
  );

  const cookieAlerts = liveAlerts.filter(
    (a) =>
      a.ruleId?.includes("COOKIE") ||
      a.message?.toLowerCase().includes("cookie") ||
      a.message?.toLowerCase().includes("samesite") ||
      a.message?.toLowerCase().includes("httponly"),
  );

  const storageAlerts = liveAlerts.filter(
    (a) =>
      a.ruleId?.includes("STORE") ||
      a.message?.toLowerCase().includes("localstorage") ||
      a.message?.toLowerCase().includes("token") ||
      a.message?.toLowerCase().includes("plaintext"),
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Banner: Progress Bar, RPS Telemetry and Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div
              className={`p-3 rounded-xl border ${
                isRunning
                  ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  : status === "completed"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              <Activity size={24} />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-100">
                  {status === "preparing" &&
                    t(
                      "security_live.status_preparing",
                      "Inicializando Escaneo DAST...",
                    )}
                  {status === "running" &&
                    t(
                      "security_live.status_running",
                      "Auditoría de Seguridad en Curso",
                    )}
                  {status === "completed" &&
                    t(
                      "security_live.status_completed",
                      "Auditoría Completada Exitosamente",
                    )}
                  {status === "failed" &&
                    t("security_live.status_failed", "Auditoría Interrumpida")}
                  {status === "idle" &&
                    t(
                      "security_live.status_idle",
                      "Esperando Ejecución de Auditoría",
                    )}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isRunning
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {isRunning && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                    </span>
                  )}
                  <span>{status}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                <span>
                  {currentNode
                    ? `${t("security_live.analyzing", "Analizando")}: "${currentNode.name || currentNode.id}"`
                    : t(
                        "security_live.monitoring_desc",
                        "Monitoreando peticiones HTTP, cabeceras del servidor y sanitización DOM...",
                      )}
                </span>
                {isRunning && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-mono font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Zap size={12} />
                    <span>38 req/s</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isRunning && onStopExecution && (
              <button
                type="button"
                onClick={onStopExecution}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <Square size={14} />
                <span>
                  {t("security_live.stop_audit", "Detener Auditoría")}
                </span>
              </button>
            )}

            {status === "completed" && onViewResults && (
              <button
                type="button"
                onClick={onViewResults}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <span>
                  {t("security_live.view_full_report", "Ver Informe Completo")}
                </span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>
              {t(
                "security_live.graph_progress",
                "Progreso del Grafo de Pruebas",
              )}
            </span>
            <span className="text-slate-200 font-bold">
              {Math.round(progressPercent)}%
            </span>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/80 p-0.5 relative">
            <motion.div
              className={`h-full rounded-full ${
                status === "completed"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  : "bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-[0_0_12px_rgba(225,29,72,0.5)]"
              }`}
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, Math.max(0, progressPercent))}%`,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Live Findings Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-red-400">
              {criticalCount}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {t("security_live.critical_high", "Críticas / Altas")}
            </div>
          </div>
          <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/30 text-red-400">
            <ShieldAlert size={20} />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {mediumCount}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {t("security_live.medium_severity", "Severidad Media")}
            </div>
          </div>
          <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30 text-amber-400">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-blue-400">
              {lowCount}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {t("security_live.low_info", "Bajas / Informativas")}
            </div>
          </div>
          <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/30 text-blue-400">
            <Shield size={20} />
          </div>
        </div>
      </div>

      {/* Matriz de Control de Seguridad y Escaneo de Vectores DAST */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={18} className="text-red-400" />
            <h4 className="text-sm font-bold text-slate-100">
              {t(
                "security_live.matrix_title",
                "Matriz de Control de Seguridad y Escaneo de Vectores DAST",
              )}
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              {t("security_live.standard_target", "OWASP ASVS 14.4 & Top 10")}
            </span>
          </div>
        </div>

        {/* Security Vector Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-3">
          {/* Vector 1: HTTP Security Headers */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield size={15} className="text-red-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {t("security_live.vector_headers", "HTTP Security Headers")}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  headerAlerts.length > 0
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                {headerAlerts.length > 0
                  ? `${headerAlerts.length} ${t("security_live.observations", "Observaciones")}`
                  : t("security_live.protected", "Protegido")}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t(
                "security_live.vector_headers_desc",
                "Inspección pasiva de Strict-Transport-Security, CSP, X-Frame-Options y X-Content-Type.",
              )}
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
              <span>HSTS / CSP / XFO / XCTO</span>
              <span className="text-slate-400">ASVS 14.4.1 - 14.4.4</span>
            </div>
          </div>

          {/* Vector 2: SSL/TLS & Transport Encryption */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield size={15} className="text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {t(
                    "security_live.vector_tls",
                    "Transporte TLS / Criptografía",
                  )}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {t("security_live.https_secure", "HTTPS Seguro")}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t(
                "security_live.vector_tls_desc",
                "Verificación de cifrado HTTPS en tránsito, validez de certificados TLS y cipher suites.",
              )}
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
              <span>TLS 1.2 / 1.3 Strong Ciphers</span>
              <span className="text-slate-400">ASVS 9.1.1</span>
            </div>
          </div>

          {/* Vector 3: Cookie Flags & Session Tokens */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode size={15} className="text-amber-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {t(
                    "security_live.vector_cookies",
                    "Seguridad de Cookies & Sesión",
                  )}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  cookieAlerts.length > 0
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                {cookieAlerts.length > 0
                  ? `${cookieAlerts.length} ${t("security_live.observations", "Observaciones")}`
                  : t("security_live.validated", "Validado")}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t(
                "security_live.vector_cookies_desc",
                "Auditoría de atributos HttpOnly, Secure y SameSite en cookies de autenticación de usuario.",
              )}
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
              <span>HttpOnly / Secure / SameSite</span>
              <span className="text-slate-400">ASVS 3.4.1</span>
            </div>
          </div>

          {/* Vector 4: Storage & Token Leakage */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={15} className="text-blue-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {t(
                    "security_live.vector_storage",
                    "Almacenamiento Local & Tokens",
                  )}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  storageAlerts.length > 0
                    ? "bg-red-500/20 text-red-300 border border-red-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                {storageAlerts.length > 0
                  ? t("security_live.leak_detected", "Fuga Detectada")
                  : t("security_live.clean", "Limpio")}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t(
                "security_live.vector_storage_desc",
                "Monitoreo contra almacenamiento de tokens JWT o credenciales sensibles en LocalStorage en texto plano.",
              )}
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
              <span>LocalStorage & SessionStorage</span>
              <span className="text-slate-400">ASVS 8.3.1</span>
            </div>
          </div>

          {/* Vector 5: Input Sanitization & XSS Prevention */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap size={15} className="text-red-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {t(
                    "security_live.vector_sanitizing",
                    "Sanitización & Inyecciones",
                  )}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {t("security_live.active_filters", "Filtros Activos")}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t(
                "security_live.vector_sanitizing_desc",
                "Inspección contra inyección XSS Reflejado/Persistente y enlaces vulnerables a javascript: URIs.",
              )}
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
              <span>DOM XSS / Injection Vectors</span>
              <span className="text-slate-400">ASVS 5.3.1</span>
            </div>
          </div>

          {/* Vector 6: Privacy & Data Disclosure */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity size={15} className="text-purple-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {t(
                    "security_live.vector_disclosure",
                    "Fuga de Información Server",
                  )}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {t("security_live.no_leaks", "Sin Fugas")}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t(
                "security_live.vector_disclosure_desc",
                "Verificación de cabeceras Server / X-Powered-By para prevenir la divulgación de tecnologías del servidor.",
              )}
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
              <span>Fingerprinting Disclosure</span>
              <span className="text-slate-400">ASVS 14.3.1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Alerts Telemetry Stream */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-3">
          <div className="flex items-center space-x-2">
            <Sparkles size={16} className="text-red-400 animate-pulse" />
            <h4 className="text-sm font-bold text-slate-200">
              {t(
                "security_live.feed_title",
                "Feed de Alertas Detectadas en Tiempo Real",
              )}{" "}
              ({liveAlerts.length})
            </h4>
          </div>

          {/* Interactive Severity Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {[
              { id: "all", label: t("security_live.all", "Todas") },
              {
                id: "critical",
                label: `${t("security_live.high_short", "Altas")} (${criticalCount})`,
              },
              {
                id: "medium",
                label: `${t("security_live.medium_short", "Medias")} (${mediumCount})`,
              },
              {
                id: "low",
                label: `${t("security_live.low_short", "Bajas")} (${lowCount})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterSeverity(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                  filterSeverity === f.id
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredLiveAlerts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto text-slate-500">
              <Search size={20} />
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isRunning
                ? t(
                    "security_live.scan_idle_msg",
                    "El motor de escaneo está analizando los nodos. Las vulnerabilidades detectadas aparecerán aquí al instante.",
                  )
                : t(
                    "security_live.scan_start_hint",
                    "Inicia la auditoría para comenzar la inspección pasiva en tiempo real.",
                  )}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {filteredLiveAlerts.map((alert, idx) => (
                <motion.div
                  key={alert.id || idx}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedAlertDetails(alert)}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-red-500/40 cursor-pointer flex items-start justify-between gap-3 text-xs transition-all group"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          alert.severity === "high" ||
                          alert.severity === "critical"
                            ? "bg-red-500/20 text-red-300 border border-red-500/40"
                            : alert.severity === "medium"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="font-mono text-slate-200 font-semibold group-hover:text-red-400 transition-colors">
                        {alert.ruleId}
                      </span>
                    </div>
                    <p className="text-slate-300">
                      {alert.message || alert.description || alert.title}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                      {new Date(
                        alert.timestamp || Date.now(),
                      ).toLocaleTimeString()}
                    </span>
                    <FileCode
                      size={14}
                      className="text-slate-600 group-hover:text-slate-300"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Interactive Alert Detail Modal */}
      {selectedAlertDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedAlertDetails(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-2">
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                  selectedAlertDetails.severity === "high" ||
                  selectedAlertDetails.severity === "critical"
                    ? "bg-red-500/20 text-red-300 border border-red-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
              >
                {selectedAlertDetails.severity}
              </span>
              <h3 className="font-mono font-bold text-slate-100 text-base">
                {selectedAlertDetails.ruleId}
              </h3>
            </div>

            <p className="text-sm text-slate-300">
              {selectedAlertDetails.message || selectedAlertDetails.description}
            </p>

            {selectedAlertDetails.recommendation && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="text-xs font-mono font-bold text-red-400 uppercase">
                  Recomendación Remediativa:
                </div>
                <p className="text-xs text-slate-300">
                  {selectedAlertDetails.recommendation}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedAlertDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
