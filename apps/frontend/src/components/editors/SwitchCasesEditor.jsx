import React, { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftRight,
  Info,
  CornerDownRight,
  CheckCircle,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowDown,
  Shield,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import VariableInput from "../VariableInput";

/**
 * SwitchCasesEditor — Premium configuration editor for the Switch node.
 *
 * Renders a visual "flow" showing:
 *   「 evaluated value 」→ COMPARISON → Case 1, Case 2, ... → Default
 *
 * Features:
 * - Resolved value preview (from last execution)
 * - Duplicate case detection with warning badges
 * - Empty value detection with amber warnings
 * - Non-removable "Default / Fallback" row
 * - Matched case highlighting (emerald glow)
 * - Drag-to-reorder via native drag events
 * - Connection status per case
 */
const SwitchCasesEditor = React.memo(
  ({
    value,
    onChange,
    data,
    variables,
    allVariables,
    suggestions,
    comparisonType = "equals",
    edges = [],
    nodeId,
  }) => {
    const { t } = useTranslation();
    const cases = useMemo(() => (Array.isArray(value) ? value : []), [value]);

    // Execution result data
    const matchedCaseId =
      data?.result?.matchedCaseId || data?.result?.data?.matchedCaseId;
    const resolvedValue =
      data?.result?.resolvedValue ?? data?.result?.data?.resolvedValue;
    const hasExecuted = resolvedValue !== undefined && resolvedValue !== null;

    // Duplicate detection: find case values that appear more than once
    const duplicateValues = useMemo(() => {
      const counts = {};
      cases.forEach((c) => {
        const v = (c.value || "").trim().toLowerCase();
        if (v) counts[v] = (counts[v] || 0) + 1;
      });
      return new Set(
        Object.entries(counts)
          .filter(([, count]) => count > 1)
          .map(([v]) => v),
      );
    }, [cases]);

    // Connected handles: check which case IDs have edges connected
    const connectedHandles = useMemo(() => {
      if (!edges || !nodeId) return new Set();
      return new Set(
        edges
          .filter((e) => e.source === nodeId)
          .map((e) => e.sourceHandle || "default"),
      );
    }, [edges, nodeId]);

    const updateCase = useCallback(
      (index, field, val) => {
        const newCases = [...cases];
        newCases[index] = { ...newCases[index], [field]: val };
        onChange(newCases);
      },
      [cases, onChange],
    );

    const addCase = useCallback(() => {
      const id = `case_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      onChange([...cases, { id, value: "", label: "" }]);
    }, [cases, onChange]);

    const removeCase = useCallback(
      (index) => {
        const newCases = [...cases];
        newCases.splice(index, 1);
        onChange(newCases);
      },
      [cases, onChange],
    );

    const moveCase = useCallback(
      (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= cases.length) return;
        const newCases = [...cases];
        const [moved] = newCases.splice(fromIndex, 1);
        newCases.splice(toIndex, 0, moved);
        onChange(newCases);
      },
      [cases, onChange],
    );

    const getValueType = (val) => {
      if (!val || typeof val !== "string") return "string";
      if (val.startsWith("{{") || val.startsWith("${")) return "variable";
      if (val === "true" || val === "false") return "boolean";
      if (val !== "" && !isNaN(val)) return "number";
      return "string";
    };

    const comparisonLabel =
      {
        equals: "=",
        contains: "∋",
        startsWith: "⊳",
        endsWith: "⊲",
        regex: "/.*/",
      }[comparisonType] || "=";

    const comparisonDescription =
      {
        equals: t("nodes.hints.comparison_equals", "Exact match"),
        contains: t("nodes.hints.comparison_contains", "Contains substring"),
        startsWith: t("nodes.hints.comparison_starts", "Starts with"),
        endsWith: t("nodes.hints.comparison_ends", "Ends with"),
        regex: t("nodes.hints.comparison_regex", "Regex pattern"),
      }[comparisonType] || "Exact match";

    return (
      <div className="space-y-3 mt-2 mb-2">
        {/* ── VISUAL FLOW HEADER ── */}
        <div className="relative bg-[#0b1222]/60 rounded-xl border border-indigo-500/20 p-3 space-y-2">
          {/* Resolved value preview */}
          {hasExecuted && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[9px] uppercase tracking-widest font-black text-indigo-400/70">
                {t("nodes.config.resolved_value", "Resolved Value")}
              </span>
              <span className="ml-auto font-mono text-xs text-indigo-200 bg-black/30 px-2 py-0.5 rounded border border-indigo-500/10 max-w-[200px] truncate">
                {typeof resolvedValue === "object"
                  ? JSON.stringify(resolvedValue)
                  : String(resolvedValue)}
              </span>
            </div>
          )}

          {/* Comparison type indicator */}
          <div className="flex items-center justify-center gap-2 py-1">
            <ArrowDown size={10} className="text-slate-500" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700/50 rounded-lg">
              <span className="text-[10px] font-mono font-bold text-slate-300">
                {comparisonLabel}
              </span>
              <span className="text-[9px] text-slate-500">
                {comparisonDescription}
              </span>
            </div>
            <ArrowDown size={10} className="text-slate-500" />
          </div>
        </div>

        {/* ── CASES HEADER ── */}
        <div className="flex justify-between items-center">
          <label className="text-[11px] uppercase tracking-[0.2em] font-black text-indigo-400 ml-1 flex items-center gap-2">
            <ArrowLeftRight size={14} />
            {t("nodes.config.switch_cases", "Switch Cases")}
            {cases.length > 0 && (
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400/70 px-1.5 py-0.5 rounded-full">
                {cases.length}
              </span>
            )}
          </label>
          <div className="group relative">
            <Info
              size={14}
              className="text-slate-500 hover:text-indigo-400 cursor-help transition-colors"
            />
            <div className="absolute right-0 bottom-full mb-2 w-56 p-3 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl space-y-1">
              <p className="font-bold text-indigo-400">
                {t("nodes.hints.switch_title", "How it works")}
              </p>
              <p>
                {t(
                  "nodes.hints.switch_logic",
                  "The evaluated value is compared against each case from top to bottom. The first match determines the output path. If no case matches, the Default path is taken.",
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ── CASES LIST ── */}
        <div className="space-y-2">
          {cases.map((c, index) => {
            const isMatched = matchedCaseId === c.id;
            const type = getValueType(c.value);
            const isEmpty = !c.value || c.value.trim() === "";
            const isDuplicate = duplicateValues.has(
              (c.value || "").trim().toLowerCase(),
            );
            const isConnected = connectedHandles.has(c.id);

            return (
              <div
                key={c.id}
                className={cn(
                  "px-3 py-2.5 bg-[#0f172a]/60 border rounded-xl space-y-1.5 relative group/case transition-all",
                  isMatched
                    ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : isEmpty
                      ? "border-amber-500/30 bg-amber-500/5"
                      : isDuplicate
                        ? "border-rose-500/30 bg-rose-500/5"
                        : "border-indigo-500/15 hover:border-indigo-500/30",
                )}
              >
                {/* Matched badge */}
                {isMatched && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-0.5 shadow-lg border border-white z-10">
                    <CheckCircle size={10} strokeWidth={3} />
                  </div>
                )}

                {/* Main case row */}
                <div className="flex items-center gap-2">
                  {/* Drag handle + index */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveCase(index, index - 1)}
                      disabled={index === 0}
                      className="text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors p-0.5"
                      title="Move up"
                    >
                      <GripVertical size={10} />
                    </button>
                    <span className="text-[8px] font-mono text-slate-600">
                      {index + 1}
                    </span>
                  </div>

                  {/* Case icon */}
                  <div
                    className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center shrink-0",
                      isMatched
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-indigo-500/10 border-indigo-500/20",
                    )}
                  >
                    <CornerDownRight
                      size={10}
                      className={
                        isMatched ? "text-emerald-400" : "text-indigo-400"
                      }
                    />
                  </div>

                  {/* Value input */}
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <VariableInput
                      value={c.value}
                      variables={variables}
                      allVariables={allVariables}
                      suggestions={suggestions}
                      autoOpen
                      placeholder={t(
                        "nodes.placeholders.switch_value",
                        "Value (e.g., admin, true, 200)",
                      )}
                      onChange={(e) =>
                        updateCase(index, "value", e.target.value)
                      }
                      hasError={isEmpty || isDuplicate}
                      className="w-full bg-transparent border-none p-0 text-xs font-bold text-white focus:outline-none placeholder:text-slate-600 focus:ring-0"
                    />
                  </div>

                  {/* Type badge */}
                  <span
                    className={cn(
                      "text-[8px] uppercase tracking-tighter font-black px-1.5 py-0.5 rounded shrink-0",
                      type === "boolean"
                        ? "text-amber-400 bg-amber-400/10"
                        : type === "number"
                          ? "text-sky-400 bg-sky-400/10"
                          : type === "variable"
                            ? "text-emerald-400 bg-emerald-400/10"
                            : "text-slate-500 bg-slate-500/10",
                    )}
                  >
                    {type}
                  </span>

                  {/* Connection indicator */}
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      isConnected ? "bg-emerald-400" : "bg-slate-700",
                    )}
                    title={isConnected ? "Connected" : "No edge connected"}
                  />

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeCase(index)}
                    className="p-1 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover/case:opacity-100"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>

                {/* Warnings */}
                {(isEmpty || isDuplicate) && (
                  <div className="flex items-center gap-1.5 pl-7">
                    <AlertTriangle
                      size={10}
                      className={
                        isDuplicate ? "text-rose-400" : "text-amber-400"
                      }
                    />
                    <span
                      className={cn(
                        "text-[9px]",
                        isDuplicate ? "text-rose-400" : "text-amber-400",
                      )}
                    >
                      {isDuplicate
                        ? t(
                            "nodes.warnings.duplicate_case",
                            "Duplicate value — only the first match will execute",
                          )
                        : t(
                            "nodes.warnings.empty_case",
                            "Empty value — this case will never match",
                          )}
                    </span>
                  </div>
                )}

                {/* Label row */}
                <div className="flex items-center gap-2 pl-7 border-t border-white/5 pt-1.5 min-w-0">
                  <input
                    type="text"
                    placeholder={t("common.optional_label", "Label (optional)")}
                    value={c.label || ""}
                    onChange={(e) => updateCase(index, "label", e.target.value)}
                    title={c.label}
                    className="flex-1 bg-transparent border-none p-0 text-[10px] font-medium text-slate-400 focus:outline-none placeholder:text-slate-700 focus:ring-0 truncate min-w-0"
                  />
                  <div className="bg-black/30 px-1.5 py-0.5 rounded text-[7px] font-mono text-slate-600 shrink-0">
                    {c.id?.substring(0, 16)}…
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {cases.length === 0 && (
            <div className="text-center py-5 border border-dashed border-slate-700 rounded-xl text-slate-500 text-[10px] space-y-1">
              <ArrowLeftRight
                size={20}
                className="mx-auto text-slate-600 mb-1"
              />
              <p className="font-bold">
                {t("nodes.config.no_cases", "No cases defined")}
              </p>
              <p className="text-slate-600">
                {t(
                  "nodes.config.no_cases_hint",
                  "Add a case to start routing your flow",
                )}
              </p>
            </div>
          )}
        </div>

        {/* ── ADD CASE BUTTON ── */}
        <button
          type="button"
          onClick={addCase}
          className="w-full py-2 bg-indigo-500/5 hover:bg-indigo-500/10 border border-dashed border-indigo-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-2 transition-all hover:border-indigo-500/50"
        >
          <Plus size={12} />
          {t("nodes.config.add_case", "Add Case")}
        </button>

        {/* ── DEFAULT / FALLBACK ── */}
        <div className="px-3 py-2.5 bg-slate-900/40 border border-slate-700/40 border-dashed rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-slate-700/30 border border-slate-600/30 flex items-center justify-center shrink-0">
              <Shield size={10} className="text-slate-400" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t("common.default", "Default")}
              </span>
              <span className="text-[9px] text-slate-600 ml-2">
                {t(
                  "nodes.hints.default_case",
                  "Fallback — when no case matches",
                )}
              </span>
            </div>
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                connectedHandles.has("default")
                  ? "bg-emerald-400"
                  : "bg-slate-700",
              )}
              title={
                connectedHandles.has("default")
                  ? "Connected"
                  : "No edge connected"
              }
            />
          </div>
          {matchedCaseId === null && hasExecuted && (
            <div className="flex items-center gap-1.5 mt-1.5 pl-7">
              <CheckCircle size={10} className="text-amber-400" />
              <span className="text-[9px] text-amber-400">
                {t(
                  "nodes.hints.default_matched",
                  "No case matched — default path was taken",
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

SwitchCasesEditor.displayName = "SwitchCasesEditor";

export default SwitchCasesEditor;
