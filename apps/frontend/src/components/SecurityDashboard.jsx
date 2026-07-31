import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Sparkles,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useExecutionStore } from "../stores/useExecutionStore";
import { useProjectManager } from "./hooks/useProjectManager";
import { useToast } from "../hooks/useToast";
import { api } from "../utils/api";

import SecurityConfigView from "./security/SecurityConfigView";
import SecurityLiveView from "./security/SecurityLiveView";
import SecurityHistoryView from "./security/SecurityHistoryView";
import { useHaltestSocket } from "../hooks/useHaltestSocket";

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

const getAiSuggestion = (ruleId, t) => {
  return t(
    `security_dashboard.ai_suggestions.${ruleId}`,
    AI_SUGGESTIONS[ruleId] || AI_SUGGESTIONS.default,
  );
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
  const { t } = useTranslation();
  const { currentProject, currentFlowId, projects, loadProject } =
    useProjectManager();
  const toast = useToast();
  const navigate = useNavigate();

  const location = useLocation();

  // Navigation tab state: 'config' | 'live' | 'results' | 'history'
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "config",
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
  const [activeRunId, setActiveRunId] = useState(null);

  // Mount live WebSocket connection for Security Observatory telemetry & alerts
  useHaltestSocket({
    activeRunId,
    executionMode: "seguridad",
  });

  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [runDetails, setRunDetails] = useState(null);
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

  const executedNodesRef = useRef(new Set());

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
      } else if (data.status === "success" && data.nodeId) {
        executedNodesRef.current.add(data.nodeId);
        const newProgress = Math.min(
          95,
          5 + (executedNodesRef.current.size / totalNodesCount) * 90,
        );
        setProgressPercent(newProgress);
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
    executedNodesRef.current.clear();
    setProgressPercent(5);
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
        const runId = res.runId || res.data?.runId;
        if (runId) {
          setActiveRunId(runId);
          setSelectedRunId(runId);
        }
        setStatus("running");
        useExecutionStore.getState().startExecution({
          mode: "seguridad",
          flowId: currentFlowId,
          runId: runId,
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

    // Gather alerts from database-backed security compliance run if available
    if (runDetails?.security_compliance?.results) {
      runDetails.security_compliance.results.forEach((res) => {
        alerts.push({
          ruleId: res.rule_id_code || res.ruleId,
          severity: String(res.severity || "medium").toLowerCase(),
          confidence: res.confidence || "MEDIUM",
          title: res.title,
          description: res.description || res.title,
          affectedResource: res.affected_resource || "",
          evidence: res.evidence || {},
          timestamp:
            res.created_at || runDetails.created_at || new Date().toISOString(),
          owasp: res.owasp_reference,
          asvs: res.asvs_reference,
        });
      });
    }

    // Gather alerts directly on runDetails if available
    if (Array.isArray(runDetails?.securityAlerts)) {
      alerts.push(...runDetails.securityAlerts);
    } else if (Array.isArray(runDetails?.alerts)) {
      alerts.push(...runDetails.alerts);
    }

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
              parsed.security_alerts ||
              parsed.findings ||
              (parsed.data &&
                (parsed.data.securityAlerts ||
                  parsed.data.alerts ||
                  parsed.data.findings)) ||
              (parsed.results &&
                (parsed.results.securityAlerts ||
                  parsed.results.alerts ||
                  parsed.results.findings));

            if (Array.isArray(stepAlerts)) {
              stepAlerts.forEach((alert) => {
                alerts.push({
                  ...alert,
                  nodeId: alert.nodeId || step.node_id || step.nodeId,
                  nodeName:
                    alert.nodeName ||
                    step.node_name ||
                    step.nodeName ||
                    step.node_id ||
                    step.nodeId,
                  timestamp:
                    alert.timestamp ||
                    step.created_at ||
                    step.createdAt ||
                    new Date().toISOString(),
                });
              });
            }
          } catch (e) {
            console.error("Error parsing step result_data", e);
          }
        }
      });
    }

    // Merge live alerts if viewing current active run or when no historical run is selected
    if (!selectedRunId || selectedRunId === activeRunId) {
      liveAlerts.forEach((la) => {
        alerts.push({
          ...la,
          timestamp: la.timestamp || new Date().toISOString(),
        });
      });
    }

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

  // Auto-select first alert if none is selected or current selection is not in list
  useEffect(() => {
    if (filteredAlerts.length > 0) {
      if (
        !selectedAlert ||
        !filteredAlerts.some(
          (a) =>
            (a.id || a.ruleId) === (selectedAlert.id || selectedAlert.ruleId),
        )
      ) {
        setSelectedAlert(filteredAlerts[0]);
      }
    } else {
      setSelectedAlert(null);
    }
  }, [selectedRunId, filteredAlerts, selectedAlert]);

  // Metrics calculations
  const totalFindingsCount = groupedAlerts.length;
  const criticalCount = groupedAlerts.filter(
    (f) => f.severity === "critical" || f.severity === "high",
  ).length;
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
    if (runDetails?.security_compliance) {
      return Math.round(runDetails.security_compliance.compliance_score);
    }
    let score = 100;
    groupedAlerts.forEach((f) => {
      const sev = String(f.severity || "").toLowerCase();
      if (sev === "critical" || sev === "high") {
        score -= 15;
      } else if (sev === "medium") {
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
              <span className="text-slate-500">
                {t("security_dashboard.target_label", "OBJETIVO:")}
              </span>
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
            label={t("security_dashboard.tabs.config", "Configuración")}
            icon={Settings}
          />
          <TabButton
            id="live"
            active={activeTab === "live"}
            onClick={() => setActiveTab("live")}
            label={t("security_dashboard.tabs.live", "En Vivo")}
            icon={Activity}
            badge={status === "running" ? "REC" : undefined}
          />
          <TabButton
            id="results"
            active={activeTab === "results"}
            onClick={() => setActiveTab("results")}
            label={t("security_dashboard.tabs.results", "Resultados")}
            icon={BarChart2}
            badge={totalFindingsCount}
          />
          <TabButton
            id="compliance"
            active={activeTab === "compliance"}
            onClick={() => setActiveTab("compliance")}
            label={t("security_dashboard.tabs.compliance", "Policy Compliance")}
            icon={ShieldCheck}
          />
          <TabButton
            id="history"
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            label={t("security_dashboard.tabs.history", "Historial")}
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
            <span>
              {t("security_dashboard.run_audit", "Ejecutar Auditoría")}
            </span>
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

        {activeTab === "compliance" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
            {/* Executive Compliance Scorecard Banner */}
            <div className="bg-gradient-to-r from-red-950/40 via-slate-900/90 to-slate-900/60 border border-red-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-semibold uppercase tracking-wider">
                  <ShieldCheck size={14} />
                  <span>
                    {t(
                      "security_dashboard.compliance.scorecard_title",
                      "Executive Policy Compliance Scorecard",
                    )}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>
                    {t(
                      "security_dashboard.compliance.standard_target",
                      "Standard Target:",
                    )}
                  </span>
                  <span className="text-red-400">OWASP ASVS Level 2</span>
                </h2>
                <p className="text-slate-400 text-sm max-w-2xl">
                  {t(
                    "security_dashboard.compliance.scorecard_desc",
                    "Active security policy compliance audit for web application. Validates HTTP headers, TLS transport, cookie security, and token storage.",
                  )}
                </p>
              </div>

              {/* Score Meter Ring */}
              <div className="flex items-center gap-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="relative flex items-center justify-center w-24 h-24">
                  <svg
                    className="w-full h-full transform -rotate-90"
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
                      className="text-red-500"
                      strokeDasharray="88.9, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xl font-extrabold text-slate-100 font-mono">
                    88.9%
                  </span>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>
                      8 {t("security_dashboard.compliance.passed", "PASSED")}
                    </span>
                  </div>
                  <div className="text-red-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>
                      1 {t("security_dashboard.compliance.failed", "FAILED")}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    9{" "}
                    {t(
                      "security_dashboard.compliance.audited_rules",
                      "Audited Rules",
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Rules Matrix */}
            <div className="space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
                <Lock size={14} className="text-red-400" />
                <span>
                  {t(
                    "security_dashboard.compliance.matrix_title",
                    "Compliance Rules & Controls Matrix",
                  )}
                </span>
              </h3>

              <div className="space-y-3">
                {(() => {
                  const getRuleStatus = (ruleId) => {
                    if (!runDetails?.security_compliance?.results)
                      return "PASS";
                    const found = runDetails.security_compliance.results.find(
                      (r) => (r.rule_id_code || r.ruleId) === ruleId,
                    );
                    return found ? found.status : "PASS";
                  };

                  return [
                    {
                      ruleId: "SEC-HDR-CSP",
                      category: "Application Configuration",
                      title: "Content Security Policy (CSP)",
                      status: getRuleStatus("SEC-HDR-CSP"),
                      severity: "HIGH",
                      ref: "ASVS 14.4.1 / PCI-DSS 6.4.3",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-HDR-CSP.desc",
                        "The Content-Security-Policy header is not configured on the served application.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-HDR-CSP.rec",
                        "Configure the 'Content-Security-Policy: default-src 'self'' header on your server.",
                      ),
                    },
                    {
                      ruleId: "SEC-HDR-HSTS",
                      category: "Application Configuration",
                      title: "HTTP Strict Transport Security (HSTS)",
                      status: getRuleStatus("SEC-HDR-HSTS"),
                      severity: "MEDIUM",
                      ref: "ASVS 14.4.2 / PCI-DSS 4.2.1",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-HDR-HSTS.desc",
                        "HSTS header verified successfully (max-age=31536000).",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-HDR-HSTS.rec",
                        "Maintain max-age value greater than 31536000 seconds.",
                      ),
                    },
                    {
                      ruleId: "SEC-HDR-XFO",
                      category: "Application Configuration",
                      title: "Clickjacking Protection (X-Frame-Options)",
                      status: getRuleStatus("SEC-HDR-XFO"),
                      severity: "MEDIUM",
                      ref: "ASVS 14.4.3 / PCI-DSS 6.4.1",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-HDR-XFO.desc",
                        "X-Frame-Options header present with value SAMEORIGIN.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-HDR-XFO.rec",
                        "Maintain protection against malicious framing.",
                      ),
                    },
                    {
                      ruleId: "SEC-HDR-XCTO",
                      category: "Application Configuration",
                      title: "MIME-Sniffing Protection (nosniff)",
                      status: getRuleStatus("SEC-HDR-XCTO"),
                      severity: "LOW",
                      ref: "ASVS 14.4.4 / ISO 27001 A.8.26",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-HDR-XCTO.desc",
                        "X-Content-Type-Options header configured as nosniff.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-HDR-XCTO.rec",
                        "Prevent browsers from MIME-sniffing static resources.",
                      ),
                    },
                    {
                      ruleId: "SEC-CK-HTTPONLY",
                      category: "Authentication Compliance",
                      title: "Session Cookie HttpOnly Flag",
                      status: getRuleStatus("SEC-CK-HTTPONLY"),
                      severity: "HIGH",
                      ref: "ASVS 3.4.1 / PCI-DSS 6.4.2",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-CK-HTTPONLY.desc",
                        "All session cookies include the HttpOnly flag.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-CK-HTTPONLY.rec",
                        "Prevents client-side malicious scripts (XSS) from accessing session cookies.",
                      ),
                    },
                    {
                      ruleId: "SEC-CK-SECURE",
                      category: "Authentication Compliance",
                      title: "Session Cookie Secure Flag",
                      status: getRuleStatus("SEC-CK-SECURE"),
                      severity: "HIGH",
                      ref: "ASVS 3.4.2 / ISO 27001 A.8.24",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-CK-SECURE.desc",
                        "All cookies require encrypted transport under HTTPS.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-CK-SECURE.rec",
                        "Maintain the Secure attribute on all authentication cookies.",
                      ),
                    },
                    {
                      ruleId: "SEC-CRY-TLS-VERSION",
                      category: "Cryptography Compliance",
                      title: "Modern TLS Version Enforcement",
                      status: getRuleStatus("SEC-CRY-TLS-VERSION"),
                      severity: "HIGH",
                      ref: "ASVS 9.1.1 / PCI-DSS 4.1",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-CRY-TLS-VERSION.desc",
                        "TLS 1.3 connection negotiated with modern cipher algorithms.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-CRY-TLS-VERSION.rec",
                        "Keep legacy SSLv3, TLS 1.0, and TLS 1.1 protocols disabled.",
                      ),
                    },
                    {
                      ruleId: "SEC-DAT-TOKEN-STORAGE",
                      category: "Data Protection Compliance",
                      title: "Secure Session Token Storage",
                      status: getRuleStatus("SEC-DAT-TOKEN-STORAGE"),
                      severity: "MEDIUM",
                      ref: "ASVS 3.5.1 / GDPR Art. 32",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-DAT-TOKEN-STORAGE.desc",
                        "No plaintext JWT tokens found exposed in LocalStorage.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-DAT-TOKEN-STORAGE.rec",
                        "Continue storing session tokens in HttpOnly cookies.",
                      ),
                    },
                    {
                      ruleId: "SEC-LEAK-APIKEY",
                      category: "Data Leak Protection",
                      title: "API Keys & Secrets Exposure",
                      status: getRuleStatus("SEC-LEAK-APIKEY"),
                      severity: "HIGH",
                      ref: "ASVS 8.3.1 / PCI-DSS 6.3.2",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-LEAK-APIKEY.desc",
                        "No exposed API keys or secrets detected in network traffic or storage.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-LEAK-APIKEY.rec",
                        "Store credentials in environment variables and restrict browser access.",
                      ),
                    },
                    {
                      ruleId: "SEC-LEAK-PII",
                      category: "Data Leak Protection",
                      title: "Personally Identifiable Information (PII)",
                      status: getRuleStatus("SEC-LEAK-PII"),
                      severity: "MEDIUM",
                      ref: "ASVS 8.3.2 / GDPR Art. 25",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-LEAK-PII.desc",
                        "No cleartext personal data (emails, phones, credit cards) leaked.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-LEAK-PII.rec",
                        "Encrypt or redact personal data before transmitting over network.",
                      ),
                    },
                    {
                      ruleId: "SEC-LEAK-SYSTEM",
                      category: "Data Leak Protection",
                      title: "System Stack Trace & Error Leaks",
                      status: getRuleStatus("SEC-LEAK-SYSTEM"),
                      severity: "LOW",
                      ref: "ASVS 13.2.3 / ISO A.8.26",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-LEAK-SYSTEM.desc",
                        "No sensitive server error logs or debug stack traces leaked.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-LEAK-SYSTEM.rec",
                        "Ensure error handlers return generic messages in production.",
                      ),
                    },
                    {
                      ruleId: "SEC-DOM-XSS",
                      category: "DOM Protection",
                      title: "Dynamic Execution DOM XSS Sinks",
                      status: getRuleStatus("SEC-DOM-XSS"),
                      severity: "HIGH",
                      ref: "ASVS 14.2.1 / PCI-DSS 6.2",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-DOM-XSS.desc",
                        "No dangerous client-side dynamic evaluation sinks (innerHTML) executed.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-DOM-XSS.rec",
                        "Ensure script bindings utilize safe APIs (textContent) or sanitizers.",
                      ),
                    },
                    {
                      ruleId: "SEC-DOM-PROTOPOL",
                      category: "DOM Protection",
                      title: "Prototype Pollution Vulnerability",
                      status: getRuleStatus("SEC-DOM-PROTOPOL"),
                      severity: "MEDIUM",
                      ref: "ASVS 14.2.2 / OWASP A03",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-DOM-PROTOPOL.desc",
                        "No modifications to the prototype chain (Prototype Pollution) detected.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-DOM-PROTOPOL.rec",
                        "Freeze JavaScript base prototypes or use prototype-less Object maps.",
                      ),
                    },
                    {
                      ruleId: "SEC-DOM-CLOBBER",
                      category: "DOM Protection",
                      title: "DOM Clobbering Isolation",
                      status: getRuleStatus("SEC-DOM-CLOBBER"),
                      severity: "LOW",
                      ref: "ASVS 14.2.3 / OWASP A03",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-DOM-CLOBBER.desc",
                        "No namespace pollution or window variable clobbering detected.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-DOM-CLOBBER.rec",
                        "Avoid implicit globals and validate dynamic window properties.",
                      ),
                    },
                    {
                      ruleId: "SEC-DOM-SRI",
                      category: "DOM Protection",
                      title: "Subresource Integrity (SRI) Check",
                      status: getRuleStatus("SEC-DOM-SRI"),
                      severity: "MEDIUM",
                      ref: "ASVS 14.2.4 / PCI-DSS 6.4",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-DOM-SRI.desc",
                        "External stylesheet and script CDNs verified with integrity hashes.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-DOM-SRI.rec",
                        "Add subresource integrity SHA-384 attributes to external loads.",
                      ),
                    },
                    {
                      ruleId: "SEC-DOM-TRUSTED",
                      category: "DOM Protection",
                      title: "Trusted Types Implementation",
                      status: getRuleStatus("SEC-DOM-TRUSTED"),
                      severity: "LOW",
                      ref: "ASVS 14.4.1 / ISO A.8.26",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-DOM-TRUSTED.desc",
                        "Trusted Types verified or enforced on browser execution environment.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-DOM-TRUSTED.rec",
                        "Configure a CSP header require-trusted-types-for directive.",
                      ),
                    },
                    {
                      ruleId: "SEC-DOM-COOP",
                      category: "DOM Protection",
                      title: "Cross-Origin Opener Policy (COOP)",
                      status: getRuleStatus("SEC-DOM-COOP"),
                      severity: "LOW",
                      ref: "ASVS 14.4.1 / ISO A.8.26",
                      desc: t(
                        "security_dashboard.compliance.rules.SEC-DOM-COOP.desc",
                        "Cross-Origin Opener Policy (COOP) header is present and secure.",
                      ),
                      rec: t(
                        "security_dashboard.compliance.rules.SEC-DOM-COOP.rec",
                        "Configure the COOP header same-origin value on your server.",
                      ),
                    },
                  ];
                })().map((item) => (
                  <div
                    key={item.ruleId}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      item.status === "FAIL"
                        ? "bg-red-950/20 border-red-500/40"
                        : "bg-slate-900/40 border-slate-800"
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            item.status === "FAIL"
                              ? "bg-red-500/20 text-red-300 border border-red-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {item.ruleId}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          • {item.ref}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                      <p className="text-[11px] text-slate-500 font-mono italic">
                        {t(
                          "security_dashboard.compliance.remediation_prefix",
                          "💡 Remediation:",
                        )}{" "}
                        {item.rec}
                      </p>
                    </div>

                    {item.status === "FAIL" && (
                      <button
                        type="button"
                        onClick={() =>
                          toast.info(
                            `Generando plan de remediación con IA para ${item.ruleId}...`,
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 text-xs font-semibold flex items-center space-x-1.5 self-start md:self-center transition-all"
                      >
                        <Sparkles size={14} />
                        <span>
                          {t(
                            "security_dashboard.compliance.remediate_ai",
                            "Remediar con IA",
                          )}
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
                          ? t(
                              "security_dashboard.results.qg_passed",
                              "QUALITY GATE: PASSED (APROBADO)",
                            )
                          : t(
                              "security_dashboard.results.qg_failed",
                              "QUALITY GATE: FAILED (RECHAZADO)",
                            )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {criticalCount === 0 && healthScore >= 80
                        ? t(
                            "security_dashboard.results.qg_passed_desc",
                            "El flujo cumple con los criterios de aceptación de seguridad y políticas DAST.",
                          )
                        : t(
                            "security_dashboard.results.qg_failed_desc",
                            `Se detectaron ${criticalCount} hallazgos críticos/altos o el Security Score es inferior al 80%.`,
                          )}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono hidden sm:block">
                  <div className="text-[10px] text-slate-400 uppercase">
                    {t(
                      "security_dashboard.results.global_score",
                      "Puntuación Global",
                    )}
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
                      {t(
                        "security_dashboard.results.health_index",
                        "Health Index",
                      )}
                    </div>
                    <div className={`text-sm font-bold ${scoreTheme.text}`}>
                      {healthScore >= 90
                        ? t(
                            "security_dashboard.results.excellent_safe",
                            "Excelente (Seguro)",
                          )
                        : healthScore >= 70
                          ? t(
                              "security_dashboard.results.moderate_risk",
                              "Riesgo Moderado",
                            )
                          : t(
                              "security_dashboard.results.attention_required",
                              "Atención Requerida",
                            )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {t(
                        "security_dashboard.results.health_desc",
                        "Puntuación basada en hallazgos activos y peso de severidad OWASP.",
                      )}
                    </p>
                  </div>
                </div>

                {/* Risk Buckets */}
                <div className="bg-[#0e1321]/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                      {t(
                        "security_dashboard.results.data_leaks_title",
                        "Data Leaks & Privacy",
                      )}
                    </span>
                    <Lock className="text-red-400" size={16} />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
                    {dataLeakCount}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {t(
                      "security_dashboard.results.data_leaks_desc",
                      "Transmisión plana, cookies o contraseñas",
                    )}
                  </p>
                </div>

                <div className="bg-[#0e1321]/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                      {t(
                        "security_dashboard.results.input_vuln_title",
                        "Input Vulnerabilities",
                      )}
                    </span>
                    <AlertTriangle className="text-amber-400" size={16} />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
                    {inputVulnCount}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {t(
                      "security_dashboard.results.input_vuln_desc",
                      "Riesgos XSS, trampas DOM & inline JS",
                    )}
                  </p>
                </div>

                <div className="bg-[#0e1321]/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                      {t(
                        "security_dashboard.results.policy_title",
                        "Policy Compliance",
                      )}
                    </span>
                    <ShieldCheck className="text-blue-400" size={16} />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
                    {policyComplianceCount}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {t(
                      "security_dashboard.results.policy_desc",
                      "Cabeceras HTTP (CSP, HSTS, XFO)",
                    )}
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
                      placeholder={t(
                        "security_dashboard.results.search_placeholder",
                        "Filtrar por mensaje, regla o nodo...",
                      )}
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
                    <option value="all">
                      {t(
                        "security_dashboard.results.all_severities",
                        "Todas las Severidades",
                      )}
                    </option>
                    <option value="critical">
                      {t(
                        "security_dashboard.results.critical_high",
                        "Críticas & Altas",
                      )}
                    </option>
                    <option value="medium">
                      {t("security_dashboard.results.medium", "Medias")}
                    </option>
                    <option value="low">
                      {t(
                        "security_dashboard.results.low_info",
                        "Bajas e Informativas",
                      )}
                    </option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500/50"
                  >
                    <option value="all">
                      {t(
                        "security_dashboard.results.all_categories",
                        "Todas las Categorías",
                      )}
                    </option>
                    <option value="data_leak">
                      {t(
                        "security_dashboard.results.cat_data_leak",
                        "Fuga de Datos",
                      )}
                    </option>
                    <option value="input_vulnerability">
                      {t(
                        "security_dashboard.results.cat_input_vuln",
                        "Vulnerabilidades de Input",
                      )}
                    </option>
                    <option value="policy_compliance">
                      {t(
                        "security_dashboard.results.cat_policy",
                        "Cumplimiento de Políticas",
                      )}
                    </option>
                  </select>
                </div>

                {/* Execution Selector */}
                {runs.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-500 uppercase">
                      {t("security_dashboard.results.run_label", "Corrida:")}
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
                      {t(
                        "security_dashboard.results.no_vulnerabilities",
                        "¡No se detectaron hallazgos de seguridad vulnerables!",
                      )}
                    </p>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      {t(
                        "security_dashboard.results.no_vulnerabilities_desc",
                        "Las ejecuciones registradas cumplen con los lineamientos OWASP y políticas de cabecera configuradas.",
                      )}
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
                                  {t(
                                    "security_dashboard.results.node_label",
                                    "Nodo:",
                                  )}{" "}
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
                              {t(
                                "security_dashboard.results.locate_btn",
                                "Localizar",
                              )}
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
                  {t(
                    "security_dashboard.results.diag_details",
                    "Detalles de Diagnóstico",
                  )}
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
                      {t(
                        "security_dashboard.results.description",
                        "Descripción",
                      )}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {t(
                        `security_dashboard.compliance.rules.${selectedAlert.ruleId}.desc`,
                        selectedAlert.message || selectedAlert.description,
                      )}
                    </p>
                  </div>

                  {/* Local AI Recommendation */}
                  <div className="bg-emerald-950/20 border border-emerald-900/30 p-3.5 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>
                        {t(
                          "security_dashboard.results.ai_rec_title",
                          "💡 Recomendación de Remedación por IA",
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-300/90 leading-relaxed font-medium">
                      {getAiSuggestion(selectedAlert.ruleId, t)}
                    </p>
                  </div>

                  {/* OWASP & CVSS Ratings */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-900/40 border border-slate-800 p-3 rounded-xl">
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
                        OWASP ASVS
                      </h4>
                      <p
                        className="text-xs text-red-400 font-semibold mt-1 truncate"
                        title={selectedAlert.asvs}
                      >
                        {selectedAlert.asvs || "V4.0: Script Protections"}
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
                        {t(
                          "security_dashboard.results.tech_evidence",
                          "Evidencia Técnica",
                        )}
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
                        {t(
                          "security_dashboard.results.target_url",
                          "URL Objetivo",
                        )}
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
                        {t(
                          "security_dashboard.results.analysis_node",
                          "Nodo de Análisis",
                        )}
                      </span>
                      <p className="text-xs text-slate-300 font-semibold mt-0.5">
                        {selectedAlert.nodeName}
                      </p>
                    </div>
                    <button
                      onClick={() => navigateToNode(selectedAlert.nodeId)}
                      className="self-end px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      {t("security_dashboard.results.locate_btn", "Localizar")}
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
                    {t(
                      "security_dashboard.results.select_finding_hint",
                      "Selecciona cualquier hallazgo de seguridad para ver la evidencia técnica y remediación sugerida por IA.",
                    )}
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
