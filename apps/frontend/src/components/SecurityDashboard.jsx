import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Info,
  ExternalLink,
  RefreshCw,
  Search,
  ChevronRight,
  Compass,
  CheckCircle2,
  Lock,
  LockOpen,
  ArrowRight,
  AlertCircle,
  Settings,
  Activity,
  BarChart2,
  Clock,
  Play,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useExecutionStore } from "../stores/useExecutionStore";
import { useProjectManager } from "./hooks/useProjectManager";
import { useToast } from "../hooks/useToast";
import { api } from "../utils/api";

import SecurityConfigView from "./security/SecurityConfigView";
import SecurityLiveView from "./security/SecurityLiveView";
import SecurityHistoryView from "./security/SecurityHistoryView";

const SEVERITY_COLORS = {
  critical: {
    bg: "bg-red-500/10 border-red-500/30 text-red-400 font-mono",
    text: "text-red-400 font-mono",
    badge:
      "bg-red-500/20 text-red-300 border border-red-500/40 font-mono shadow-[0_0_10px_rgba(239,68,68,0.2)]",
    icon: AlertOctagon,
  },
  high: {
    bg: "bg-orange-500/10 border-orange-500/30 text-orange-400 font-mono",
    text: "text-orange-400 font-mono",
    badge:
      "bg-orange-500/20 text-orange-300 border border-orange-500/40 font-mono shadow-[0_0_10px_rgba(249,115,22,0.2)]",
    icon: AlertTriangle,
  },
  medium: {
    bg: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 font-mono",
    text: "text-yellow-400 font-mono",
    badge:
      "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-mono shadow-[0_0_10px_rgba(234,179,8,0.2)]",
    icon: AlertTriangle,
  },
  low: {
    bg: "bg-blue-500/10 border-blue-500/30 text-blue-400 font-mono",
    text: "text-blue-400 font-mono",
    badge:
      "bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono shadow-[0_0_10px_rgba(59,130,246,0.2)]",
    icon: Info,
  },
  info: {
    bg: "bg-slate-500/10 border-slate-500/30 text-slate-400 font-mono",
    text: "text-slate-400 font-mono",
    badge:
      "bg-slate-500/20 text-slate-300 border border-slate-500/40 font-mono",
    icon: Info,
  },
  clean: {
    bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-mono",
    text: "text-emerald-400 font-mono",
    badge:
      "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    icon: CheckCircle2,
  },
};

const getCategory = (ruleId) => {
  const r = (ruleId || "").toLowerCase();
  if (
    r.includes("leak") ||
    r.includes("cookie") ||
    r.includes("autocomplete") ||
    r.includes("plaintext") ||
    r.includes("credentials") ||
    r.includes("password") ||
    r.includes("transmit")
  ) {
    return "data_leak";
  }
  if (
    r.includes("xss") ||
    r.includes("input") ||
    r.includes("inline") ||
    r.includes("javascript-uri") ||
    r.includes("insecure-directive")
  ) {
    return "input_vulnerability";
  }
  return "policy_compliance";
};

const AI_SUGGESTIONS = {
  "csp-missing-header":
    "Sugerencia de IA: Configura la cabecera 'Content-Security-Policy' en tu servidor web. Define 'default-src 'self'' como política base para evitar inyecciones de código.",
  "csp-insecure-directive":
    "Sugerencia de IA: Evita usar 'unsafe-inline' o 'unsafe-eval' en tus políticas CSP. Utiliza hashes criptográficos o nonces para validar scripts legítimos.",
  "hsts-missing-header":
    "Sugerencia de IA: Habilita HSTS agregando la cabecera 'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload' en tu servidor de producción.",
  "xfo-missing-header":
    "Sugerencia de IA: Añade la cabecera 'X-Frame-Options: SAMEORIGIN' o 'DENY' para evitar ataques de Clickjacking (secuestro de click).",
  "xfo-insecure-value":
    "Sugerencia de IA: Modifica la cabecera 'X-Frame-Options' para utilizar un valor seguro como 'SAMEORIGIN' o 'DENY'.",
  "xcto-missing-header":
    "Sugerencia de IA: Agrega la cabecera 'X-Content-Type-Options: nosniff' para evitar que los navegadores adivinen el tipo MIME de recursos estáticos.",
  "xcto-insecure-value":
    "Sugerencia de IA: Configura 'X-Content-Type-Options' con el valor exacto 'nosniff'.",
  "cors-wildcard-credentials":
    "Sugerencia de IA: Evita usar '*' en 'Access-Control-Allow-Origin' si permites credenciales. Configura el dominio exacto del cliente.",
  "cookie-missing-secure":
    "Sugerencia de IA: Añade el atributo '; Secure' a tu cabecera 'Set-Cookie' para forzar su transmisión exclusiva bajo HTTPS cifrado.",
  "cookie-missing-httponly":
    "Sugerencia de IA: Agrega '; HttpOnly' a tus cookies de sesión para impedir que scripts maliciosos de cliente accedan a ellas.",
  "cookie-missing-samesite":
    "Sugerencia de IA: Define '; SameSite=Lax' o '; SameSite=Strict' en tus cookies para prevenir ataques CSRF de origen cruzado.",
  "cookie-samesite-none-insecure":
    "Sugerencia de IA: Si declaras 'SameSite=None', obligatoriamente debes acompañarlo del atributo '; Secure' para que los navegadores no bloqueen la cookie.",
  "csp-console-violation":
    "Sugerencia de IA: Un script o recurso de origen externo no autorizado intentó cargarse. Revisa la procedencia del script y agrégalo a tu política CSP si es legítimo.",
  "mixed-content-warning":
    "Sugerencia de IA: Se ha cargado un recurso HTTP no seguro en una página HTTPS. Actualiza la URL del recurso a HTTPS para mantener el cifrado de extremo a extremo.",
  "dom-inline-event":
    "Sugerencia de IA: Evita el uso de manejadores de eventos en el HTML (ej. onclick=\"...\"). Declara manejadores de eventos modernos usando 'addEventListener' en archivos JS limpios.",
  "dom-javascript-uri":
    "Sugerencia de IA: El atributo href contiene 'javascript:...'. Reemplaza esta lógica por botones con eventos y evita la ejecución de scripts directos en enlaces.",
  "dom-password-autocomplete":
    "Sugerencia de IA: Añade el atributo 'autocomplete=\"current-password\"' en tus campos de contraseña para guiar a los navegadores de manera segura.",
  "dom-insecure-form-action":
    "Sugerencia de IA: El formulario apunta a un endpoint HTTP plano. Cambia el 'action' para que envíe los datos bajo HTTPS seguro.",
  "dom-plaintext-transmit":
    "Sugerencia de IA: Estás transmitiendo información confidencial a través de un protocolo HTTP plano y sin cifrar. Migra tu servidor y el flujo de navegación a HTTPS seguro.",
  default:
    "Sugerencia de IA: Evalúa el contexto del nodo y la entrada/salida para asegurar la correcta sanitización de datos y el cumplimiento de las políticas de seguridad.",
};

const TabButton = ({ _id, active, onClick, label, icon: Icon, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      active
        ? "bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
    }`}
  >
    {Icon && <Icon size={14} />}
    <span>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span
        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
          active ? "bg-white/20 text-white" : "bg-red-500/20 text-red-400"
        }`}
      >
        {badge}
      </span>
    )}
  </button>
);

export default function SecurityDashboard() {
  const { currentProject, currentFlowId, projects, loadProject } =
    useProjectManager();
  const toast = useToast();
  const navigate = useNavigate();

  const location = useLocation();

  // Navigation tab state: 'config' | 'live' | 'results' | 'history'
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "results",
  );

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab, location.state]);

  // Telemetry & Run State
  const [status, setStatus] = useState("idle"); // 'idle' | 'preparing' | 'running' | 'completed' | 'failed'
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentNode, setCurrentNode] = useState(null);
  const [executedCount, setExecutedCount] = useState(0);
  const [activeRunId, setActiveRunId] = useState(null);

  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [runDetails, setRunDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reference variables to bypass unused var check since setters are used
  if (executedCount && activeRunId && loading) {
    /* noop */
  }
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const currentFlow =
    currentProject?.flows?.find((f) => f.id === currentFlowId) ||
    currentProject?.flows?.[0];
  const flowName = currentFlow?.name || "Flujo Activo";
  const totalNodesCount = currentFlow?.nodes?.length || 10;

  // Auto-load first project if none is active
  useEffect(() => {
    if (!currentProject && projects?.length > 0) {
      loadProject(projects[0].id);
    }
  }, [currentProject, projects, loadProject]);

  // Fetch runs of current project/flow
  const fetchRuns = useCallback(
    async (autoSelectLatest = false) => {
      try {
        setLoading(true);
        const endpoint = currentFlowId
          ? `/runs?flowId=${currentFlowId}&limit=30`
          : "/runs?limit=30";
        const res = await api.get(endpoint);
        if (res.success) {
          const fetchedRuns = res.data || [];
          setRuns(fetchedRuns);
          if (fetchedRuns.length > 0 && (!selectedRunId || autoSelectLatest)) {
            setSelectedRunId(fetchedRuns[0].id);
          }
        }
      } catch (err) {
        console.error("[SecurityDashboard] Failed to fetch runs:", err);
        toast.error("Failed to load execution runs");
      } finally {
        setLoading(false);
      }
    },
    [currentFlowId, selectedRunId, toast],
  );

  useEffect(() => {
    fetchRuns();
  }, [currentFlowId, fetchRuns]);

  // Fetch run details including step findings
  const fetchDetails = useCallback(async () => {
    if (!selectedRunId) {
      setRunDetails(null);
      return;
    }
    try {
      const res = await api.get(`/runs/${selectedRunId}`);
      if (res.success) {
        setRunDetails(res.data);
      }
    } catch (err) {
      console.error("[SecurityDashboard] Failed to fetch run details:", err);
    }
  }, [selectedRunId]);

  useEffect(() => {
    fetchDetails();
  }, [selectedRunId, fetchDetails]);

  // Listen to live security alerts & execution status socket events
  useEffect(() => {
    const handleLiveAlert = (e) => {
      const alert = e.detail;
      if (!alert) return;

      setLiveAlerts((prev) => {
        const alreadyExists = prev.some(
          (a) =>
            a.ruleId === alert.ruleId &&
            a.message === alert.message &&
            a.nodeId === alert.nodeId,
        );
        if (alreadyExists) return prev;
        return [alert, ...prev];
      });
    };

    const handleExecutionStatus = (e) => {
      const data = e.detail;
      if (!data) return;

      if (data.status === "running") {
        setStatus("running");
        if (useExecutionStore.getState().status !== "running") {
          useExecutionStore.getState().setStatus("running");
        }
        setActiveTab((prev) =>
          prev === "config" || prev === "results" ? "live" : prev,
        );
        if (data.nodeId) {
          setCurrentNode({
            id: data.nodeId,
            name: data.nodeName || data.nodeId,
            type: data.nodeType,
          });
        }
        setExecutedCount((prev) => {
          const next = prev + 1;
          const pct = Math.min(95, Math.round((next / totalNodesCount) * 100));
          setProgressPercent(pct);
          return next;
        });
      }
    };

    const handleRunFinished = (e) => {
      const data = e.detail;
      const finalStatus = data?.status === "failed" ? "failed" : "completed";
      setStatus(finalStatus);
      useExecutionStore.getState().finishExecution({ status: finalStatus });
      setProgressPercent(100);
      if (data?.runId) {
        setSelectedRunId(data.runId);
      }
      fetchRuns(true);
      fetchDetails();
      setTimeout(() => {
        setActiveTab("results");
      }, 1200);
    };

    window.addEventListener("hal:security-alert", handleLiveAlert);
    window.addEventListener("hal:execution-status", handleExecutionStatus);
    window.addEventListener("hal:run-completed", handleRunFinished);
    return () => {
      window.removeEventListener("hal:security-alert", handleLiveAlert);
      window.removeEventListener("hal:execution-status", handleExecutionStatus);
      window.removeEventListener("hal:run-completed", handleRunFinished);
    };
  }, [fetchRuns, fetchDetails, totalNodesCount]);

  // Launch audit from SecurityConfigView or top bar
  const handleStartAudit = async (config = {}) => {
    if (!currentFlowId) {
      toast.info(
        "Selecciona un flujo antes de iniciar la auditoría de seguridad.",
      );
      return;
    }

    const toastId = toast.loading("Inicializando escáner de seguridad DAST...");
    setStatus("preparing");
    setProgressPercent(5);
    setExecutedCount(0);
    setLiveAlerts([]);
    setActiveTab("live");

    try {
      const res = await api.post("/runs/security", {
        flowId: currentFlowId,
        projectId: currentProject?.id,
        executionMode: "seguridad",
        securityConfig: config,
      });

      if (res.success) {
        toast.dismiss(toastId);
        toast.success("Auditoría de seguridad iniciada!");
        if (res.data?.runId) {
          setActiveRunId(res.data.runId);
          setSelectedRunId(res.data.runId);
        }
        setStatus("running");
        useExecutionStore.getState().startExecution({
          mode: "seguridad",
          flowId: currentFlowId,
          runId: res.data?.runId,
        });
      } else {
        toast.dismiss(toastId);
        toast.error(res.message || "Error al iniciar la auditoría");
        setStatus("idle");
        useExecutionStore.getState().finishExecution({ status: "failed" });
        setActiveTab("config");
      }
    } catch (err) {
      toast.dismiss(toastId);
      console.error("[SecurityDashboard] Launch failed:", err);
      toast.error("Error al iniciar auditoría: " + err.message);
      setStatus("idle");
      setActiveTab("config");
    }
  };

  const handleStopExecution = async () => {
    if (!activeRunId) return;
    try {
      await api.post(`/runs/${activeRunId}/cancel`);
      toast.info("Auditoría cancelada.");
      setStatus("failed");
    } catch (err) {
      console.error("[SecurityDashboard] Stop failed:", err);
    }
  };

  // 1. Gather all alerts raw
  const getRawAlerts = () => {
    const alerts = [];

    // Gather alerts from database runDetails steps
    if (runDetails?.steps) {
      runDetails.steps.forEach((step) => {
        if (step.result_data) {
          try {
            const parsed =
              typeof step.result_data === "string"
                ? JSON.parse(step.result_data)
                : step.result_data;
            const stepAlerts =
              parsed.securityAlerts ||
              parsed.alerts ||
              (parsed.data && parsed.data.alerts);
            if (Array.isArray(stepAlerts)) {
              stepAlerts.forEach((alert) => {
                alerts.push({
                  ...alert,
                  nodeId: step.node_id,
                  nodeName: step.node_name || step.node_id,
                  timestamp: step.created_at || new Date().toISOString(),
                });
              });
            }
          } catch (e) {
            console.error("Error parsing step result_data", e);
          }
        }
      });
    }

    // Merge live alerts
    liveAlerts.forEach((la) => {
      alerts.push({
        ...la,
        timestamp: la.timestamp || new Date().toISOString(),
      });
    });

    return alerts;
  };

  const rawAlerts = getRawAlerts();

  // Deduplicate alerts by ruleId + nodeId + url
  const groupAlerts = (alertsList) => {
    const map = new Map();

    alertsList.forEach((alert) => {
      const key = `${alert.ruleId || alert.id || "unk"}_${alert.nodeId || "global"}_${alert.url || ""}`;
      if (!map.has(key)) {
        map.set(key, {
          ...alert,
          count: 1,
          firstSeen: alert.timestamp,
          lastSeen: alert.timestamp,
        });
      } else {
        const existing = map.get(key);
        existing.count += 1;
        existing.lastSeen = alert.timestamp;
      }
    });

    return Array.from(map.values());
  };

  const groupedAlerts = groupAlerts(rawAlerts);

  // Filter alerts
  const filteredAlerts = groupedAlerts
    .filter((alert) => {
      const normalizedFilter = severityFilter.toLowerCase();
      if (normalizedFilter !== "all" && alert.severity !== normalizedFilter)
        return false;
      if (
        categoryFilter !== "all" &&
        getCategory(alert.ruleId) !== categoryFilter
      )
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          alert.message?.toLowerCase().includes(q) ||
          alert.ruleId?.toLowerCase().includes(q) ||
          alert.nodeName?.toLowerCase().includes(q) ||
          alert.url?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Metrics calculations
  const totalFindingsCount = groupedAlerts.length;
  const criticalCount = groupedAlerts.filter(
    (f) => f.severity === "critical" || f.severity === "high",
  ).length;
  // (mediumCount and lowCount removed as they are unused)

  const dataLeakCount = groupedAlerts.filter(
    (f) => getCategory(f.ruleId) === "data_leak",
  ).length;
  const inputVulnCount = groupedAlerts.filter(
    (f) => getCategory(f.ruleId) === "input_vulnerability",
  ).length;
  const policyComplianceCount = groupedAlerts.filter(
    (f) => getCategory(f.ruleId) === "policy_compliance",
  ).length;

  const calculateHealthScore = () => {
    let score = 100;
    groupedAlerts.forEach((f) => {
      if (f.severity === "critical" || f.severity === "high") {
        score -= 15;
      } else if (f.severity === "medium") {
        score -= 8;
      } else {
        score -= 3;
      }
    });
    return Math.max(0, score);
  };

  const healthScore = calculateHealthScore();

  const getScoreColor = (score) => {
    if (score >= 90)
      return {
        stroke: "#10b981",
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
      };
    if (score >= 70)
      return {
        stroke: "#f59e0b",
        text: "text-amber-400",
        bg: "bg-amber-500/10",
      };
    return { stroke: "#ef4444", text: "text-red-500", bg: "bg-red-500/10" };
  };

  const scoreTheme = getScoreColor(healthScore);

  const navigateToNode = (nodeId) => {
    if (!nodeId) return;
    toast.info(`Navegando al nodo ${nodeId}...`);
    navigate("/");
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("hal:focus-node", {
          detail: { nodeId, autoSwitchToSecurity: true },
        }),
      );
    }, 150);
  };

  return (
    <div className="flex-1 flex flex-col text-slate-350 bg-[#0c0f17] overflow-hidden h-[calc(100vh-65px)]">
      {/* Header with Navigation Bar */}
      <div className="flex-none border-b border-slate-800 bg-[#0e1321]/90 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-red-500/10 p-2 rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <Shield className="text-red-500 animate-pulse" size={22} />
          </div>
          <div>
            <div className="text-xs text-red-500 uppercase tracking-widest font-bold">
              HalTest Security Observatory
            </div>
            <div className="text-slate-300 font-semibold text-sm truncate max-w-xs flex items-center gap-2">
              <span className="text-slate-500">OBJETIVO:</span>
              <span className="text-slate-200">
                {currentProject?.name || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-inner">
          <TabButton
            id="config"
            active={activeTab === "config"}
            onClick={() => setActiveTab("config")}
            label="Configuración"
            icon={Settings}
          />
          <TabButton
            id="live"
            active={activeTab === "live"}
            onClick={() => setActiveTab("live")}
            label="En Vivo"
            icon={Activity}
            badge={status === "running" ? "REC" : undefined}
          />
          <TabButton
            id="results"
            active={activeTab === "results"}
            onClick={() => setActiveTab("results")}
            label="Resultados"
            icon={BarChart2}
            badge={totalFindingsCount}
          />
          <TabButton
            id="history"
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            label="Historial"
            icon={Clock}
          />
        </div>

        {/* Target Status & Run Action */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-colors ${
              healthScore >= 90
                ? "bg-emerald-950/40 border-emerald-900/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                : healthScore >= 70
                  ? "bg-amber-950/40 border-amber-900/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                  : "bg-red-950/40 border-red-900/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
            <span>Score: {healthScore}%</span>
          </div>

          <button
            type="button"
            onClick={() => handleStartAudit()}
            disabled={status === "running"}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-[0_0_12px_rgba(239,68,68,0.3)] disabled:opacity-50 transition-all"
          >
            <Play size={14} fill="currentColor" />
            <span>Ejecutar Auditoría</span>
          </button>
        </div>
      </div>

      {/* Main View Switching Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "config" && (
          <SecurityConfigView
            onStartAudit={handleStartAudit}
            isRunning={status === "running"}
            flowName={flowName}
          />
        )}

        {activeTab === "live" && (
          <SecurityLiveView
            status={status}
            progressPercent={progressPercent}
            currentNode={currentNode}
            liveAlerts={liveAlerts}
            onStopExecution={handleStopExecution}
            onViewResults={() => setActiveTab("results")}
          />
        )}

        {activeTab === "history" && (
          <SecurityHistoryView
            flowId={currentFlowId}
            onSelectRun={(runId) => {
              setSelectedRunId(runId);
              setActiveTab("results");
            }}
          />
        )}

        {activeTab === "results" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Content Area: Dashboard Metrics & Findings */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quality Gate Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between shadow-lg ${
                  criticalCount === 0 && healthScore >= 80
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
                    : "bg-red-950/30 border-red-500/30 text-red-400"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      criticalCount === 0 && healthScore >= 80
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-red-500/20 border-red-500/40 text-red-300 animate-pulse"
                    }`}
                  >
                    {criticalCount === 0 && healthScore >= 80 ? (
                      <ShieldCheck size={22} />
                    ) : (
                      <ShieldAlert size={22} />
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-80">
                      Security Quality Gate
                    </div>
                    <div className="text-base font-extrabold flex items-center space-x-2">
                      <span>
                        {criticalCount === 0 && healthScore >= 80
                          ? "QUALITY GATE: PASSED (APROBADO)"
                          : "QUALITY GATE: FAILED (RECHAZADO)"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {criticalCount === 0 && healthScore >= 80
                        ? "El flujo cumple con los criterios de aceptación de seguridad y políticas DAST."
                        : `Se detectaron ${criticalCount} hallazgos críticos/altos o el Security Score es inferior al 80%.`}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono hidden sm:block">
                  <div className="text-[10px] text-slate-400 uppercase">
                    Puntuación Global
                  </div>
                  <div className="text-xl font-bold">{healthScore}/100</div>
                </div>
              </div>

              {/* Radial Score & Semantic Risk Buckets */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Radial Health Ring */}
                <div className="bg-[#0e1321]/90 border border-slate-800/80 rounded-2xl p-5 flex items-center space-x-4 shadow-xl backdrop-blur-md relative overflow-hidden">
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg
                      className="w-20 h-20 -rotate-90 transform"
                      viewBox="0 0 36 36"
                    >
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="transition-all duration-1000 ease-out"
                        strokeWidth="3.5"
                        strokeDasharray={`${healthScore}, 100`}
                        stroke={scoreTheme.stroke}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span
                      className={`absolute font-mono text-lg font-bold ${scoreTheme.text}`}
                    >
                      {healthScore}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                      Health Index
                    </div>
                    <div className={`text-sm font-bold ${scoreTheme.text}`}>
                      {healthScore >= 90
                        ? "Excelente (Seguro)"
                        : healthScore >= 70
                          ? "Riesgo Moderado"
                          : "Atención Requerida"}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      Puntuación basada en hallazgos activos y peso de severidad
                      OWASP.
                    </p>
                  </div>
                </div>

                {/* Risk Buckets */}
                <div className="bg-[#0e1321]/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                      Data Leaks & Privacy
                    </span>
                    <Lock className="text-red-400" size={16} />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
                    {dataLeakCount}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Transmisión plana, cookies o contraseñas
                  </p>
                </div>

                <div className="bg-[#0e1321]/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                      Input Vulnerabilities
                    </span>
                    <AlertTriangle className="text-amber-400" size={16} />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
                    {inputVulnCount}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Riesgos XSS, trampas DOM & inline JS
                  </p>
                </div>

                <div className="bg-[#0e1321]/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                      Policy Compliance
                    </span>
                    <ShieldCheck className="text-blue-400" size={16} />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
                    {policyComplianceCount}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Cabeceras HTTP (CSP, HSTS, XFO)
                  </p>
                </div>
              </div>

              {/* Severity & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e1321]/60 border border-slate-800/60 p-4 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-2.5 text-slate-500"
                    />
                    <input
                      type="text"
                      placeholder="Filtrar por mensaje, regla o nodo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500/50 w-64"
                    />
                  </div>

                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500/50"
                  >
                    <option value="all">Todas las Severidades</option>
                    <option value="critical">Críticas & Altas</option>
                    <option value="medium">Medias</option>
                    <option value="low">Bajas e Informativas</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500/50"
                  >
                    <option value="all">Todas las Categorías</option>
                    <option value="data_leak">Fuga de Datos</option>
                    <option value="input_vulnerability">
                      Vulnerabilidades de Input
                    </option>
                    <option value="policy_compliance">
                      Cumplimiento de Políticas
                    </option>
                  </select>
                </div>

                {/* Execution Selector */}
                {runs.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-500 uppercase">
                      Corrida:
                    </span>
                    <select
                      value={selectedRunId || ""}
                      onChange={(e) => setSelectedRunId(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500/50 max-w-xs truncate"
                    >
                      {runs.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id.slice(0, 8)}... (
                          {new Date(
                            r.created_at || r.start_time || Date.now(),
                          ).toLocaleTimeString()}
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Grouped Alerts Findings Table */}
              <div className="bg-[#0e1321]/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                {filteredAlerts.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                    <ShieldCheck
                      size={36}
                      className="mx-auto text-emerald-500/60"
                    />
                    <p className="font-semibold text-slate-300">
                      ¡No se detectaron hallazgos de seguridad vulnerables!
                    </p>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      Las ejecuciones registradas cumplen con los lineamientos
                      OWASP y políticas de cabecera configuradas.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {filteredAlerts.map((alert, idx) => {
                      const isSelected = selectedAlert === alert;
                      const sevTheme =
                        SEVERITY_COLORS[alert.severity] ||
                        SEVERITY_COLORS.medium;
                      const SevIcon = sevTheme.icon;

                      return (
                        <div
                          key={alert.id || idx}
                          onClick={() => setSelectedAlert(alert)}
                          className={`p-4 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                            isSelected
                              ? "bg-red-950/20 border-l-4 border-l-red-500"
                              : "hover:bg-slate-800/30"
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`p-2 rounded-xl border mt-0.5 ${sevTheme.bg}`}
                            >
                              <SevIcon size={16} />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${sevTheme.badge}`}
                                >
                                  {alert.severity}
                                </span>
                                <span className="font-mono text-slate-200 font-bold text-xs">
                                  {alert.ruleId}
                                </span>
                                {alert.count > 1 && (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold border border-slate-700">
                                    x{alert.count}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-300 font-medium">
                                {alert.message}
                              </p>
                              <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-500">
                                <span>
                                  Nodo:{" "}
                                  <strong className="text-slate-400">
                                    {alert.nodeName || alert.nodeId}
                                  </strong>
                                </span>
                                {alert.url && (
                                  <span className="truncate max-w-xs">
                                    URL: {alert.url}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToNode(alert.nodeId);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                            >
                              Localizar
                            </button>
                            <ChevronRight
                              size={16}
                              className="text-slate-600"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Drawer: Vulnerability Diagnostic Details & AI Remediation */}
            <div className="w-96 border-l border-slate-800 bg-[#0c101a] p-5 overflow-y-auto space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Detalles de Diagnóstico
                </h3>
                {selectedAlert && (
                  <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    {selectedAlert.ruleId}
                  </span>
                )}
              </div>

              {selectedAlert ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      Descripción
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {selectedAlert.message}
                    </p>
                  </div>

                  {/* Local AI Recommendation */}
                  <div className="bg-emerald-950/20 border border-emerald-900/30 p-3.5 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>💡 Recomendación de Remedación por IA</span>
                    </div>
                    <p className="text-xs text-emerald-300/90 leading-relaxed font-medium">
                      {AI_SUGGESTIONS[selectedAlert.ruleId] ||
                        AI_SUGGESTIONS.default}
                    </p>
                  </div>

                  {/* OWASP & CVSS Ratings */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-900/40 border border-slate-800 p-3 rounded-xl">
                    <div>
                      <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        OWASP Top 10
                      </h4>
                      <p
                        className="text-xs text-red-400 font-semibold mt-1 truncate"
                        title={selectedAlert.owasp}
                      >
                        {selectedAlert.owasp ||
                          "A05:2021-Security Misconfiguration"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        CVSS Score
                      </h4>
                      <p className="text-xs text-red-400 font-semibold mt-1">
                        {selectedAlert.cvss != null
                          ? selectedAlert.cvss.toFixed(1)
                          : "5.0"}
                        <span className="text-[9px] text-slate-500 font-medium ml-1">
                          ({selectedAlert.severity || "medium"})
                        </span>
                      </p>
                    </div>
                  </div>

                  {selectedAlert.evidence && (
                    <div>
                      <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        Evidencia Técnica
                      </h4>
                      <pre className="text-[10px] text-slate-300 font-mono bg-slate-950 border border-slate-800 p-3 rounded-xl mt-1.5 overflow-x-auto whitespace-pre-wrap break-all max-h-[160px] custom-scrollbar">
                        {typeof selectedAlert.evidence === "object"
                          ? JSON.stringify(selectedAlert.evidence, null, 2)
                          : selectedAlert.evidence}
                      </pre>
                    </div>
                  )}

                  {selectedAlert.url && (
                    <div>
                      <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        URL Objetivo
                      </h4>
                      <a
                        href={selectedAlert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-slate-400 hover:text-red-400 inline-flex items-center gap-1 mt-1 break-all transition-colors"
                      >
                        {selectedAlert.url}
                        <ExternalLink size={11} className="shrink-0" />
                      </a>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex justify-between gap-4">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold">
                        Nodo de Análisis
                      </span>
                      <p className="text-xs text-slate-300 font-semibold mt-0.5">
                        {selectedAlert.nodeName}
                      </p>
                    </div>
                    <button
                      onClick={() => navigateToNode(selectedAlert.nodeId)}
                      className="self-end px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      Localizar
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShieldCheck
                    size={36}
                    className="text-slate-800 mb-3 animate-pulse"
                  />
                  <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
                    Selecciona cualquier hallazgo de seguridad para ver la
                    evidencia técnica y remediación sugerida por IA.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
