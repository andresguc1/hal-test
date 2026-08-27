import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  Terminal,
  ChevronDown,
  TerminalSquare,
  ScrollText,
  OctagonX,
  Send,
  Code2,
  Copy,
  Check,
  AlertTriangle,
  Download,
  RefreshCw,
  Eye,
  Edit2,
  CheckCircle2,
} from "lucide-react";
import { useLogs, normalizeMode } from "../context/LogContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { api } from "../utils/api";
import { useProjectManager } from "./hooks/useProjectManager";
import { useToast } from "../hooks/useToast";

// ─── Log type → color mapping ─────────────────────────────────────────────────
const LOG_COLORS = {
  error: "text-rose-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
  info: "text-slate-300",
  // Shell stream types
  stdout: "text-slate-200",
  stderr: "text-rose-300",
  system: "text-indigo-400",
  command: "text-cyan-400 font-bold",
};

const MAX_SHELL_LINES = 500;
const CODE_DEBOUNCE_MS = 500;
const FRAMEWORKS = [
  { id: "playwright", label: "Playwright" },
  { id: "cypress", label: "Cypress" },
  { id: "selenium", label: "Selenium" },
];
const PATTERNS = [
  { id: "flat", label: "Flat", description: "Sequential single-file" },
  { id: "pom", label: "POM", description: "Page Object Model" },
  { id: "screenplay", label: "Screenplay", description: "Actor-based" },
  { id: "data-driven", label: "Data", description: "Data-Driven" },
  { id: "keyword-driven", label: "Keyword", description: "Keyword-Driven" },
];
const MIN_PANEL_HEIGHT = 150;
const MAX_PANEL_HEIGHT = 600;
const DEFAULT_PANEL_HEIGHT = 260;

export default function TerminalPanel({
  socket,
  nodes = [],
  edges = [],
  _setNodes,
  _setEdges,
  selectedNodeId,
  setSelectedNodeId,
  executionMode = "calidad",
}) {
  const { logs, clearLogs, isPanelVisible, togglePanel } = useLogs();

  const filteredLogs = useMemo(() => {
    const targetMode = normalizeMode(executionMode);
    return logs.filter((log) => normalizeMode(log.mode) === targetMode);
  }, [logs, executionMode]);

  const { currentProject } = useProjectManager();
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const activeLineRef = useRef(null);
  const errorLineRef = useRef(null);
  const toast = useToast();

  // ─── Mode ─────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState("log");

  // ─── Code Preview ─────────────────────────────────────────────────────────
  const [generatedCode, setGeneratedCode] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [codeWarnings, setCodeWarnings] = useState([]);
  const [codeLintReport, setCodeLintReport] = useState(null);
  const [codeValidationReport, setCodeValidationReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [codeError, setCodeError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [framework, setFramework] = useState("playwright");
  const [designPattern, setDesignPattern] = useState("flat");
  const [manualRefresh, setManualRefresh] = useState(0);

  // ─── Advanced Edit & Execution Tracing states ─────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedCode, setEditedCode] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

  // ─── Resizable Panel ──────────────────────────────────────────────────────
  const [panelHeight, setPanelHeight] = useState(DEFAULT_PANEL_HEIGHT);
  const isDraggingPanel = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  const activeLineIndex = useMemo(() => {
    const activeNode = nodes.find(
      (n) =>
        n.data?.state === "executing" ||
        n.data?.state === "capturing-before" ||
        n.data?.state === "capturing-after",
    );
    if (!activeNode) return -1;

    const codeToSearch = isEditMode ? editedCode : generatedCode;
    if (!codeToSearch) return -1;

    const lines = codeToSearch.split("\n");
    const index = lines.findIndex((line) =>
      line.includes(`[node_id: ${activeNode.id}]`),
    );

    return index !== -1 ? index + 1 : -1;
  }, [nodes, isEditMode, editedCode, generatedCode]);

  // ─── Node ↔ Code Line Mapping ─────────────────────────────────────────────
  const nodeLineMap = useMemo(() => {
    const codeToSearch = isEditMode ? editedCode : generatedCode;
    if (!codeToSearch) return new Map();

    const lines = codeToSearch.split("\n");
    const map = new Map();
    const nodeStartLines = new Map();

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/\[node_id:\s*(.+?)\]/);
      if (match) {
        const nodeId = match[1].trim();
        if (!nodeStartLines.has(nodeId)) {
          nodeStartLines.set(nodeId, i);
        }
        map.set(nodeId, { startLine: i, endLine: i });
      }
    }

    for (const [nodeId, range] of map) {
      const nextEntries = Array.from(map.entries()).filter(
        ([id]) => id !== nodeId,
      );
      let endLine = lines.length - 1;
      for (const [, otherRange] of nextEntries) {
        if (otherRange.startLine > range.startLine) {
          endLine = otherRange.startLine - 1;
          break;
        }
      }
      range.endLine = endLine;
    }

    return map;
  }, [generatedCode, editedCode, isEditMode]);

  const highlightedCodeLines = useMemo(() => {
    const targetId =
      selectedNodeId ||
      (() => {
        const activeNode = nodes.find(
          (n) =>
            n.data?.state === "executing" ||
            n.data?.state === "capturing-before" ||
            n.data?.state === "capturing-after",
        );
        return activeNode?.id || null;
      })();

    if (!targetId || !nodeLineMap.has(targetId)) return new Set();
    const range = nodeLineMap.get(targetId);
    const lines = new Set();
    for (let i = range.startLine; i <= range.endLine; i++) {
      lines.add(i);
    }
    return lines;
  }, [selectedNodeId, nodes, nodeLineMap]);

  const errorNodeLines = useMemo(() => {
    const lines = new Set();
    const errorNodes = nodes.filter(
      (n) => n.data?.state === "error" || n.data?.state === "softfailed",
    );
    for (const node of errorNodes) {
      const range = nodeLineMap.get(node.id);
      if (range) {
        for (let i = range.startLine; i <= range.endLine; i++) {
          lines.add(i);
        }
      }
    }
    return lines;
  }, [nodes, nodeLineMap]);

  const handleCodeLineClick = useCallback(
    (lineIndex) => {
      const codeToSearch = isEditMode ? editedCode : generatedCode;
      if (!codeToSearch) return;

      const line = codeToSearch.split("\n")[lineIndex];
      const match = line?.match(/\[node_id:\s*(.+?)\]/);
      if (match && setSelectedNodeId) {
        const nodeId = match[1].trim();
        setSelectedNodeId(selectedNodeId === nodeId ? null : nodeId);
      }
    },
    [generatedCode, editedCode, isEditMode, selectedNodeId, setSelectedNodeId],
  );

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeLineIndex]);

  useEffect(() => {
    if (errorLineRef.current) {
      errorLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [errorNodeLines]);

  // Keep editedCode in sync with generatedCode when not editing
  useEffect(() => {
    if (!isEditMode) {
      setEditedCode(generatedCode);
    }
  }, [generatedCode, isEditMode]);

  // Recursively map parsed code actions back to React Flow nodes/edges
  const convertActionsToFlowData = useCallback(
    (actions, parentId = null, depth = 0) => {
      const nodesList = [];
      const edgesList = [];

      actions.forEach((actionObj, index) => {
        const nodeId = `${actionObj.action}-${Date.now()}-${index}`;
        const { action, subNodes, label, ...config } = actionObj;

        const nodeType = action === "component" ? "component" : action;

        const mappedNode = {
          id: nodeId,
          type: nodeType,
          position: {
            x: (parentId ? 50 : 100) + index * 250,
            y: parentId ? 80 : 150,
          },
          data: {
            type: nodeType,
            label:
              label ||
              action
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase()),
            configuration: config,
            state: "default",
          },
        };

        if (parentId) {
          mappedNode.parentId = parentId;
          mappedNode.parentNode = parentId;
          mappedNode.position = { x: 50 + index * 200, y: 80 };
        }

        nodesList.push(mappedNode);

        if (subNodes && Array.isArray(subNodes) && subNodes.length > 0) {
          const subResult = convertActionsToFlowData(
            subNodes,
            nodeId,
            depth + 1,
          );
          nodesList.push(...subResult.nodes);
          edgesList.push(...subResult.edges);
        }

        if (index > 0) {
          const siblings = nodesList.filter((n) =>
            parentId ? n.parentId === parentId : !n.parentId,
          );
          const prevSibling = siblings[siblings.length - 2];
          if (prevSibling) {
            edgesList.push({
              id: `edge_${prevSibling.id}_to_${nodeId}`,
              source: prevSibling.id,
              target: nodeId,
              animated: !import.meta.env.DEV,
              type: "custom",
            });
          }
        }
      });

      return { nodes: nodesList, edges: edgesList };
    },
    [],
  );

  const handleSyncCodeToCanvas = useCallback(() => {
    if (!editedCode) return;
    setIsSyncing(true);
    try {
      const result = api.post("/import/code", { code: editedCode, framework });
      if (result.success && result.actions) {
        const { nodes: newNodes, edges: newEdges } = convertActionsToFlowData(
          result.actions,
        );
        _setNodes?.(newNodes);
        _setEdges?.(newEdges);
        toast.success(
          t("terminal.sync_success", "Code synced to canvas successfully"),
        );
        setIsEditMode(false);
      } else {
        toast.error(
          t(
            "terminal.sync_parse_error",
            "Could not parse code back into flow actions.",
          ),
        );
      }
    } catch (err) {
      console.error("Failed to sync code to canvas:", err);
      toast.error(t("terminal.sync_failed", "Failed to sync code to canvas."));
    } finally {
      setIsSyncing(false);
      setShowSyncConfirm(false);
    }
  }, [
    editedCode,
    framework,
    convertActionsToFlowData,
    _setNodes,
    _setEdges,
    toast,
    t,
  ]);

  const LANGUAGES = [
    { id: "javascript", label: t("terminal.lang_js"), ext: "js" },
    { id: "typescript", label: t("terminal.lang_ts"), ext: "ts" },
    { id: "python", label: t("terminal.lang_python"), ext: "py" },
    { id: "java", label: t("terminal.lang_java"), ext: "java" },
    { id: "csharp", label: t("terminal.lang_csharp"), ext: "cs" },
  ];

  // ─── Shell Output ─────────────────────────────────────────────────────────
  const [shellLines, setShellLines] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // ─── Command Input ────────────────────────────────────────────────────────
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ─── Real-time Code Generation ─────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "code") return;

    const timer = setTimeout(async () => {
      setIsGenerating(true);
      setCodeError(null);
      try {
        const isContainer = (type) =>
          ["component", "loop", "for_each"].includes(type);

        // Step 1: Map canvas nodes, collecting container nodes that need sub-flow resolution
        const nodeMap = new Map();
        const needsResolution = [];

        for (const node of nodes) {
          const nodeType = node.data?.type || node.type;
          const subNodes = node.data?.subNodes || [];

          let effectiveSubNodes = subNodes;

          const flowId = node.data?.configuration?.flowId || node.data?.flowId;

          nodeMap.set(node.id, {
            id: node.id,
            type: nodeType,
            data: {
              configuration: node.data?.configuration || {},
              label: node.data?.label || node.data?.customLabel || node.type,
              customLabel: node.data?.customLabel,
              subNodes: effectiveSubNodes,
              flowId,
              flowName: node.data?.flowName || node.data?.label,
            },
            parentNode: node.parentNode || node.parentId,
            isContainer: isContainer(nodeType),
          });

          if (
            isContainer(nodeType) &&
            effectiveSubNodes.length === 0 &&
            flowId
          ) {
            needsResolution.push({ node, flowId, nodeType });
          }
        }

        // Step 2: Fetch sub-flows from DB for container nodes that need resolution
        //        Use POST /export/subflow to avoid the side effects of GET /flows/:id
        if (needsResolution.length > 0 && currentProject?.id) {
          const fetches = needsResolution.map(async ({ node, flowId }) => {
            try {
              const subFlow = await api.post("/export/subflow", {
                flowId,
                projectId: currentProject.id,
              });
              if (
                subFlow?.success &&
                subFlow?.nodes &&
                subFlow.nodes.length > 0
              ) {
                const mapped = nodeMap.get(node.id);
                if (mapped) {
                  mapped.data.subNodes = subFlow.nodes;
                }
              }
            } catch {
              // Sub-flow not found — leave subNodes empty, backend will try too
            }
          });
          await Promise.allSettled(fetches);
        }

        // Step 3: Build edge-based topological ordering
        const adjacency = new Map();
        const inDegree = new Map();
        nodeMap.forEach((_, id) => {
          adjacency.set(id, []);
          inDegree.set(id, 0);
        });
        if (edges && Array.isArray(edges)) {
          edges.forEach((edge) => {
            if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
              adjacency.get(edge.source).push(edge.target);
              inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
            }
          });
        }

        // Kahn's algorithm for topological sort
        const queue = [];
        inDegree.forEach((deg, id) => {
          if (deg === 0) queue.push(id);
        });
        const sorted = [];
        while (queue.length > 0) {
          const id = queue.shift();
          sorted.push(id);
          for (const neighbor of adjacency.get(id) || []) {
            const newDeg = (inDegree.get(neighbor) || 1) - 1;
            inDegree.set(neighbor, newDeg);
            if (newDeg === 0) queue.push(neighbor);
          }
        }
        nodeMap.forEach((_, id) => {
          if (!sorted.includes(id)) sorted.push(id);
        });

        // Step 4: Group into tree (respecting parentId)
        const flatOrdered = sorted.map((id) => nodeMap.get(id)).filter(Boolean);
        const childMap = new Map();
        const roots = [];
        flatOrdered.forEach((mappedNode) => {
          const parentId = mappedNode.parentNode;
          if (parentId && nodeMap.has(parentId)) {
            if (!childMap.has(parentId)) childMap.set(parentId, []);
            childMap.get(parentId).push(mappedNode);
          } else {
            roots.push(mappedNode);
          }
        });

        // Step 5: Attach subNodes in edge order (merge subFlow + canvas children)
        const attachSubNodes = (node) => {
          const canvasChildren = childMap.get(node.id) || [];
          const existingSubNodes = node.data.subNodes || [];
          const mergedSubNodes = [...existingSubNodes, ...canvasChildren].map(
            attachSubNodes,
          );
          node.data.subNodes = mergedSubNodes;
          return node;
        };
        const flowSteps = roots.map(attachSubNodes);

        const result = await api.post("/export/code", {
          flow: flowSteps,
          framework,
          language,
          locale: i18n.language,
          projectId: currentProject?.id,
          designPattern,
        });

        if (result.isZip && result.files) {
          setGeneratedFiles(result.files);
          setGeneratedCode("");
          const firstFile =
            Object.keys(result.files).find((f) =>
              f.endsWith(`.${language === "typescript" ? "ts" : "js"}`),
            ) || Object.keys(result.files)[0];
          setActiveFile(firstFile);
          setCodeWarnings(result.warnings || []);
          setCodeLintReport(result.lintReport || null);
          setCodeValidationReport(result.validationReport || null);
        } else if (result.success && result.code) {
          setGeneratedFiles(null);
          setActiveFile(null);
          setGeneratedCode(result.code);
          setCodeWarnings(result.warnings || []);
          setCodeLintReport(result.lintReport || null);
          setCodeValidationReport(result.validationReport || null);
        } else {
          setCodeError(result.error || "Code generation failed");
        }
      } catch (err) {
        console.error("Failed to generate real-time code:", err);
        setCodeError(err.message || "Failed to generate code");
      } finally {
        setIsGenerating(false);
      }
    }, CODE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [
    nodes,
    edges,
    mode,
    language,
    framework,
    designPattern,
    currentProject?.id,
    manualRefresh,
  ]);

  const handleCopyCode = useCallback(() => {
    const codeToCopy = isEditMode ? editedCode : generatedCode;
    if (!codeToCopy) return;
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [generatedCode, editedCode, isEditMode]);

  const handleDownloadCode = useCallback(() => {
    const codeToDownload = isEditMode ? editedCode : generatedCode;
    if (!codeToDownload) return;
    const extMap = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      csharp: "cs",
    };
    const ext = extMap[language] || "js";
    const blob = new Blob([codeToDownload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hal_test_flow.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedCode, editedCode, isEditMode, language]);

  const handleRefreshCode = useCallback(() => {
    setManualRefresh((prev) => prev + 1);
  }, []);

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, shellLines]);

  // Focus input when switching to interactive mode
  useEffect(() => {
    if (mode === "interactive" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  // ─── Socket: terminal:output ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleOutput = ({ text, streamType }) => {
      setShellLines((prev) => {
        // Split text by newlines and create individual line entries
        const newLines = text.split("\n").map((line, i) => ({
          id: `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          text: line,
          streamType: streamType || "stdout",
        }));
        // Keep only the last MAX_SHELL_LINES
        return [...prev, ...newLines].slice(-MAX_SHELL_LINES);
      });

      // Mark as not running on process exit
      if (text.includes("[Process exited with code")) {
        setIsRunning(false);
      }
    };

    socket.on("terminal:output", handleOutput);
    return () => socket.off("terminal:output", handleOutput);
  }, [socket]);

  // ─── Run command ───────────────────────────────────────────────────────────
  const runCommand = useCallback(() => {
    const trimmed = command.trim();
    if (!trimmed || !socket) return;

    setHistory((prev) => [trimmed, ...prev.slice(0, 49)]); // cap at 50
    setHistoryIndex(-1);
    setCommand("");
    setIsRunning(true);

    socket.emit("terminal:run-command", { command: trimmed });
  }, [command, socket]);

  // ─── Kill running process ─────────────────────────────────────────────────
  const killProcess = useCallback(() => {
    if (socket) {
      socket.emit("terminal:kill");
      setIsRunning(false);
      setShellLines((prev) => [
        ...prev,
        {
          id: `${Date.now()}-kill`,
          text: "[Process terminated by user]",
          streamType: "system",
        },
      ]);
    }
  }, [socket]);

  // ─── Command history navigation ────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      setCommand(history[newIndex] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      setCommand(newIndex === -1 ? "" : history[newIndex]);
    } else if (e.key === "c" && e.ctrlKey) {
      killProcess();
    }
  };

  // ─── Panel Resize Handlers ────────────────────────────────────────────────
  const handleResizeStart = useCallback(
    (e) => {
      e.preventDefault();
      isDraggingPanel.current = true;
      dragStartY.current = e.clientY;
      dragStartHeight.current = panelHeight;

      const handleMouseMove = (moveEvent) => {
        if (!isDraggingPanel.current) return;
        const delta = dragStartY.current - moveEvent.clientY;
        const newHeight = Math.max(
          MIN_PANEL_HEIGHT,
          Math.min(MAX_PANEL_HEIGHT, dragStartHeight.current + delta),
        );
        setPanelHeight(newHeight);
      };

      const handleMouseUp = () => {
        isDraggingPanel.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    [panelHeight],
  );

  if (!isPanelVisible) return null;

  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      exit={{ scaleY: 0, opacity: 0 }}
      style={{ transformOrigin: "bottom", height: panelHeight }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "c" && e.ctrlKey) {
          killProcess();
        }
      }}
      className="relative w-full bg-slate-950 border-t border-slate-800 z-10 flex flex-col shadow-2xl font-mono outline-none overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500/30"
    >
      {/* ── Drag Handle ── */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize z-20 group hover:bg-indigo-500/20 transition-colors"
      >
        <div className="mx-auto mt-0.5 w-8 h-0.5 rounded-full bg-slate-600 group-hover:bg-indigo-400 transition-colors" />
      </div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <Terminal size={14} className="text-hal-primary-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {mode === "log"
              ? t("terminal.title_log", "Execution Logs")
              : mode === "interactive"
                ? t("terminal.title_interactive", "Interactive Shell")
                : t("terminal.title_code", "Code Preview")}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-[9px] text-slate-500">
            {mode === "log"
              ? `${filteredLogs.length} entries`
              : mode === "interactive"
                ? shellLines.length > 0
                  ? `${shellLines.length} lines`
                  : "ready"
                : isGenerating
                  ? "generating..."
                  : "synced"}
          </span>
          {isRunning && (
            <span className="flex items-center gap-1 text-[9px] text-emerald-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              running
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Mode toggles */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            {/* Logs Tab */}
            <button
              onClick={() => setMode("log")}
              title={t("terminal.switch_log", "Execution Logs")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium transition-all",
                mode === "log"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              <ScrollText size={11} />
              {t("terminal.log", "Logs")}
            </button>

            {/* Shell Tab */}
            <button
              onClick={() => setMode("interactive")}
              title={t("terminal.switch_interactive", "Interactive Shell")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium transition-all",
                mode === "interactive"
                  ? "bg-indigo-500/20 text-indigo-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              <TerminalSquare size={11} />
              {t("terminal.interactive", "Shell")}
            </button>

            {/* Code Preview Tab */}
            <button
              onClick={() => setMode("code")}
              title={t("terminal.switch_code", "Code Preview")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium transition-all",
                mode === "code"
                  ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              <Code2 size={11} />
              {t("terminal.code", "Code")}
            </button>
          </div>

          {/* Language Selector (only in code mode) */}
          {mode === "code" && (
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 ml-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  title={lang.label}
                  className={cn(
                    "px-2 py-1 rounded text-[9px] font-medium transition-all whitespace-nowrap",
                    language === lang.id
                      ? "bg-slate-700 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  {lang.id === "javascript"
                    ? "JS"
                    : lang.id === "typescript"
                      ? "TS"
                      : lang.id === "python"
                        ? "PY"
                        : lang.id === "java"
                          ? "JAVA"
                          : "C#"}
                </button>
              ))}
            </div>
          )}

          {/* Framework Selector (only in code mode) */}
          {mode === "code" && (
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 ml-1">
              {FRAMEWORKS.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setFramework(fw.id)}
                  title={fw.label}
                  className={cn(
                    "px-2 py-1 rounded text-[9px] font-medium transition-all whitespace-nowrap",
                    framework === fw.id
                      ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  {fw.label}
                </button>
              ))}
            </div>
          )}

          {/* Design Pattern Selector (only in code mode, Playwright only) */}
          {mode === "code" &&
            framework === "playwright" &&
            (language === "javascript" || language === "typescript") && (
              <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 ml-1">
                {PATTERNS.map((pat) => (
                  <button
                    key={pat.id}
                    onClick={() => setDesignPattern(pat.id)}
                    title={pat.description}
                    className={cn(
                      "px-2 py-1 rounded text-[9px] font-medium transition-all whitespace-nowrap",
                      designPattern === pat.id
                        ? "bg-indigo-500/20 text-indigo-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-300",
                    )}
                  >
                    {pat.label}
                  </button>
                ))}
              </div>
            )}

          {/* Code Actions (only in code mode) */}
          {mode === "code" && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleRefreshCode}
                disabled={isGenerating}
                title={t("terminal.refresh_code", "Regenerate Code")}
                className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-all disabled:opacity-30"
              >
                <RefreshCw
                  size={13}
                  className={isGenerating ? "animate-spin" : ""}
                />
              </button>
              <button
                onClick={handleDownloadCode}
                disabled={!generatedCode}
                title={t("terminal.download_code", "Download File")}
                className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-all disabled:opacity-30"
              >
                <Download size={13} />
              </button>
              <button
                onClick={() => {
                  setIsEditMode(!isEditMode);
                  if (!isEditMode) {
                    setEditedCode(generatedCode);
                  }
                }}
                disabled={!generatedCode}
                title={
                  isEditMode
                    ? t("terminal.exit_edit_mode", "View Mode")
                    : t("terminal.enter_edit_mode", "Advanced Edit Mode")
                }
                className={cn(
                  "p-1.5 rounded transition-all ml-1 border",
                  isEditMode
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                    : "text-slate-500 border-transparent hover:text-amber-400 hover:bg-amber-500/10",
                )}
              >
                {isEditMode ? <Eye size={13} /> : <Edit2 size={13} />}
              </button>
              {isEditMode && (
                <button
                  onClick={() => setShowSyncConfirm(true)}
                  disabled={isSyncing || !editedCode}
                  className="p-1.5 rounded transition-all ml-1 border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1 text-[10px]"
                  title={t("terminal.sync_to_canvas", "Sync Code to Canvas")}
                >
                  <RefreshCw
                    size={11}
                    className={isSyncing ? "animate-spin" : ""}
                  />
                  <span>{t("terminal.sync", "Sync")}</span>
                </button>
              )}
            </div>
          )}

          {/* Kill button (interactive mode only) */}
          {mode === "interactive" && isRunning && (
            <button
              onClick={killProcess}
              title={t("terminal.kill", "Kill Process (Ctrl+C)")}
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-all"
            >
              <OctagonX size={13} />
            </button>
          )}

          {/* Clear */}
          <button
            onClick={() => {
              if (mode === "log") clearLogs(executionMode);
              else setShellLines([]);
            }}
            title={t("terminal.clear", "Clear")}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded transition-all"
          >
            <Trash2 size={14} />
          </button>

          {/* Minimize */}
          <button
            onClick={togglePanel}
            title={t("terminal.minimize", "Minimize")}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded transition-all"
          >
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div
        className="flex-1 relative overflow-hidden" // Main container for content
      >
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto p-3 space-y-px custom-scrollbar scroll-smooth"
        >
          <AnimatePresence mode="wait">
            {mode === "log" ? (
              <motion.div
                key="log"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredLogs.length === 0 ? (
                  <EmptyState />
                ) : (
                  filteredLogs.map((log) => <LogLine key={log.id} log={log} />)
                )}
              </motion.div>
            ) : mode === "interactive" ? (
              <motion.div
                key="interactive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {shellLines.length === 0 ? (
                  <div className="py-2 space-y-1 text-[11px]">
                    <p className="text-indigo-400 font-bold mb-2">
                      {t("terminal.help_title")}
                    </p>
                    <p className="text-slate-500 mb-3">
                      {t("terminal.help_intro")}
                    </p>
                    <div className="space-y-1 pl-2 border-l border-slate-800">
                      <HelpLine
                        cmd="npx playwright --version"
                        desc={t("terminal.cmd_version")}
                      />
                      <HelpLine
                        cmd="npx playwright codegen <url>"
                        desc={t("terminal.cmd_codegen")}
                      />
                      <HelpLine
                        cmd="npx playwright test tests/generated/active_flow.spec.js"
                        desc={t("terminal.cmd_test")}
                      />
                      <HelpLine
                        cmd="npx playwright test tests/generated/active_flow.spec.js --headed"
                        desc={t("terminal.cmd_test_headed")}
                      />
                      <HelpLine
                        cmd="npx playwright show-report"
                        desc={t("terminal.cmd_report")}
                      />
                      <HelpLine
                        cmd="npx playwright install"
                        desc={t("terminal.cmd_install")}
                      />
                    </div>
                    <p className="text-slate-600 mt-3 text-[10px]">
                      {t("terminal.help_footer")}
                    </p>
                  </div>
                ) : (
                  shellLines.map((line) => (
                    <ShellLine key={line.id} line={line} />
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative min-h-full"
              >
                {/* Warnings Banner */}
                {codeWarnings.length > 0 && (
                  <div className="mb-3 flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200/70 text-[10px]">
                    <AlertTriangle
                      size={12}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">
                        {codeWarnings.length}{" "}
                        {t("terminal.warnings_count", "warning(s)")}:
                      </span>
                      <div className="mt-1 space-y-0.5 max-h-16 overflow-y-auto custom-scrollbar">
                        {codeWarnings.map((w, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-1.5 text-amber-300/60"
                          >
                            <span className="text-amber-500/80 shrink-0">
                              •
                            </span>
                            <span className="truncate">
                              <span className="font-medium text-amber-300/80">
                                {w.nodeLabel || w.nodeId}
                              </span>
                              {w.message && (
                                <span className="ml-1">— {w.message}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Lint Report Banner */}
                {codeLintReport && codeLintReport.issues.length > 0 && (
                  <div
                    className={cn(
                      "mb-3 flex items-start gap-2 p-2 rounded text-[10px]",
                      codeLintReport.passed
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-200/70"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-200/70",
                    )}
                  >
                    {codeLintReport.passed ? (
                      <CheckCircle2
                        size={12}
                        className="text-emerald-500 shrink-0 mt-0.5"
                      />
                    ) : (
                      <OctagonX
                        size={12}
                        className="text-rose-500 shrink-0 mt-0.5"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">
                        Lint: {codeLintReport.score}/100
                        <span className="ml-1 opacity-60">
                          ({codeLintReport.summary.errors} error
                          {codeLintReport.summary.errors !== 1 ? "s" : ""},{" "}
                          {codeLintReport.summary.warnings} warning
                          {codeLintReport.summary.warnings !== 1 ? "s" : ""})
                        </span>
                      </span>
                      <div className="mt-1 space-y-0.5 max-h-20 overflow-y-auto custom-scrollbar">
                        {codeLintReport.issues.map((issue, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex items-start gap-1.5",
                              issue.severity === "error"
                                ? "text-rose-300/60"
                                : "text-amber-300/60",
                            )}
                          >
                            <span
                              className={cn(
                                "shrink-0",
                                issue.severity === "error"
                                  ? "text-rose-500/80"
                                  : "text-amber-500/80",
                              )}
                            >
                              •
                            </span>
                            <span className="truncate">
                              <span className="font-medium opacity-80">
                                L{issue.line}
                              </span>
                              <span className="ml-1">{issue.message}</span>
                              {issue.fix && (
                                <span className="ml-1 opacity-50">
                                  → {issue.fix}
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Badge */}
                {codeValidationReport && (
                  <div
                    className={cn(
                      "mb-3 flex items-center gap-2 px-2 py-1 rounded text-[10px]",
                      codeValidationReport.valid
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300/70"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-300/70",
                    )}
                  >
                    {codeValidationReport.valid ? (
                      <CheckCircle2
                        size={10}
                        className="text-emerald-500 shrink-0"
                      />
                    ) : (
                      <OctagonX size={10} className="text-rose-500 shrink-0" />
                    )}
                    <span className="font-medium">
                      {codeValidationReport.valid
                        ? "Syntax OK"
                        : "Syntax Errors"}
                    </span>
                    {!codeValidationReport.valid &&
                      codeValidationReport.errors.length > 0 && (
                        <span className="opacity-60">
                          ({codeValidationReport.errors.length} issue
                          {codeValidationReport.errors.length !== 1 ? "s" : ""})
                        </span>
                      )}
                    {codeValidationReport.warnings.length > 0 && (
                      <span className="text-amber-400/60">
                        ({codeValidationReport.warnings.length} warning
                        {codeValidationReport.warnings.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </div>
                )}

                {/* Error Banner */}
                {codeError && (
                  <div className="mb-3 flex items-start gap-2 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-200/70 text-[10px]">
                    <OctagonX
                      size={12}
                      className="text-rose-500 shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">
                        {t(
                          "terminal.generation_error",
                          "Code generation failed",
                        )}
                        :
                      </span>
                      <span className="ml-1 text-rose-300/60 break-all">
                        {codeError}
                      </span>
                    </div>
                    <button
                      onClick={() => setCodeError(null)}
                      className="text-rose-400 hover:text-rose-300 shrink-0"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}

                {/* Copy Button */}
                <button
                  onClick={handleCopyCode}
                  className="absolute top-0 right-0 p-1.5 rounded bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-white/5 z-10"
                  title={t("common.copy")}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>

                <div className="pr-10 h-full flex flex-col">
                  {isEditMode && (
                    <div className="mb-2 px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-200/80 rounded text-[9px] flex items-center gap-1.5 shrink-0">
                      <AlertTriangle size={10} className="text-amber-500" />
                      <span>
                        {t(
                          "terminal.edit_mode_warning",
                          "Advanced Edit Mode: Any changes will sync back to the visual workflow canvas in real-time.",
                        )}
                      </span>
                    </div>
                  )}
                  {generatedFiles ? (
                    <div
                      className="flex flex-1 overflow-hidden"
                      style={{ minHeight: panelHeight - 100 }}
                    >
                      {/* File Tree Sidebar */}
                      <div className="w-40 shrink-0 border-r border-white/5 overflow-y-auto custom-scrollbar bg-slate-900/30">
                        <div className="p-1.5 text-[9px] text-slate-500 uppercase tracking-wider font-bold">
                          Files
                        </div>
                        {Object.keys(generatedFiles).map((fileName) => (
                          <button
                            key={fileName}
                            onClick={() => {
                              setActiveFile(fileName);
                              setEditedCode(generatedFiles[fileName]);
                            }}
                            className={cn(
                              "w-full text-left px-2 py-1 text-[10px] font-mono truncate transition-colors",
                              activeFile === fileName
                                ? "bg-indigo-500/15 text-indigo-300"
                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                            )}
                          >
                            {fileName.split("/").pop()}
                          </button>
                        ))}
                      </div>
                      {/* Active File Code */}
                      <div
                        className="flex-1 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto selection:bg-indigo-500/30 p-2"
                        style={{ minHeight: panelHeight - 100 }}
                      >
                        <div className="text-[9px] text-slate-500 mb-1 font-bold">
                          {activeFile}
                        </div>
                        <pre className="whitespace-pre-wrap">
                          {generatedFiles[activeFile] || ""}
                        </pre>
                      </div>
                    </div>
                  ) : generatedCode ? (
                    <div
                      className="flex flex-1 overflow-hidden"
                      style={{ minHeight: panelHeight - 100 }}
                    >
                      {isEditMode ? (
                        <div
                          className="flex-1 flex gap-2 overflow-hidden"
                          style={{ height: panelHeight - 100 }}
                        >
                          {/* Line Numbers */}
                          <div className="select-none pr-3 mr-1 border-r border-white/5 text-right flex flex-col shrink-0 overflow-y-hidden">
                            {editedCode.split("\n").map((_, i) => (
                              <div
                                key={i}
                                className="text-[10px] leading-relaxed text-slate-700 font-mono h-[16px] flex items-center justify-end"
                              >
                                {i + 1}
                              </div>
                            ))}
                          </div>
                          <textarea
                            value={editedCode}
                            onChange={(e) => setEditedCode(e.target.value)}
                            className="flex-1 bg-slate-900/40 text-[11px] leading-relaxed text-slate-200 font-mono outline-none border border-white/10 rounded p-2 focus:border-indigo-500/50 resize-none h-full overflow-y-auto selection:bg-indigo-500/30"
                            spellCheck={false}
                          />
                        </div>
                      ) : (
                        <div
                          className="flex-1 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto selection:bg-indigo-500/30"
                          style={{ minHeight: panelHeight - 100 }}
                        >
                          {generatedCode.split("\n").map((line, idx) => {
                            const isActive = idx === activeLineIndex;
                            const isError = errorNodeLines.has(idx);
                            const isHighlighted = highlightedCodeLines.has(idx);
                            const hasNodeId = line.includes("[node_id:");
                            const isFirstError =
                              isError && !errorNodeLines.has(idx - 1);
                            return (
                              <div
                                key={idx}
                                ref={
                                  isActive
                                    ? activeLineRef
                                    : isFirstError
                                      ? errorLineRef
                                      : null
                                }
                                onClick={() =>
                                  hasNodeId && handleCodeLineClick(idx)
                                }
                                className={cn(
                                  "flex items-start px-2 transition-all duration-300 w-full min-w-max",
                                  isActive
                                    ? "bg-amber-500/25 text-amber-200 border-l-2 border-amber-500 font-bold shadow-[inset_0_0_8px_rgba(245,158,11,0.15)]"
                                    : isError
                                      ? "bg-rose-500/15 text-rose-200 border-l-2 border-rose-500/60"
                                      : isHighlighted
                                        ? "bg-indigo-500/15 text-indigo-200 border-l-2 border-indigo-500/60"
                                        : "hover:bg-white/5 border-l-2 border-transparent",
                                  hasNodeId &&
                                    "cursor-pointer hover:bg-indigo-500/10",
                                )}
                              >
                                {/* Line number column */}
                                <span className="select-none w-8 text-right pr-3 mr-3 border-r border-white/5 text-slate-700 text-[10px] shrink-0">
                                  {idx + 1}
                                </span>
                                {/* Line content */}
                                <span
                                  className="flex-1 whitespace-pre"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightCode(line, language),
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50 py-10">
                      {isGenerating ? (
                        <>
                          <RefreshCw
                            size={28}
                            strokeWidth={1}
                            className="animate-spin text-emerald-500/50"
                          />
                          <span className="text-[10px] uppercase tracking-widest text-center">
                            Generating {framework} code...
                          </span>
                        </>
                      ) : (
                        <>
                          <Code2 size={28} strokeWidth={1} />
                          <span className="text-[10px] uppercase tracking-widest text-center">
                            Build your flow to see <br /> generated code here
                          </span>
                          <span className="text-[9px] text-slate-700 mt-1">
                            {framework} · {language}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Input Bar (Interactive Mode only) ── */}
      <AnimatePresence>
        {mode === "interactive" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="shrink-0 border-t border-slate-800 flex items-center gap-2 px-3 py-1.5 bg-slate-900"
          >
            <span className="text-cyan-500 text-xs select-none">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(
                "terminal.placeholder",
                "npx playwright --version  |  ↑↓ history  |  Ctrl+C to kill",
              )}
              disabled={isRunning}
              className="flex-1 bg-transparent text-xs text-slate-200 placeholder:text-slate-600 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <button
              onClick={runCommand}
              disabled={!command.trim() || isRunning}
              className="p-1 rounded text-indigo-400 hover:text-indigo-300 disabled:opacity-30 hover:bg-indigo-500/10 transition-all"
              title={t("terminal.run_command", "Run command (Enter)")}
            >
              <Send size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showSyncConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3 text-amber-400">
                <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {t("terminal.confirm_sync_title", "Sync Code to Canvas?")}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {t(
                      "terminal.confirm_sync_description",
                      "Syncing code will replace the current flow. Any manual node positions or custom layouts will be automatically reset to match the code sequence.",
                    )}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowSyncConfirm(false);
                    handleSyncCodeToCanvas();
                  }}
                  className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {t("terminal.confirm_sync_btn", "Got it")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50">
      <Terminal size={28} strokeWidth={1} />
      <span className="text-[10px] uppercase tracking-widest">
        Awaiting execution...
      </span>
    </div>
  );
}

function LogLine({ log }) {
  return (
    <div className="flex items-start gap-3 group animate-in fade-in slide-in-from-left-1 duration-300">
      <span className="text-[10px] text-slate-600 shrink-0 select-none pt-0.5">
        [{log.timestamp}]
      </span>
      <span
        className={cn(
          "text-xs break-all",
          LOG_COLORS[log.type] ?? "text-slate-300",
        )}
      >
        {log.nodeId && (
          <span className="text-slate-500 mr-2 opacity-50 select-none">
            [
            {typeof log.nodeId === "string"
              ? log.nodeId.split("-")[0]
              : String(log.nodeId)}
            ]
          </span>
        )}
        {log.message}
      </span>
    </div>
  );
}

function ShellLine({ line }) {
  if (!line.text && line.text !== "0") return null;
  return (
    <div
      className={cn(
        "text-xs whitespace-pre-wrap break-all leading-relaxed",
        LOG_COLORS[line.streamType] ?? "text-slate-200",
      )}
    >
      {line.text}
    </div>
  );
}

function HelpLine({ cmd, desc }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-cyan-400 font-mono shrink-0">{cmd}</span>
      <span className="text-slate-600 text-[10px]">— {desc}</span>
    </div>
  );
}

/** Enhanced syntax highlighting using regex (Single pass to avoid nested replacements) */
function highlightCode(code, language = "javascript") {
  if (!code) return "";

  // 1. First escape HTML special characters
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Define patterns in priority order
  const isPython = language === "python";
  const patterns = [
    {
      name: "comment",
      regex: isPython ? /(#.*$)/ : /(\/\/.*$|\/\*[\s\S]*?\*\/)/,
    },
    {
      name: "template",
      regex: /(`(?:[^`\\]|\\.)*`)/,
    },
    {
      name: "string",
      regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/,
    },
    {
      name: "keyword",
      regex:
        /\b(await|async|import|test|expect|from|let|const|console|def|class|public|static|void|using|namespace|var|return|throw|new|if|else|for|while|switch|case|break|continue|try|catch|finally|in|of|function|lambda|pass|raise|with|as|match|foreach|int|string|bool)\b/,
    },
    {
      name: "builtin",
      regex:
        /\b(page|browser|context|route|test|expect|assertThat|Expect|console|System|Console|print|require|JSON)\b/,
    },
    {
      name: "method",
      regex: /\.(\w+)\s*\(/,
    },
    {
      name: "number",
      regex: /\b(\d+(?:\.\d+)?)\b/,
    },
  ];

  // 3. Combine into a single regex
  const combinedRegex = new RegExp(
    patterns.map((p) => p.regex.source).join("|"),
    "gm",
  );

  // 4. Single pass replacement
  return escaped.replace(combinedRegex, (match, ...args) => {
    const m1 = args[0]; // comment
    const m2 = args[1]; // template literal
    const m3 = args[2]; // string
    const m4 = args[3]; // keyword
    const m5 = args[4]; // builtin
    const m6 = args[5]; // method
    const m7 = args[6]; // number

    if (m1) return `<span class="text-slate-600">${m1}</span>`;
    if (m2) return `<span class="text-emerald-400">${m2}</span>`;
    if (m3) return `<span class="text-emerald-400">${m3}</span>`;
    if (m4) return `<span class="text-indigo-400 font-bold">${m4}</span>`;
    if (m5) return `<span class="text-cyan-400">${m5}</span>`;
    if (m6) return `.<span class="text-yellow-300">${m6}</span>(`;
    if (m7) return `<span class="text-amber-400">${m7}</span>`;
    return match;
  });
}
