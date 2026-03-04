import React, { useEffect, useRef, useState, useCallback } from "react";
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
} from "lucide-react";
import { useLogs } from "../context/LogContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { api } from "../utils/api";

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

export default function TerminalPanel({ socket, nodes = [], edges = [] }) {
  const { logs, clearLogs, isPanelVisible, togglePanel } = useLogs();
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // ─── Mode ─────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState("log");

  // ─── Code Preview ─────────────────────────────────────────────────────────
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState("javascript");

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
      try {
        // Convert nodes to flow steps format expected by backend
        const flowSteps = nodes.map((node) => ({
          type: node.data.type,
          data: {
            configuration: node.data.configuration,
            label: node.data.label,
            customLabel: node.data.customLabel,
          },
        }));

        const result = await api.post("/export/code", {
          flow: flowSteps,
          framework: "playwright",
          language: language,
        });

        if (result.success && result.code) {
          setGeneratedCode(result.code);
        }
      } catch (err) {
        console.error("Failed to generate real-time code:", err);
      } finally {
        setIsGenerating(false);
      }
    }, CODE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [nodes, edges, mode, language]);

  const handleCopyCode = useCallback(() => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [generatedCode]);

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

  if (!isPanelVisible) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 260, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      tabIndex={0}
      onKeyDown={(e) => {
        // Global Ctrl+C handler for the panel
        if (e.key === "c" && e.ctrlKey) {
          killProcess();
        }
      }}
      className="relative w-full bg-slate-950 border-t border-slate-800 z-10 flex flex-col shadow-2xl font-mono outline-none overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500/30"
    >
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
              ? `${logs.length} entries`
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
              if (mode === "log") clearLogs();
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
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-px custom-scrollbar scroll-smooth"
      >
        <AnimatePresence mode="wait">
          {mode === "log" ? (
            <motion.div
              key="log"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {logs.length === 0 ? (
                <EmptyState />
              ) : (
                logs.map((log) => <LogLine key={log.id} log={log} />)
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
              className="relative h-full"
            >
              {/* Copy Button */}
              <button
                onClick={handleCopyCode}
                className="absolute top-0 right-0 p-1.5 rounded bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-white/5"
                title={t("common.copy")}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>

              <div className="pr-10">
                {generatedCode ? (
                  <pre className="text-[11px] leading-relaxed text-slate-300 font-mono overflow-x-auto selection:bg-indigo-500/30">
                    <code
                      dangerouslySetInnerHTML={{
                        __html: highlightCode(generatedCode, language),
                      }}
                    />
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50 py-10">
                    <Code2 size={28} strokeWidth={1} />
                    <span className="text-[10px] uppercase tracking-widest text-center">
                      Build your flow to see <br /> generated code here
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input Bar (Interactive Mode only) ── */}
      <AnimatePresence>
        {mode === "interactive" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
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
            [{log.nodeId.split("-")[0]}]
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

/** Simple syntax highlighting using regex (Single pass to avoid nested replacements) */
function highlightCode(code, language = "javascript") {
  if (!code) return "";

  // 1. First escape HTML special characters
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Define patterns in priority order
  const patterns = [
    {
      name: "comment",
      regex: language === "python" ? /(#.*$)/ : /(\/\/.*$|\/\*[\s\S]*?\*\/)/,
    },
    { name: "string", regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/ },
    {
      name: "keyword",
      regex:
        /\b(await|async|import|test|expect|from|let|const|console|def|class|public|static|void|using|namespace|var|var)\b/,
    },
    { name: "number", regex: /\b(\d+)\b/ },
  ];

  // 3. Combine into a single regex
  const combinedRegex = new RegExp(
    patterns.map((p) => p.regex.source).join("|"),
    "gm",
  );

  // 4. Single pass replacement
  return escaped.replace(combinedRegex, (match, ...args) => {
    // Find which group matched
    // args contains: [group1, group2, ..., offset, string]
    const m1 = args[0]; // comment
    const m2 = args[1]; // string
    const m3 = args[2]; // keyword
    const m4 = args[3]; // number

    if (m1) return `<span class="text-slate-600">${m1}</span>`;
    if (m2) return `<span class="text-emerald-400">${m2}</span>`;
    if (m3) return `<span class="text-indigo-400 font-bold">${m3}</span>`;
    if (m4) return `<span class="text-amber-400">${m4}</span>`;
    return match;
  });
}
