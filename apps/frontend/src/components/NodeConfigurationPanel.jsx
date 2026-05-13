import React, { useMemo, useState, useCallback } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Info,
  Crosshair,
  Layout,
  ArrowRight,
  FileText,
  ArrowLeftRight,
  Box,
  Eye,
  EyeOff,
} from "lucide-react";
import { NODE_STATES } from "./hooks/flowStyles";
import {
  Sparkles,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Maximize2,
  Split,
  Zap,
  GitBranch,
  XCircle,
  Plus,
  CornerDownRight,
  Check,
  AlertTriangle,
  Database,
  List,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  CATEGORY_STYLES,
  NODE_TYPE_MAP,
  NODE_OUTPUTS,
} from "@/config/nodeConstants";
import { NODE_INPUTS } from "@/config/validationRules";
import { api } from "../utils/api";
import EvidenceCard from "./EvidenceCard"; // New component import
import VariableInput from "./VariableInput";

const ConditionalBranchesEditor = React.memo(
  ({
    value,
    onChange,
    variables,
    allVariables,
    _precedingNodes,
    suggestions,
  }) => {
    const { t } = useTranslation();
    const branches = useMemo(() => {
      let activeValue = value;
      if (typeof value === "string" && value.startsWith("[")) {
        try {
          activeValue = JSON.parse(value);
        } catch {
          activeValue = [];
        }
      }

      const safeBranches =
        Array.isArray(activeValue) && activeValue.length > 0
          ? activeValue
          : [
              {
                id: "true",
                label: "True",
                expression: { left: "", operator: "==", right: "" },
                mode: "simple",
              },
              { id: "false", label: "Else", expression: "", mode: "advanced" },
            ];

      // Sanitization: Ensure each branch has a mode that matches its expression
      return safeBranches.map((b) => {
        // Prevent literal "[object Object]" strings from corrupting the UI
        let cleanExpr = b.expression;

        // Structured expression deep cleaning
        if (cleanExpr && typeof cleanExpr === "object" && "left" in cleanExpr) {
          cleanExpr = {
            ...cleanExpr,
            left:
              typeof cleanExpr.left === "string" &&
              cleanExpr.left === "[object Object]"
                ? ""
                : typeof cleanExpr.left === "object"
                  ? ""
                  : cleanExpr.left,
            right:
              typeof cleanExpr.right === "string" &&
              cleanExpr.right === "[object Object]"
                ? ""
                : typeof cleanExpr.right === "object"
                  ? ""
                  : cleanExpr.right,
          };
        }

        if (
          (typeof cleanExpr === "string" && cleanExpr === "[object Object]") ||
          cleanExpr === null
        ) {
          cleanExpr = "";
        }

        const hasStructuredExpr =
          cleanExpr && typeof cleanExpr === "object" && "left" in cleanExpr;
        return {
          ...b,
          expression: cleanExpr,
          mode: b.mode || (hasStructuredExpr ? "simple" : "advanced"),
        };
      });
    }, [value]);

    // Refined variable paths for a cleaner UI
    // Refined variable paths for a cleaner UI (Suggestions are now passed from parent)
    const availableVariablePaths = suggestions || [];

    const updateBranch = React.useCallback(
      (index, field, val) => {
        const newBranches = [...branches];
        const currentBranch = { ...newBranches[index] };

        // Handle nested expression object update
        if (field.startsWith("expr_")) {
          const subField = field.replace("expr_", "");
          const currentExpr =
            typeof currentBranch.expression === "object" &&
            currentBranch.expression !== null
              ? { ...currentBranch.expression }
              : { left: "", operator: "==", right: "" };

          currentExpr[subField] = val;
          currentBranch.expression = currentExpr;
          currentBranch.mode = "simple";
        } else {
          currentBranch[field] = val;
        }

        newBranches[index] = currentBranch;
        onChange(newBranches);
      },
      [branches, onChange],
    );

    const toggleMode = React.useCallback(
      (index) => {
        const newBranches = [...branches];
        const branch = { ...newBranches[index] };

        // SAFE TOGGLE: Ensure we transition between clean states
        if (branch.mode === "simple") {
          branch.mode = "advanced";
          branch.expression = ""; // Advanced mode uses a string
        } else {
          branch.mode = "simple";
          branch.expression = { left: "", operator: "==", right: "" }; // Simple mode uses an object
        }

        newBranches[index] = branch;
        onChange(newBranches);
      },
      [branches, onChange],
    );

    const addBranch = React.useCallback(() => {
      onChange([
        ...branches,
        {
          id: `branch_${Date.now()}`,
          label: "Nueva",
          expression: { left: "", operator: "==", right: "" },
          mode: "simple",
        },
      ]);
    }, [branches, onChange]);

    const removeBranch = React.useCallback(
      (index) => {
        if (branches.length <= 1) return; // Prevent deleting last
        const newBranches = [...branches];
        newBranches.splice(index, 1);
        onChange(newBranches);
      },
      [branches, onChange],
    );

    const operators = [
      { label: "==", value: "==" },
      { label: "!=", value: "!=" },
      { label: ">", value: ">" },
      { label: "<", value: "<" },
      { label: ">=", value: ">=" },
      { label: "<=", value: "<=" },
      { label: "Contains", value: "contains" },
      { label: "Exists", value: "exists" },
    ];

    // Helper to resolve variables in the frontend for live validation
    const resolveVariableValue = React.useCallback(
      (val) => {
        if (!val || typeof val !== "string") return val;

        const match = val.match(/\{\{([^}]+)\}\}/);
        if (!match) return val;

        const fullPath = match[1];
        const parts = fullPath.split(".");
        const nodeName = parts[0];
        const propPath = parts.slice(1);

        const normalize = (str) =>
          str
            .toLowerCase()
            .replace(/\s*\(library\)\s*/g, "")
            .replace(/[^a-z0-9]/g, "");

        const normNodeName = normalize(nodeName);

        // Recursive driller
        const drill = (obj, pathParts) => {
          let curr = obj;
          for (const p of pathParts) {
            if (curr === null || curr === undefined || typeof curr !== "object")
              return undefined;
            if (p in curr) {
              curr = curr[p];
            } else {
              return undefined;
            }
          }
          return curr;
        };

        const realNodeKey = Object.keys(variables || {}).find(
          (k) => normalize(k) === normNodeName,
        );

        if (!realNodeKey) return undefined;

        const nodeData = variables[realNodeKey];
        return drill(nodeData, propPath);
      },
      [variables],
    );

    // Get value suggestions based on selected left variable
    const getValueSuggestions = React.useCallback(
      (leftRef) => {
        if (!leftRef || typeof leftRef !== "string") return [];

        const varNameMatch = leftRef.match(/\{\{([^}]+)\}\}/);
        if (!varNameMatch) return [];

        const fullPath = varNameMatch[1];
        const parts = fullPath.split(".");
        const propName = parts[parts.length - 1];

        const value = resolveVariableValue(leftRef);

        const items = [];
        if (
          value !== undefined &&
          value !== null &&
          typeof value !== "object"
        ) {
          items.push({
            label: String(value),
            path: String(value),
            type: typeof value,
          });
        }

        // Add smart defaults for common fields
        if (propName === "status") {
          ["success", "error", "loading", "pending"].forEach((s) => {
            if (!items.find((i) => i.label === s)) {
              items.push({ label: s, path: s, type: "string" });
            }
          });
        }
        if (propName === "success") {
          ["true", "false"].forEach((s) => {
            if (!items.find((i) => i.label === s)) {
              items.push({ label: s, path: s, type: "boolean" });
            }
          });
        }

        if (items.length === 0) return [];

        return [
          {
            nodeLabel: t(
              "nodes.config.conditional.suggested_values",
              "Valores Sugeridos",
            ),
            items: items.slice(0, 10),
          },
        ];
      },
      [resolveVariableValue, t],
    );

    // Helper to evaluate conditions in real-time
    const evaluateSimpleCondition = React.useCallback(
      (left, op, right) => {
        let rL = resolveVariableValue(left);
        let rR = resolveVariableValue(right);

        if (rL === undefined) return null; // Cannot evaluate yet

        // Type Normalization (Match backend VariableManager)
        if (
          typeof rL === "number" &&
          typeof rR === "string" &&
          rR !== "" &&
          !isNaN(rR)
        )
          rR = Number(rR);
        if (
          typeof rR === "number" &&
          typeof rL === "string" &&
          rL !== "" &&
          !isNaN(rL)
        )
          rL = Number(rL);
        if (typeof rL === "boolean" && typeof rR === "string") {
          const n = rR.trim().toLowerCase();
          if (n === "true") rR = true;
          else if (n === "false") rR = false;
        }

        switch (op) {
          case "==":
            return rL == rR;
          case "!=":
            return rL != rR;
          case ">":
            return Number(rL) > Number(rR);
          case "<":
            return Number(rL) < Number(rR);
          case ">=":
            return Number(rL) >= Number(rR);
          case "<=":
            return Number(rL) <= Number(rR);
          case "contains":
            return (
              rL !== undefined &&
              rR !== undefined &&
              String(rL).includes(String(rR))
            );
          case "exists":
            return rL !== undefined;
          default:
            return false;
        }
      },
      [resolveVariableValue],
    );

    return (
      <div className="space-y-4 mt-2 mb-2">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-sky-500 rounded-full" />
            <label className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400">
              {t("nodes.config.conditional.control_logic", "Lógica de Control")}
            </label>
          </div>
          <span className="text-[9px] font-bold text-slate-600 bg-slate-800/50 px-2 py-0.5 rounded-full border border-white/5">
            {branches.length}{" "}
            {branches.length === 1
              ? t("common.rule", "regla")
              : t("common.rules", "reglas")}
          </span>
        </div>

        <div className="space-y-3">
          {branches.map((branch, index) => {
            const hasStructuredExpr =
              branch.expression &&
              typeof branch.expression === "object" &&
              "left" in branch.expression;
            const isAdvanced = branch.mode === "advanced" && !hasStructuredExpr;
            const isDefault = isAdvanced && !branch.expression;
            const isTrue = branch.id === "true";
            const isFalse = branch.id === "false";
            const isElseBranch = isFalse || isDefault;

            return (
              <div
                key={`branch-${branch.id}-${index}`}
                className={cn(
                  "rounded-2xl transition-all duration-200",
                  isElseBranch
                    ? "bg-slate-900/40 border border-slate-800"
                    : "bg-[#0f172a] border border-slate-800 hover:border-sky-500/30 shadow-xl shadow-black/20",
                )}
              >
                {/* Cabecera de la Regla */}
                <div
                  className={cn(
                    "flex items-center justify-between px-4 py-2 border-b",
                    isElseBranch
                      ? "border-slate-800/50 bg-slate-800/20"
                      : "border-white/5 bg-white/[0.02]",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-inner",
                        isTrue
                          ? "bg-emerald-500/20 text-emerald-400"
                          : isElseBranch
                            ? "bg-slate-700/50 text-slate-500"
                            : "bg-sky-500/20 text-sky-400",
                      )}
                    >
                      {isTrue ? (
                        <Check size={12} strokeWidth={3} />
                      ) : isElseBranch ? (
                        <CornerDownRight size={12} />
                      ) : (
                        <GitBranch size={12} />
                      )}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                      {isElseBranch
                        ? t(
                            "nodes.config.conditional.else_fallback",
                            "Si nada coincide",
                          )
                        : index === 0
                          ? t("nodes.config.conditional.if", "Si")
                          : t("nodes.config.conditional.else_if", "O si")}
                    </span>
                    <input
                      type="text"
                      placeholder={
                        isElseBranch
                          ? t(
                              "nodes.config.conditional.placeholder_fallback",
                              "Ir por defecto...",
                            )
                          : t(
                              "nodes.config.conditional.placeholder_label",
                              "Nombre de la ruta...",
                            )
                      }
                      value={String(branch.label || "")}
                      onChange={(e) =>
                        updateBranch(index, "label", e.target.value)
                      }
                      title={String(branch.label || "")}
                      className="bg-transparent border-none p-0 text-[11px] font-bold text-white/90 focus:outline-none placeholder:text-slate-700 focus:ring-0 truncate min-w-0 flex-1"
                    />
                  </div>

                  {!isElseBranch && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleMode(index)}
                        className={cn(
                          "text-[8px] font-black px-1.5 py-0.5 rounded border transition-colors",
                          isAdvanced
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            : "bg-slate-800 border-white/5 text-slate-500 hover:text-slate-300",
                        )}
                      >
                        {isAdvanced
                          ? t("nodes.config.conditional.js_mode", "JS")
                          : t("nodes.config.conditional.rule_mode", "REGLA")}
                      </button>
                      <button
                        onClick={() => removeBranch(index)}
                        className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Cuerpo de la Regla */}
                <div className="p-4">
                  {isElseBranch ? (
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-800" />
                      <span className="text-[10px] font-medium italic">
                        {t(
                          "nodes.config.conditional.escape_route",
                          "Ruta de escape final",
                        )}
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-800" />
                    </div>
                  ) : isAdvanced ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase mb-1">
                        <Terminal size={10} />{" "}
                        {t(
                          "nodes.fields.conditionScript",
                          "Script de Condición",
                        )}
                      </div>
                      <VariableInput
                        value={
                          typeof branch.expression === "string"
                            ? branch.expression
                            : ""
                        }
                        variables={variables}
                        placeholder={t(
                          "nodes.placeholders.condition_expression",
                          "ej: ${status} === 200",
                        )}
                        onChange={(e) =>
                          updateBranch(index, "expression", e.target.value)
                        }
                        className="bg-black/40 border-slate-800 focus:border-sky-500/50 min-h-[40px] text-[11px] rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Fila de la Sentencia Natural */}
                      <div className="flex flex-wrap items-center gap-2 bg-slate-900/40 p-2 rounded-xl border border-white/5">
                        {/* Izquierda (Variable) */}
                        <div className="flex-1 min-w-[140px] relative">
                          <VariableInput
                            id={`var-input-left-${index}`}
                            value={String(branch.expression?.left || "")}
                            onChange={(e) =>
                              updateBranch(index, "expr_left", e.target.value)
                            }
                            variables={variables}
                            allVariables={allVariables}
                            suggestions={availableVariablePaths}
                            placeholder={t(
                              "nodes.config.conditional.placeholder_var",
                              "Variable...",
                            )}
                            className="bg-slate-800/40 border-transparent text-[11px] h-8 rounded-lg focus:bg-slate-800 focus:border-sky-500/30 pr-8"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                            <ChevronDown size={12} />
                          </div>
                        </div>

                        {/* Operador */}
                        <div className="w-14">
                          <select
                            value={branch.expression?.operator || "=="}
                            onChange={(e) =>
                              updateBranch(
                                index,
                                "expr_operator",
                                e.target.value,
                              )
                            }
                            className="w-full bg-slate-800/80 border-white/5 rounded-lg text-[11px] font-black text-sky-400 h-8 text-center appearance-none cursor-pointer focus:ring-1 focus:ring-sky-500/50 outline-none"
                          >
                            {operators.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Derecha (Valor) */}
                        <div className="flex-1 min-w-[100px]">
                          <VariableInput
                            value={branch.expression?.right || ""}
                            variables={allVariables || variables}
                            contextualVariables={variables}
                            suggestions={[
                              ...getValueSuggestions(branch.expression?.left),
                              ...availableVariablePaths,
                            ]}
                            placeholder={t(
                              "nodes.config.conditional.placeholder_val",
                              "Valor...",
                            )}
                            onChange={(e) =>
                              updateBranch(index, "expr_right", e.target.value)
                            }
                            className="bg-slate-800/40 border-transparent text-[11px] h-8 rounded-lg focus:bg-slate-800 focus:border-sky-500/30"
                          />
                        </div>
                      </div>

                      {/* Sugerencias de Valores Rápidos */}
                      {(() => {
                        const suggestedValues = getValueSuggestions(
                          branch.expression?.left,
                        );
                        if (suggestedValues.length > 0) {
                          return (
                            <div className="flex items-center gap-2 pl-1">
                              <span className="text-[9px] font-bold text-slate-600 uppercase">
                                {t(
                                  "nodes.config.conditional.values_label",
                                  "Valores:",
                                )}
                              </span>
                              <div className="flex gap-1">
                                {suggestedValues[0].items.map((item) => (
                                  <button
                                    key={item.path}
                                    onClick={() =>
                                      updateBranch(
                                        index,
                                        "expr_right",
                                        item.path,
                                      )
                                    }
                                    className={cn(
                                      "px-2 py-0.5 rounded-full text-[9px] font-black border transition-all uppercase tracking-tight",
                                      branch.expression?.right === item.path
                                        ? "bg-sky-500/20 border-sky-500/40 text-sky-400 shadow-lg shadow-sky-500/10"
                                        : "bg-slate-800 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-slate-700",
                                    )}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Resultado de Validación Live */}
                      {branch.expression?.left && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600">
                            <span className="opacity-50">
                              {t(
                                "nodes.config.conditional.resolves",
                                "Resuelve:",
                              )}
                            </span>
                            <span className="text-slate-400 italic">
                              {(() => {
                                const rL = resolveVariableValue(
                                  branch.expression?.left,
                                );
                                const rR = resolveVariableValue(
                                  branch.expression?.right,
                                );
                                return `${rL === undefined ? "?" : JSON.stringify(rL)} ${branch.expression?.operator || "=="} ${rR === undefined ? "?" : JSON.stringify(rR)}`;
                              })()}
                            </span>
                          </div>

                          {(() => {
                            const evaluation = evaluateSimpleCondition(
                              branch.expression?.left,
                              branch.expression?.operator || "==",
                              branch.expression?.right,
                            );
                            if (evaluation === true) {
                              return (
                                <div className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                  <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                  {t(
                                    "nodes.config.conditional.match",
                                    "CUMPLE",
                                  )}
                                </div>
                              );
                            } else if (evaluation === false) {
                              return (
                                <div className="flex items-center gap-1 text-[9px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                                  <div className="w-1 h-1 rounded-full bg-rose-400" />
                                  {t(
                                    "nodes.config.conditional.no_match",
                                    "NO CUMPLE",
                                  )}
                                </div>
                              );
                            }
                            return (
                              <span className="text-[9px] text-slate-700 italic">
                                {t(
                                  "nodes.config.conditional.waiting_data",
                                  "Esperando datos...",
                                )}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={addBranch}
          className="w-full py-2.5 bg-slate-900/50 hover:bg-sky-500/5 border border-dashed border-slate-800 hover:border-sky-500/30 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 hover:text-sky-400 flex items-center justify-center gap-2 transition-all group"
        >
          <Plus
            size={12}
            className="group-hover:rotate-90 transition-transform"
          />
          {t("nodes.config.add_branch", "Añadir Condición")}
        </button>
      </div>
    );
  },
);

const SwitchCasesEditor = React.memo(
  ({ value, onChange, data, variables, allVariables, suggestions }) => {
    const { t } = useTranslation();
    const cases = useMemo(() => (Array.isArray(value) ? value : []), [value]);

    const matchedCaseId = data?.result?.matchedCaseId;

    const updateCase = React.useCallback(
      (index, field, val) => {
        const newCases = [...cases];
        newCases[index] = { ...newCases[index], [field]: val };
        onChange(newCases);
      },
      [cases, onChange],
    );

    const addCase = React.useCallback(() => {
      const id = `case_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      onChange([...cases, { id, value: "", label: "" }]);
    }, [cases, onChange]);

    const removeCase = React.useCallback(
      (index) => {
        const newCases = [...cases];
        newCases.splice(index, 1);
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

    return (
      <div className="space-y-4 mt-4 mb-2">
        <div className="flex justify-between items-center mb-1">
          <label className="text-[11px] uppercase tracking-[0.2em] font-black text-indigo-400 ml-1 flex items-center gap-2">
            <ArrowLeftRight size={14} />
            {t("nodes.config.switch_cases", "Casos del Switch")}
          </label>
          <div className="group relative">
            <Info
              size={14}
              className="text-slate-500 hover:text-indigo-400 cursor-help transition-colors"
            />
            <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
              {t(
                "nodes.hints.switch_logic",
                "Define los valores exactos que quieres comparar. Cada caso genera una salida.",
              )}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {cases.map((c, index) => {
            const isMatched = matchedCaseId === c.id;
            const type = getValueType(c.value);

            return (
              <div
                key={c.id}
                className={cn(
                  "px-3 py-3 bg-[#0f172a]/60 border rounded-xl space-y-2 relative group transition-all shadow-md",
                  isMatched
                    ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    : "border-indigo-500/20 hover:border-indigo-500/40",
                )}
              >
                {isMatched && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-0.5 shadow-lg border border-white z-10 animate-pulse">
                    <CheckCircle size={10} strokeWidth={3} />
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-lg border flex items-center justify-center shrink-0",
                        isMatched
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-indigo-500/10 border-indigo-500/20",
                      )}
                    >
                      <CornerDownRight
                        size={12}
                        className={
                          isMatched ? "text-emerald-400" : "text-indigo-400"
                        }
                      />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <VariableInput
                        value={c.value}
                        variables={variables}
                        allVariables={allVariables}
                        suggestions={suggestions}
                        placeholder={t(
                          "nodes.placeholders.switch_value",
                          "Valor (ej: admin, true, 200)",
                        )}
                        onChange={(e) =>
                          updateCase(index, "value", e.target.value)
                        }
                        className="w-full bg-transparent border-none p-0 text-xs font-bold text-white focus:outline-none placeholder:text-slate-600 focus:ring-0"
                      />
                      <span
                        className={cn(
                          "text-[8px] uppercase tracking-tighter font-black px-1 rounded shrink-0",
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
                    </div>
                  </div>
                  <button
                    onClick={() => removeCase(index)}
                    className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="flex items-center gap-2 pl-8 border-t border-white/5 pt-2 min-w-0">
                  <input
                    type="text"
                    placeholder={t(
                      "common.optional_label",
                      "Etiqueta visible (opcional)",
                    )}
                    value={c.label}
                    onChange={(e) => updateCase(index, "label", e.target.value)}
                    title={c.label}
                    className="flex-1 bg-transparent border-none p-0 text-[10px] font-medium text-slate-400 focus:outline-none placeholder:text-slate-700 focus:ring-0 truncate min-w-0"
                  />
                  <div className="bg-black/30 px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-500 shrink-0">
                    ID: {c.id}
                  </div>
                </div>
              </div>
            );
          })}
          {cases.length === 0 && (
            <div className="text-center py-4 border border-dashed border-slate-700 rounded-xl text-slate-500 text-[10px]">
              {t(
                "nodes.config.no_cases",
                "No hay casos definidos. Agrega uno para empezar.",
              )}
            </div>
          )}
        </div>
        <button
          onClick={addCase}
          className="w-full py-2 bg-indigo-500/5 hover:bg-indigo-500/10 border border-dashed border-indigo-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-2 mt-2 transition-all"
        >
          <Plus size={12} />
          {t("nodes.config.add_case", "Agregar Caso")}
        </button>

        <div className="mt-4 p-3 bg-slate-900/50 border border-slate-800 rounded-lg flex items-start gap-3">
          <Zap size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter leading-none">
              {t("common.default_path", "Ruta por Defecto (Default)")}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">
              {t(
                "nodes.hints.default_path_desc",
                'Siempre se genera una salida "default" para cuando el valor no coincide con ningún caso.',
              )}
            </p>
          </div>
        </div>
      </div>
    );
  },
);

const MappingEditor = ({
  value,
  onChange,
  label,
  parentKey = "parentVar",
  childKey = "childVar",
}) => {
  const { t } = useTranslation();
  const mappings = Array.isArray(value) ? value : [];

  const updateMapping = (index, field, val) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], [field]: val };
    onChange(newMappings);
  };

  const addMapping = () => {
    onChange([...mappings, { [parentKey]: "", [childKey]: "" }]);
  };

  const removeMapping = (index) => {
    const newMappings = [...mappings];
    newMappings.splice(index, 1);
    onChange(newMappings);
  };

  return (
    <div className="space-y-3 mt-4 mb-2">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
          {label}
        </label>
        <span className="text-[9px] text-slate-600 font-medium">
          PARENT → CHILD
        </span>
      </div>
      <div className="space-y-2">
        {mappings.map((m, index) => (
          <div
            key={`mapping-${index}`}
            className="flex items-center gap-2 p-2.5 bg-[#0f172a]/40 rounded-xl border border-white/5 group hover:border-white/10 transition-all shadow-sm"
          >
            <div className="flex-1 space-y-1">
              <input
                type="text"
                placeholder={t(
                  "nodes.placeholders.parent_variable",
                  "Var Padre",
                )}
                value={m[parentKey]}
                onChange={(e) =>
                  updateMapping(index, parentKey, e.target.value)
                }
                className="w-full bg-transparent border-none text-[10px] font-bold text-white focus:ring-0 p-0 placeholder:text-slate-700"
              />
            </div>
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 shrink-0">
              <ArrowRight size={10} className="text-slate-500" />
            </div>
            <div className="flex-1 space-y-1">
              <input
                type="text"
                placeholder={t("nodes.placeholders.child_variable", "Var Hija")}
                value={m[childKey]}
                onChange={(e) => updateMapping(index, childKey, e.target.value)}
                className="w-full bg-transparent border-none text-[10px] font-bold text-sky-400 focus:ring-0 p-0 placeholder:text-slate-700"
              />
            </div>
            <button
              onClick={() => removeMapping(index)}
              className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-lg"
              title={t("common.remove", "Eliminar")}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {mappings.length === 0 && (
          <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl text-slate-600 text-[10px] bg-black/5">
            {t("nodes.config.no_mappings", "Sin mapeos definidos")}
          </div>
        )}
      </div>
      <button
        onClick={addMapping}
        className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2 mt-1 transition-all active:scale-[0.98]"
      >
        <Plus size={12} />
        {t("nodes.config.add_mapping", "Agregar Mapeo")}
      </button>
    </div>
  );
};

// --- CONFIGURATION SCHEMA MOVED TO @/config/validationRules ---

function NodeConfigurationPanel({
  isVisible,
  action, // The selected node data (initial snapshot)
  nodes, // Live nodes list for real-time updates
  onClose,
  updateNodeConfiguration,
  onDeleteNode,
  onStartPick, // New Prop from App.jsx
  onCancelPick, // New Prop for Cancel
  onUngroup, // New Prop for Ungrouping
  _projectPath, // Unused
  _isReadOnly, // Unused
  onExecute, // Restore
  edges = [], // Added for navigation
  onSelectNode, // Added for navigation
  viewStack = [], // NEW: Navigation stack for subflow context
  currentProject = null, // NEW: Current project for flow lookup
  onEnterSubFlow = null, // NEW: Navigation handler
  updateNodeState = null, // NEW: For AI fix commitment
  designTimeContext = {}, // NEW: For design-time preview
  simulatedResults = {}, // NEW: For design-time preview
}) {
  const { t } = useTranslation();
  const toast = useToast();

  const [liveVariables, setLiveVariables] = useState({});

  const refreshVariables = useCallback(async () => {
    try {
      const response = await api.get("/variables");
      if (response && response.success) {
        setLiveVariables(response.data?.flow || {});
      }
    } catch (err) {
      console.warn("[NodeConfig] Failed to fetch live variables:", err);
    }
  }, []);

  // REMOVED handleStartInspector (delegated to App.jsx)

  // Use the live node from the nodes array if available, otherwise fallback to action snapshot
  // Use the live node from the nodes array if available, otherwise fallback to action snapshot
  const activeNode = useMemo(() => {
    if (!action) return null;
    if (!nodes) return action;
    return (
      nodes.find((n) => n.id === action.nodeId || n.id === action.id) || action
    );
  }, [action, nodes]);

  // Fetch variables when panel opens or when activeNode changes
  React.useEffect(() => {
    if (activeNode) {
      refreshVariables();
    }
  }, [activeNode, refreshVariables]);

  // Memoize logic to prevent unnecessary re-renders
  const { nodeKey, safeConfig, definedInputs } = useMemo(() => {
    if (!activeNode) return {};

    const _nodeKey = activeNode.data?.type || activeNode.type || "";
    const _config = NODE_TYPE_MAP[_nodeKey] || NODE_TYPE_MAP.launch_browser;
    const _safeConfig = _config || { category: "default", color: "slate" };

    // Fallback to default inputs if explicit mapping doesn't exist, but try to be smart
    let _definedInputs = NODE_INPUTS[_nodeKey];
    if (!_definedInputs) {
      // Heuristic: If it sounds like an interaction, show selector
      if (
        _nodeKey.includes("click") ||
        _nodeKey.includes("wait") ||
        _nodeKey.includes("element")
      ) {
        _definedInputs = NODE_INPUTS.default;
      } else {
        _definedInputs = [];
      }
    }

    return {
      nodeKey: _nodeKey,
      safeConfig: _safeConfig,
      definedInputs: _definedInputs,
    };
  }, [activeNode]);

  const isConditional = nodeKey === "conditional";

  // --- NAVIGATION & ADJACENCY LOGIC ---
  const { precedingNodes, nextNodes } = useMemo(() => {
    if (!activeNode || !edges || !nodes)
      return { precedingNodes: [], nextNodes: [] };

    const incomingEdges = edges.filter((e) => e.target === activeNode.id);
    const outgoingEdges = edges.filter((e) => e.source === activeNode.id);

    // Deduplicate by ID to prevent "duplicate key" warnings in React
    const prevIds = Array.from(new Set(incomingEdges.map((e) => e.source)));
    const nextIds = Array.from(new Set(outgoingEdges.map((e) => e.target)));

    const prev = prevIds
      .map((id) => nodes.find((n) => n.id === id))
      .filter(Boolean)
      .map((n) => {
        // Enrich with live variable result OR static schema fallback
        const nodeLabel = n.data?.customLabel || n.data?.label || n.id;
        const liveResult =
          liveVariables[`${nodeLabel}.result`] ||
          liveVariables[`${n.id}.result`];

        // Priority Mapping
        let finalResult = {};
        let dataSource = "static";

        if (liveResult !== undefined) {
          finalResult = liveResult;
          dataSource = "live";
        } else if (n.data?.result !== undefined) {
          finalResult = n.data.result;
          dataSource = "persisted";
        } else if (simulatedResults[n.id] !== undefined) {
          finalResult = simulatedResults[n.id];
          dataSource = "simulated";
        } else {
          // 🌟 STATIC SCHEMA FALLBACK: Use NODE_OUTPUTS as design-time contract
          const nodeType = n.data?.type || n.type;
          const schema = NODE_OUTPUTS[nodeType];
          if (schema) {
            const mockResult = {};
            Object.entries(schema).forEach(([key, type]) => {
              mockResult[key] = `<${type}>`;
            });
            finalResult = mockResult;
          } else {
            finalResult = {};
          }
          dataSource = "static";
        }

        return {
          ...n,
          id: n.id,
          data: {
            ...n.data,
            result:
              typeof finalResult === "object"
                ? { ...finalResult, _dataSource: dataSource }
                : finalResult,
            isStaticSchema: dataSource === "static",
          },
        };
      });

    // --- SUBFLOW CONTEXT ENRICHMENT ---
    // If this is an Entry node and we are in a subflow, add the parent component node
    const isEntryNode =
      activeNode.type === "entry" || activeNode.data?.type === "entry";
    if (isEntryNode && viewStack.length > 0 && currentProject) {
      const lastView = viewStack[viewStack.length - 1];
      if (lastView.nodeId) {
        const parentFlow = currentProject.flows?.find(
          (f) => f.id === lastView.id,
        );
        if (parentFlow && parentFlow.nodes) {
          const parentComponentNode = parentFlow.nodes.find(
            (n) => n.nodeId === lastView.nodeId || n.id === lastView.nodeId,
          );
          if (parentComponentNode) {
            if (!prev.some((n) => n.id === parentComponentNode.id)) {
              const nodeLabel =
                parentComponentNode.data?.customLabel ||
                parentComponentNode.data?.label ||
                parentComponentNode.nodeId ||
                parentComponentNode.id;
              const liveResult =
                liveVariables[`${nodeLabel}.result`] ||
                liveVariables[`${parentComponentNode.nodeId}.result`] ||
                liveVariables[`${parentComponentNode.id}.result`];

              prev.push({
                ...parentComponentNode,
                id: parentComponentNode.nodeId || parentComponentNode.id,
                data: {
                  ...parentComponentNode.data,
                  label: parentComponentNode.data?.label || "Component Input",
                  customLabel:
                    parentComponentNode.data?.customLabel || "Component Input",
                  result:
                    liveResult !== undefined
                      ? liveResult
                      : parentComponentNode.data?.result,
                },
              });
            }
          }
        }
      }
    }

    const next = nextIds
      .map((id) => nodes.find((n) => n.id === id))
      .filter(Boolean);

    return { precedingNodes: prev, nextNodes: next };
  }, [
    activeNode,
    edges,
    nodes,
    viewStack,
    currentProject,
    liveVariables,
    simulatedResults,
  ]);

  const resolvedStats = useMemo(() => {
    if (!activeNode || !currentProject)
      return { nodeCount: 0, hasInput: false, hasOutput: false };

    const isContainer = ["component", "loop"].includes(
      activeNode.type || activeNode.data?.type,
    );
    if (!isContainer)
      return { nodeCount: 0, hasInput: false, hasOutput: false };

    const flowId = activeNode.data?.flowId;

    const subFlow = flowId
      ? currentProject.flows?.find((f) => f.id === flowId)
      : null;

    const localNodes = activeNode.data?.subFlow?.nodes;
    const localNodeCount = activeNode.data?.nodeCount;

    const nodeCount =
      (localNodes?.length || 0) > 0
        ? localNodes.length
        : (subFlow?.nodes?.length ?? localNodeCount ?? 0);

    const hasInput =
      (localNodes?.length || 0) > 0
        ? localNodes.some((n) => n.type === "input")
        : (subFlow?.nodes?.some((n) => n.type === "input") ??
          activeNode.data?.hasInput ??
          false);

    const hasOutput =
      (localNodes?.length || 0) > 0
        ? localNodes.some((n) => n.type === "output")
        : (subFlow?.nodes?.some((n) => n.type === "output") ??
          activeNode.data?.hasOutput ??
          false);

    return {
      nodeCount: Number.isFinite(nodeCount) ? nodeCount : 0,
      hasInput,
      hasOutput,
    };
  }, [activeNode, currentProject]);

  const truncateResult = useCallback((result, maxLen = 1000) => {
    if (!result) return "";
    try {
      const str =
        typeof result === "object" ? JSON.stringify(result) : String(result);
      if (str.length > maxLen) {
        return str.substring(0, maxLen) + "... (truncated)";
      }
      return str;
    } catch (error) {
      console.warn("Truncate error:", error);
      return "[Unserializable Data]";
    }
  }, []);

  const [localConfig, setLocalConfig] = React.useState(
    activeNode?.data?.configuration || {},
  );
  const [localLabel, setLocalLabel] = React.useState(
    activeNode?.data?.customLabel || activeNode?.data?.label || "",
  );

  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [inspectedData, setInspectedData] = useState(null);
  const lastSyncedConfigRef = React.useRef({
    config: activeNode?.data?.configuration || {},
    nodeId: activeNode?.id,
    nodeState: activeNode?.data?.state,
  });

  // Track the last prop value to distinguish between external changes and our own updates
  const lastPropConfigRef = React.useRef(
    JSON.stringify(activeNode?.data?.configuration || {}),
  );
  const updateTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    if (!activeNode) return;

    const globalConfig = activeNode?.data?.configuration || {};
    const nodeState = activeNode?.data?.state;

    const hasNodeChanged = activeNode.id !== lastSyncedConfigRef.current.nodeId;

    const justFinishedPicking =
      nodeState !== "picking" &&
      lastSyncedConfigRef.current.nodeState === "picking";

    const globalConfigStr = JSON.stringify(globalConfig);
    const lastConfigStr = JSON.stringify(lastSyncedConfigRef.current.config);
    const lastPropStr = lastPropConfigRef.current;

    const hasConfigChangedInProps = globalConfigStr !== lastPropStr;
    const matchesOurLastSent = globalConfigStr === lastConfigStr;

    // We only reset local state if:
    // 1. The node actually changed (switching selection)
    // 2. We just finished picking an element (explicit override)
    // 3. The props changed to something that is NOT what we last sent (external drift)
    const shouldReset =
      hasNodeChanged ||
      justFinishedPicking ||
      (hasConfigChangedInProps && !matchesOurLastSent);

    if (shouldReset) {
      if (hasConfigChangedInProps && !matchesOurLastSent && !hasNodeChanged) {
        console.log(
          `[NodeConfig] 🚨 External drift detected for ${activeNode.id}.`,
          {
            prop: globalConfig,
            lastSent: lastSyncedConfigRef.current.config,
          },
        );
      }

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      setLocalConfig(globalConfig);
      setLocalLabel(
        activeNode.data?.customLabel || activeNode.data?.label || "",
      );

      lastSyncedConfigRef.current = {
        config: globalConfig,
        nodeId: activeNode.id,
        nodeState: nodeState,
      };
      lastPropConfigRef.current = globalConfigStr;
      return;
    }

    // Keep state in sync even if we don't reset localConfig
    lastSyncedConfigRef.current.nodeState = nodeState;
    lastPropConfigRef.current = globalConfigStr;
  }, [
    activeNode,
    activeNode?.id,
    activeNode?.data?.configuration,
    activeNode?.data?.customLabel,
    activeNode?.data?.label,
    activeNode?.data?.state,
  ]);

  const handleConfigUpdate = (key, value) => {
    setLocalConfig((prev) => {
      const newConfig = { ...prev, [key]: value };

      if (key === "selector" || key === "originalSelector") {
        newConfig.healed = undefined;
        newConfig.healedFrom = undefined;
        newConfig.healedValue = undefined;
        newConfig.originalValue = undefined;
        newConfig.aiReasoning = undefined;
        newConfig.healingConfidence = undefined;
      }

      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);

      updateTimeoutRef.current = setTimeout(() => {
        console.log(
          `[NodeConfig] 📤 Sending update for ${activeNode.id}`,
          newConfig,
        );
        lastSyncedConfigRef.current.config = newConfig;

        if (activeNode) {
          updateNodeConfiguration(activeNode.id, {
            ...(activeNode.data?.configuration || {}),
            ...newConfig,
          });
        }
      }, 200);

      return newConfig;
    });
  };

  const renderDataValue = (val, isRoot = false) => {
    if (val === null || val === undefined)
      return <span className="text-slate-600 italic">null</span>;
    if (typeof val === "boolean")
      return (
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter",
            val
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-rose-500/10 text-rose-400",
          )}
        >
          {String(val)}
        </span>
      );
    if (typeof val === "number")
      return <span className="text-amber-400 font-mono">{val}</span>;
    if (typeof val === "string") {
      const isUrl = val.startsWith("http");
      return (
        <span
          className={cn(
            "text-slate-300 break-all",
            isUrl &&
              "text-sky-400 underline decoration-sky-500/30 underline-offset-2",
          )}
        >
          {val.length > 100 ? `${val.substring(0, 100)}...` : val}
        </span>
      );
    }

    if (Array.isArray(val)) {
      return (
        <div className="space-y-1 mt-1">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Array({val.length})
          </span>
          {val.length > 0 && (
            <div className="pl-2 border-l border-white/5 space-y-1">
              {val.slice(0, 3).map((item, i) => (
                <div key={i} className="flex gap-2 text-[10px]">
                  <span className="text-slate-600 font-mono">{i}:</span>
                  {renderDataValue(item)}
                </div>
              ))}
              {val.length > 3 && (
                <span className="text-[9px] text-slate-600 italic pl-4">
                  + {val.length - 3} more items
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    if (typeof val === "object") {
      const keys = Object.keys(val).filter((k) => !k.startsWith("_"));
      if (keys.length === 0) return <span className="text-slate-600">{}</span>;

      return (
        <div
          className={cn(
            "space-y-1.5",
            !isRoot && "mt-1 pl-2 border-l border-white/5",
          )}
        >
          {keys.slice(0, isRoot ? 20 : 5).map((k) => (
            <div key={k} className="flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-indigo-300/60 uppercase tracking-tighter">
                {k}
              </span>
              <div className="pl-1">{renderDataValue(val[k])}</div>
            </div>
          ))}
          {keys.length > (isRoot ? 20 : 5) && (
            <span className="text-[9px] text-slate-600 italic">
              + {keys.length - (isRoot ? 20 : 5)} more properties
            </span>
          )}
        </div>
      );
    }
    return String(val);
  };

  const renderEmittedData = () => {
    const result = activeNode.data?.result;
    if (!result) {
      return (
        <div className="text-[10px] text-slate-600 italic px-1 bg-white/5 p-4 rounded-xl border border-dashed border-white/5 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center">
            <Zap size={14} className="text-slate-700" />
          </div>
          {t(
            "nodes.config.no_data_yet",
            "No data emitted yet. Run the flow to see results.",
          )}
        </div>
      );
    }

    const resultData = result.data !== undefined ? result.data : result;

    return (
      <div className="relative group/emitted">
        <div className="bg-[#0b1120] rounded-2xl border border-white/10 p-4 shadow-2xl max-h-80 overflow-y-auto custom-scrollbar ring-1 ring-white/5">
          {renderDataValue(resultData, true)}
        </div>
        <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 group-hover/emitted:opacity-100 transition-all">
          <button
            onClick={() => {
              const text = JSON.stringify(result, null, 2);
              navigator.clipboard.writeText(text);
              toast.success("Copied to clipboard", {
                icon: "📋",
                id: "copy-toast",
              });
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 hover:border-white/20 transition-all backdrop-blur-md shadow-xl"
            title="Copy Result"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() =>
              setInspectedData({
                title:
                  activeNode.data?.customLabel ||
                  activeNode.data?.label ||
                  activeNode.type,
                content: result,
              })
            }
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 hover:border-white/20 transition-all backdrop-blur-md shadow-xl"
            title="Fullscreen Inspector"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  const handleAutoHeal = async (failedSelector) => {
    const aiAbortController = new AbortController();

    toast.dismiss("ai-heal-toast");

    toast.loading(
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-xs text-amber-500">
          AI Repair Mode (Ollama/Gemma 3) 🧠
        </span>
        <span className="text-[10px] opacity-80 leading-tight">
          Analyzing DOM context...
        </span>
      </div>,
      {
        id: "ai-heal-toast",
        duration: Infinity,
        action: {
          label: "Cancel",
          onClick: () => {
            aiAbortController.abort();
            toast.dismiss("ai-heal-toast");
            toast.error("AI Healing cancelled.");
          },
        },
      },
    );

    try {
      const data = await api.post(
        "/ai/heal-selector",
        {
          failedSelector,
          nodeType: activeNode.data?.label || activeNode.type,
          browserId:
            activeNode.data?.configuration?.browserId ||
            localStorage.getItem("lastBrowserId"),
          error: activeNode.data?.error,
        },
        {
          signal: aiAbortController.signal,
        },
      );

      if (data && data.suggestion) {
        const targetField =
          activeNode.data?.type === "smart_selector"
            ? "originalSelector"
            : "selector";
        handleConfigUpdate(targetField, data.suggestion);
        toast.dismiss("ai-heal-toast");
        toast.success(
          `Selector repaired! (Confidence: ${Math.round((data.confidence || 0) * 100)}%)`,
          { icon: "✨" },
        );
      } else {
        toast.dismiss("ai-heal-toast");
        toast.error("AI could not find a solution.");
      }
    } catch (error) {
      if (error.name === "AbortError") return;
      toast.dismiss("ai-heal-toast");
      toast.error(error.message || "AI Service Error");
    }
  };

  const validationErrors = useMemo(() => {
    const errors = {};
    const inputs = definedInputs || [];
    inputs.forEach((field) => {
      const value = localConfig[field.key];

      if (
        field.required &&
        (value === undefined || value === "" || value === null)
      ) {
        errors[field.key] = t("validation.required", "Required");
        return;
      }

      if (!value && value !== 0 && !field.required) return;

      if (field.type === "number") {
        if (typeof value === "string" && value.trim().startsWith("{{")) return;

        const num = Number(value);
        if (isNaN(num)) {
          errors[field.key] = t("validation.number", "Invalid Number");
        } else if (num < 0) {
          errors[field.key] = t("validation.positive", "Positive Only");
        }
      }
    });
    return errors;
  }, [definedInputs, localConfig, t]);

  const hasErrors = Object.keys(validationErrors).length > 0;

  React.useEffect(() => () => clearTimeout(updateTimeoutRef.current), []);

  const nodeScreenshotUrl =
    activeNode?.data?.replayData?.screenshot_path ||
    activeNode?.data?.result?.screenshot ||
    activeNode?.data?.screenshots?.after?.url ||
    activeNode?.data?.screenshots?.after?.path ||
    null;

  const variablesMap = React.useMemo(() => {
    const map = {};

    if (liveVariables && typeof liveVariables === "object") {
      Object.entries(liveVariables).forEach(([key, val]) => {
        map[key] = val;
        if (key.endsWith(".result")) {
          const baseKey = key.replace(".result", "");
          if (!(baseKey in map)) {
            map[baseKey] = val;
          }
        }
      });
    }

    if (precedingNodes) {
      precedingNodes.forEach((pn) => {
        if (pn.data?.result !== undefined) {
          if (!(`${pn.id}.result` in map)) {
            map[`${pn.id}.result`] = pn.data.result;
          }
          if (pn.data?.label && !(`${pn.data.label}.result` in map)) {
            map[`${pn.data.label}.result`] = pn.data.result;

            // 🌟 SAFE ALIAS: "Login Steps" -> "LoginSteps"
            const safeLabel = pn.data.label.replace(/[^a-zA-Z0-9]/g, "");
            if (safeLabel && safeLabel !== pn.data.label) {
              map[`${safeLabel}.result`] = pn.data.result;
            }
          }
        }
        if (
          pn.data?.label &&
          pn.data?.result !== undefined &&
          !(pn.data.label in map)
        ) {
          map[pn.data.label] = pn.data.result;
        }
      });
    }

    return map;
  }, [precedingNodes, liveVariables]);

  const contextualVariablesMap = React.useMemo(() => {
    const map = {};
    if (!precedingNodes || precedingNodes.length === 0) return map;

    precedingNodes.forEach((pn) => {
      const nodeLabel = pn.data?.customLabel || pn.data?.label || pn.id;
      if (pn.data?.result !== undefined) {
        map[nodeLabel] = pn.data.result;
        map[pn.id] = pn.data.result;
      }

      // 🌟 STATIC SCHEMA INJECTION: If no real data, inject NODE_OUTPUTS schema
      // so ConditionalBranchesEditor can suggest variables before execution
      if (pn.data?.isStaticSchema) {
        const nodeType = pn.data?.type || pn.type;
        const schema = NODE_OUTPUTS[nodeType];
        if (schema) {
          const schemaResult = {};
          Object.entries(schema).forEach(([key, type]) => {
            schemaResult[key] = `<${type}>`;
          });
          if (!map[nodeLabel]) map[nodeLabel] = schemaResult;
          if (!map[pn.id]) map[pn.id] = schemaResult;
        }
      }
    });

    if (liveVariables?.global) {
      map["global"] = liveVariables.global;
    }

    // 🌟 DESIGN-TIME CONTEXT MERGE: Bring in all simulated values from the entire flow context
    if (designTimeContext && typeof designTimeContext === "object") {
      Object.entries(designTimeContext).forEach(([key, val]) => {
        if (!(key in map)) {
          map[key] = val;
        }
        // Also support .result suffix if missing
        if (!key.endsWith(".result") && !(`${key}.result` in map)) {
          map[`${key}.result`] = val;
        }
      });
    }

    return map;
  }, [precedingNodes, liveVariables, designTimeContext]);

  // Shared variable paths for suggestions in all logic editors
  const availableVariablePaths = React.useMemo(() => {
    const suggestions = [];
    const noiseKeys = [
      "healedNodes",
      "replayData",
      "trace",
      "lastError",
      "error",
      "config",
      "configuration",
      "data",
    ];
    const processedNodeIds = new Set();

    Object.entries(contextualVariablesMap || {}).forEach(
      ([nodeName, nodeVal]) => {
        if (nodeName.includes(".result") || nodeName === "global") return;
        if (!nodeVal || typeof nodeVal !== "object") return;

        // 1. Find the real node to get its type and label
        const matchingNode = nodes?.find(
          (n) => n.data?.label === nodeName || n.id === nodeName,
        );
        const nodeId = matchingNode?.id || nodeName;

        // 2. Deduplicate groups
        if (processedNodeIds.has(nodeId)) return;
        processedNodeIds.add(nodeId);

        const displayLabel = matchingNode?.data?.label || nodeName;
        const nodeType = matchingNode?.data?.type || matchingNode?.type;
        const nodeSchema = NODE_OUTPUTS[nodeType] || {};

        const nodeGroup = {
          nodeLabel: displayLabel,
          nodeId: nodeId,
          items: [],
        };

        const extract = (obj, prefix = "", depth = 0) => {
          if (depth > 2 || !obj || typeof obj !== "object") return;

          Object.entries(obj).forEach(([prop, val]) => {
            if (
              prop === "result" ||
              prop.substring(0, 1) === "_" ||
              noiseKeys.includes(prop)
            )
              return;

            const fullPropPath = prefix ? `${prefix}.${prop}` : prop;
            const explicitType = nodeSchema[fullPropPath] || typeof val;

            nodeGroup.items.push({
              label: prop,
              path: `{{${displayLabel}.${fullPropPath}}}`,
              displayPath: `{{${displayLabel}.${fullPropPath}}}`,
              type:
                explicitType === "object" &&
                typeof val === "string" &&
                val.startsWith("<")
                  ? val.slice(1, -1)
                  : explicitType,
            });

            if (
              val &&
              typeof val === "object" &&
              !Array.isArray(val) &&
              depth < 2
            ) {
              extract(val, fullPropPath, depth + 1);
            }
          });
        };

        extract(nodeVal);

        // Ensure status/success are always there if available in schema
        if (
          nodeSchema.status &&
          !nodeGroup.items.find((i) => i.label === "status")
        ) {
          nodeGroup.items.push({
            label: "status",
            path: `{{${displayLabel}.status}}`,
            displayPath: `{{${displayLabel}.status}}`,
            type: nodeSchema.status,
          });
        }
        if (
          nodeSchema.success &&
          !nodeGroup.items.find((i) => i.label === "success")
        ) {
          nodeGroup.items.push({
            label: "success",
            path: `{{${displayLabel}.success}}`,
            displayPath: `{{${displayLabel}.success}}`,
            type: nodeSchema.success,
          });
        }

        if (nodeGroup.items.length > 0) {
          suggestions.push(nodeGroup);
        }
      },
    );

    return suggestions;
  }, [contextualVariablesMap, nodes]);

  if (!isVisible) return null;

  if (!activeNode) {
    return (
      <AnimatePresence>
        <Motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          className="w-80 h-full glass-panel z-[var(--z-popover)] flex flex-col items-center justify-center p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center mb-4">
            <Info size={32} className="text-slate-500 opacity-50" />
          </div>
          <h3 className="text-sm font-semibold text-slate-400 mb-2">
            No Node Selected
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Select a node on the canvas to configure its settings and
            parameters.
          </p>
        </Motion.div>
      </AnimatePresence>
    );
  }

  const stopPropagation = (e) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation?.();
  };

  const colorKey = safeConfig.color;

  const aiConfig = JSON.parse(localStorage.getItem("hal_ai_config") || "{}");
  const globalModel = aiConfig.selectedModel || "gemma3";
  const globalProvider = aiConfig.activeProvider || "ollama";

  const renderInput = (field, index = 0) => {
    const dataKey = field.key || field.name;
    const reactKey = dataKey || `field-${index}`;
    const value = localConfig[dataKey] ?? "";
    const error = validationErrors[dataKey];

    switch (field.type) {
      case "conditional_branches":
        return (
          <ConditionalBranchesEditor
            key={reactKey}
            value={value}
            variables={contextualVariablesMap}
            allVariables={variablesMap}
            precedingNodes={precedingNodes}
            suggestions={availableVariablePaths}
            onChange={(newVal) => handleConfigUpdate(dataKey, newVal)}
          />
        );
      case "switch_cases":
        return (
          <SwitchCasesEditor
            key={reactKey}
            value={value}
            data={activeNode.data}
            variables={contextualVariablesMap}
            allVariables={variablesMap}
            suggestions={availableVariablePaths}
            onChange={(newVal) => handleConfigUpdate(dataKey, newVal)}
          />
        );
      case "select":
        return (
          <div key={reactKey} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1">
              {t(`nodes.fields.${dataKey}`, field.label)}
            </label>
            <select
              value={value}
              onChange={(e) => handleConfigUpdate(dataKey, e.target.value)}
              className={cn(
                "w-full bg-[var(--bg-canvas)]/50 border border-[var(--border-ui)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500/50 transition-all !pointer-events-auto !cursor-pointer",
                error && "border-red-500/50 focus:border-red-500 bg-red-500/5",
              )}
            >
              <option value="" disabled>
                {t("common.select_default", "Select an option...")}
              </option>
              {field.options?.map((opt, i) => (
                <option
                  key={opt.value || `opt-${i}`}
                  value={opt.value}
                  className="bg-slate-800 text-white"
                >
                  {t(`nodes.options.${field.key}.${opt.value}`, opt.label)}
                </option>
              ))}
            </select>
            {field.hint && (
              <div className="mt-1 flex items-start gap-1.5 p-1.5 rounded bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-slate-400 leading-tight">
                <Info size={12} className="shrink-0 mt-0.5 opacity-50" />
                <span>{t(`nodes.hints.${field.hint}`)}</span>
              </div>
            )}
            {error && (
              <span className="text-[10px] text-red-400 font-bold ml-1">
                {error}
              </span>
            )}
          </div>
        );
      case "textarea":
        return (
          <div key={reactKey} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1">
                {t(`nodes.fields.${dataKey}`, field.label)}
              </label>
              {error && (
                <span className="text-[10px] text-red-400 font-bold animate-pulse">
                  {error}
                </span>
              )}
            </div>
            <VariableInput
              type="textarea"
              value={value}
              variables={variablesMap}
              hasError={!!error}
              placeholder={t(
                `nodes.placeholders.${dataKey}`,
                field.placeholder,
              )}
              onChange={(e) => handleConfigUpdate(dataKey, e.target.value)}
              className="w-full min-h-[100px] text-xs font-mono !pointer-events-auto !cursor-text !select-text py-2 px-3"
            />
          </div>
        );
      case "checkbox": {
        const screenshotUrl =
          activeNode.data?.replayData?.screenshot_path ||
          activeNode.data?.result?.screenshot ||
          activeNode.data?.screenshots?.after?.url ||
          activeNode.data?.screenshots?.after?.path;

        const hasScreenshot = field.key === "takeScreenshot" && screenshotUrl;

        return (
          <div key={reactKey} className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-ui)] bg-[var(--bg-canvas)]/50 cursor-pointer hover:bg-[var(--bg-canvas)] transition-colors">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleConfigUpdate(dataKey, e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-ui)] text-indigo-500 focus:ring-offset-0 focus:ring-indigo-500/50 bg-[var(--bg-node)] !pointer-events-auto !cursor-pointer"
              />
              <span className="text-xs font-medium text-[var(--text-main)] select-none">
                {field.label}
              </span>
            </label>

            {hasScreenshot && (
              <EvidenceCard
                screenshotUrl={screenshotUrl}
                durationMs={
                  activeNode.data?.replayData?.duration_ms ||
                  activeNode.data?.result?.durationMs ||
                  activeNode.data?.result?.duration
                }
                timestamp={Date.now()}
              />
            )}
          </div>
        );
      }
      case "number":
        return (
          <div key={reactKey} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1">
                {t(`nodes.fields.${dataKey}`, field.label)}
              </label>
              {error && (
                <span className="text-[10px] text-red-400 font-bold animate-pulse">
                  {error}
                </span>
              )}
            </div>
            <VariableInput
              type="text"
              value={value}
              variables={variablesMap}
              hasError={!!error}
              placeholder={t(
                `nodes.placeholders.${field.key}`,
                field.placeholder,
              )}
              onChange={(e) => handleConfigUpdate(field.key, e.target.value)}
              className="w-full opacity-70 px-3 py-2 text-xs font-mono !pointer-events-auto !cursor-text !select-text"
            />
          </div>
        );
      case "selector":
        return (
          <div key={reactKey} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1 flex items-center justify-between">
              {t(`nodes.fields.${dataKey}`, field.label)}
              <div className="flex items-center gap-2">
                {(activeNode?.data?.state === "error" ||
                  activeNode?.data?.error ||
                  activeNode?.data?.lastError) && (
                  <button
                    onClick={() => handleAutoHeal(value)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors border text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 animate-pulse"
                    title="Attempt to fix selector with AI"
                  >
                    <Sparkles size={10} />
                    <span>Fix</span>
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  {activeNode?.data?.configuration?.healed && (
                    <span
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/20 animate-pulse"
                      title={
                        activeNode?.data?.configuration?.aiReasoning ||
                        "Automatically repaired by AI"
                      }
                    >
                      <Sparkles size={10} />
                      <span>AI REPAIRED</span>
                    </span>
                  )}
                  {activeNode?.data?.configuration?.isAI &&
                    !activeNode?.data?.configuration?.healed && (
                      <span
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        title={
                          activeNode?.data?.configuration?.aiReasoning ||
                          "Optimized by local AI"
                        }
                      >
                        <Sparkles size={10} />
                        <span>AI OPTIMIZED</span>
                      </span>
                    )}
                  <span className="text-[9px] text-indigo-400 opacity-70">
                    CSS / XPath
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (activeNode?.data?.state === "picking") {
                      onCancelPick && onCancelPick();
                    } else {
                      onStartPick && onStartPick(field.key);
                    }
                  }}
                  disabled={false}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors border text-[10px]",
                    activeNode?.data?.state === "picking"
                      ? "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 cursor-pointer"
                      : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20",
                  )}
                  title={
                    activeNode?.data?.state === "picking"
                      ? "Cancel Picking"
                      : "Pick Element from Browser"
                  }
                >
                  {activeNode?.data?.state === "picking" ? (
                    <X size={10} />
                  ) : (
                    <Crosshair size={10} />
                  )}
                  <span>
                    {activeNode?.data?.state === "picking"
                      ? t("common.cancel", "Cancel")
                      : t("common.pick", "Pick")}
                  </span>
                </button>
              </div>
            </label>

            {activeNode?.data?.configuration?.healed && (
              <Motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 uppercase tracking-tight">
                    <Sparkles size={12} fill="currentColor" />
                    <span>AI Correction Applied</span>
                  </div>
                  <div className="text-[9px] font-medium text-violet-400/60 bg-violet-500/5 px-1 rounded border border-violet-500/10">
                    {Math.round(
                      (activeNode.data.configuration.healingConfidence || 0) *
                        100,
                    )}
                    % Confidence
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="space-y-0.5">
                    <div className="text-slate-500 uppercase tracking-tighter font-bold">
                      Original
                    </div>
                    <div className="px-1.5 py-1 rounded bg-red-500/5 border border-red-500/10 text-red-400/80 line-through truncate font-mono">
                      {activeNode.data.configuration.originalValue}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-violet-500 uppercase tracking-tighter font-bold">
                      Healed
                    </div>
                    <div className="px-1.5 py-1 rounded bg-violet-500/10 border border-violet-500/20 text-violet-300 font-bold truncate font-mono">
                      {activeNode.data.configuration.healedValue}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-violet-300/70 italic leading-snug px-1 pt-1 border-t border-violet-500/10">
                  "{activeNode.data.configuration.aiReasoning}"
                </div>
              </Motion.div>
            )}
            <div className="relative">
              <VariableInput
                type="text"
                value={value}
                variables={variablesMap}
                hasError={!!error}
                placeholder={t(
                  `nodes.placeholders.${dataKey}`,
                  field.placeholder,
                )}
                onChange={(e) => handleConfigUpdate(dataKey, e.target.value)}
                className="w-full pr-8 text-xs font-mono !pointer-events-auto !cursor-text !select-text px-3 py-2"
              />
              <div
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                  value
                    ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                    : "bg-slate-700",
                )}
              />
            </div>

            <div
              className={cn(
                "mt-1 flex items-start gap-1.5 p-2 rounded border text-[10px] leading-tight max-w-[280px]",
                window.location.hostname !== "localhost"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500/90"
                  : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-medium",
              )}
            >
              <Sparkles size={12} className="shrink-0 mt-0.5 opacity-80" />
              <span>
                {window.location.hostname !== "localhost" ? (
                  <b>Remote Picker (BETA):</b>
                ) : (
                  <b>Smart Picker:</b>
                )}{" "}
                {t(
                  "nodes.hints.picker_info",
                  "Launch a cloud browser to pick elements directly from your target app.",
                )}
              </span>
            </div>

            {error && (
              <span className="text-[10px] text-red-400 font-bold ml-1">
                {error}
              </span>
            )}
          </div>
        );
      case "mapping":
        return (
          <MappingEditor
            key={reactKey}
            label={field.label}
            value={value}
            onChange={(newVal) => handleConfigUpdate(dataKey, newVal)}
          />
        );
      default:
        return (
          <div key={reactKey} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1">
                {t(`nodes.fields.${dataKey}`, field.label)}
              </label>
              {error && (
                <span className="text-[10px] text-red-400 font-bold animate-pulse">
                  {error}
                </span>
              )}
            </div>
            <VariableInput
              type="text"
              value={value}
              variables={variablesMap}
              hasError={!!error}
              placeholder={t(
                `nodes.placeholders.${dataKey}`,
                field.placeholder,
              )}
              onChange={(e) => handleConfigUpdate(dataKey, e.target.value)}
              className="w-full text-xs font-mono !pointer-events-auto !cursor-text !select-text px-3 py-2"
            />
          </div>
        );
    }
  };

  const renderNodeInputs = () => {
    const inputs = (definedInputs || []).map((input) => {
      if (input.key === "model") {
        return { ...input, placeholder: `Uses global: ${globalModel}` };
      }
      if (input.key === "provider") {
        return {
          ...input,
          label: `${input.label} (Global: ${globalProvider})`,
        };
      }
      return input;
    });

    const result = activeNode.data?.result;
    const nodeType = activeNode.data?.type || activeNode.type;
    const isAiNode = [
      "call_llm",
      "chain_of_thought",
      "generate_data",
      "validate_semantic",
      "extract_dom_context",
      "smart_selector",
    ].includes(nodeType);
    const aiResult = isAiNode ? result?.data : null;

    return (
      <div className="space-y-5">
        {inputs.length > 0 ? (
          inputs
            .filter((f) => !f.isVisible || f.isVisible(localConfig || {}))
            .map(renderInput)
        ) : (
          <div className="p-4 rounded-lg border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-center">
            <Info size={20} className="text-slate-500 mb-2" />
            <span className="text-xs text-slate-400">
              No configuration options available for this node type.
            </span>
          </div>
        )}

        {activeNode.data?.result && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Sparkles size={12} className="text-amber-500" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Latest Result
              </span>
            </div>
            {renderEmittedData()}
          </div>
        )}

        {(precedingNodes.length > 0 || isConditional) && (
          <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Incoming Data
              </span>
              {precedingNodes.length === 0 && (
                <span className="text-[9px] text-amber-500/80 italic">
                  No connected inputs
                </span>
              )}
            </div>
            <div className="space-y-2">
              {precedingNodes.length === 0 && isConditional && (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-200/60 leading-relaxed">
                  Connect a node to the left to see available variables for your
                  expressions.
                </div>
              )}
              {precedingNodes.map((pn) => {
                const hasResult =
                  pn.data?.result && Object.keys(pn.data.result).length > 0;
                let displayData = hasResult
                  ? pn.data.result.data !== undefined
                    ? pn.data.result.data
                    : pn.data.result
                  : pn.data?.configuration || {};

                // Handle cases where data might be a string (e.g. raw responses)
                if (typeof displayData === "string") {
                  try {
                    displayData = JSON.parse(displayData);
                  } catch {
                    displayData = { value: displayData };
                  }
                }

                // Filter keys for the summary view
                const _entries = Object.entries(displayData || {}).filter(
                  ([k]) =>
                    !k.startsWith("_") &&
                    ![
                      "branches",
                      "cases",
                      "data",
                      "message",
                      "metadata",
                    ].includes(k),
                );

                return (
                  <div
                    key={pn.id}
                    className="group/node-card p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-3 mb-3 hover:bg-slate-900/60 transition-all shadow-sm"
                  >
                    <div className="flex justify-between items-center px-1">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight flex items-center gap-2 truncate">
                          <div className="w-1 h-3 bg-indigo-500 rounded-full shrink-0" />
                          <span
                            className="truncate"
                            title={
                              pn.data?.customLabel || pn.data?.label || pn.type
                            }
                          >
                            {pn.data?.customLabel || pn.data?.label || pn.type}
                          </span>
                          {pn.data?.result?._dataSource === "simulated" && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[8px] border border-amber-500/20 font-bold uppercase shrink-0">
                              PREVIEW
                            </span>
                          )}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5 opacity-60 truncate">
                          {`{{${pn.data?.customLabel || pn.data?.label || pn.id}.${hasResult ? "result" : "config"}}}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/node-card:opacity-100 transition-opacity ml-2 shrink-0">
                        <button
                          onClick={() => {
                            const ref = `{{${pn.data?.customLabel || pn.data?.label || pn.id}.${hasResult ? "result" : "config"}}}`;
                            navigator.clipboard.writeText(ref);
                            toast.success("Reference copied", {
                              id: "ref-copy",
                            });
                          }}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Copy reference"
                        >
                          <Copy size={10} />
                        </button>
                        <button
                          onClick={() =>
                            setInspectedData({
                              title:
                                pn.data?.customLabel || pn.data?.label || pn.id,
                              content: displayData,
                            })
                          }
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Inspect JSON"
                        >
                          <Maximize2 size={10} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {renderDataValue(displayData, false)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {aiResult && (
          <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 px-1">
              <div className="p-1 rounded-md bg-indigo-500/20">
                <Brain size={12} className="text-indigo-400" />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                AI Execution Result
              </span>
            </div>

            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/80 p-4 shadow-xl overflow-hidden relative group">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500" />

              {aiResult.content && typeof aiResult.content === "string" && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Extracted Content
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                      $
                      {aiResult.variable ||
                        localConfig.variableName ||
                        "domContext"}
                    </span>
                  </div>
                  <pre className="text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap font-sans bg-black/20 p-2 rounded-lg border border-white/5 max-h-40 overflow-y-auto">
                    {aiResult.content}
                  </pre>
                </div>
              )}

              {aiResult.response && typeof aiResult.response === "string" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Text Response
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                      $
                      {aiResult.variable ||
                        localConfig.variableName ||
                        "result"}
                    </span>
                  </div>
                  <pre className="text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
                    {aiResult.response}
                  </pre>
                </div>
              )}

              {(aiResult.thought || aiResult.answer) && (
                <div className="space-y-3">
                  {aiResult.thought && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-medium">
                          🧠 Reasoning Process
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                          $
                          {aiResult.thoughtVariable ||
                            localConfig.thoughtVariable ||
                            "aiThought"}
                        </span>
                      </div>
                      <pre className="text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap font-sans bg-black/20 p-2 rounded-lg border border-white/5 max-h-40 overflow-y-auto italic">
                        {aiResult.thought}
                      </pre>
                    </div>
                  )}
                  {aiResult.answer && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-medium">
                          ✅ Final Answer
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                          $
                          {aiResult.answerVariable ||
                            localConfig.answerVariable ||
                            "aiAnswer"}
                        </span>
                      </div>
                      <pre className="text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap font-sans bg-black/20 p-2 rounded-lg border border-white/5">
                        {aiResult.answer}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {aiResult.result && aiResult.isValid === undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Structured Data
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                      ${aiResult.variable || localConfig.variableName || "data"}
                    </span>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5 relative group/data">
                    <pre className="text-[10px] font-mono text-emerald-400 leading-tight pr-12 overflow-hidden line-clamp-6">
                      {truncateResult(aiResult.result)}
                    </pre>
                    <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover/data:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(aiResult.result, null, 2),
                          );
                          toast.success("Copied to clipboard", { icon: "📋" });
                        }}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 shadow-lg"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() =>
                          setInspectedData({
                            title: "Structured Data",
                            content: aiResult.result,
                          })
                        }
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 shadow-lg"
                      >
                        <Maximize2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {(aiResult.isValid !== undefined ||
                aiResult.result?.isValid !== undefined) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    {(() => {
                      const isValid =
                        aiResult.isValid !== undefined
                          ? aiResult.isValid
                          : aiResult.result?.isValid;
                      const confidence =
                        aiResult.confidence !== undefined
                          ? aiResult.confidence
                          : aiResult.result?.confidence;
                      const _reason =
                        aiResult.reason || aiResult.result?.reason;

                      return (
                        <>
                          <div
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold",
                              isValid
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-red-500/10 border-red-500/20 text-red-400",
                            )}
                          >
                            {isValid ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <AlertCircle size={14} />
                            )}
                            {isValid ? "Valid Content" : "Invalid Content"}
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">
                              Var: $
                              {aiResult.variable ||
                                localConfig.variableName ||
                                "semanticValid"}
                            </span>
                            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">
                              Confidence
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              {(Number(confidence) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {(aiResult.reason || aiResult.result?.reason) && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-medium ml-1">
                        Reasoning
                      </span>
                      <p className="text-[11px] text-slate-300 italic leading-snug bg-white/5 p-2 rounded-lg border border-white/5">
                        "{aiResult.reason || aiResult.result?.reason}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!aiResult.content &&
                !aiResult.response &&
                !aiResult.thought &&
                !aiResult.answer &&
                !aiResult.result &&
                aiResult.isValid === undefined && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Result Data
                    </span>
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                      <pre className="text-[10px] font-mono text-slate-300 leading-tight max-h-40 overflow-y-auto">
                        {JSON.stringify(aiResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

              {aiResult.usage && (
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-600 font-mono uppercase tracking-tighter">
                  <span>Tokens: {aiResult.usage.totalTokens || 0}</span>
                  <span>
                    Execution: {activeNode.data?.executionTime || 0}ms
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <Motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 400,
            mass: 0.8,
          }}
          onMouseDown={stopPropagation}
          onClick={stopPropagation}
          className={cn(
            "w-full sm:w-80 md:w-[400px] h-full glass-panel z-[var(--z-popover)] flex flex-col !pointer-events-auto !cursor-auto !select-text relative shadow-2xl",
          )}
        >
          <div
            className={cn(
              "h-14 shrink-0 flex items-center justify-between px-5 border-b",
              CATEGORY_STYLES[colorKey]?.panel?.headerBorder,
              CATEGORY_STYLES[colorKey]?.panel?.headerGradient,
            )}
          >
            <div className="flex flex-col justify-center">
              <span
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold mb-0.5",
                  CATEGORY_STYLES[colorKey]?.panel?.categoryText,
                )}
              >
                {safeConfig.category.replace("_", " ")}
              </span>
              <div className="flex items-center gap-2 w-full mr-4">
                <input
                  type="text"
                  value={localLabel}
                  placeholder={activeNode.data?.label || safeConfig.label}
                  className={cn(
                    "bg-transparent border-white/10 hover:border-white/20 focus:border-indigo-500/50 border-b-2 text-sm font-bold text-[var(--text-main)] dark:text-white w-full focus:outline-none transition-colors placeholder:text-white/30 placeholder:font-normal !pointer-events-auto !cursor-text !select-text",
                  )}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    setLocalLabel(e.target.value);

                    if (updateTimeoutRef.current)
                      clearTimeout(updateTimeoutRef.current);

                    updateTimeoutRef.current = setTimeout(() => {
                      const finalLabel =
                        e.target.value.trim() === "" ? null : e.target.value;
                      if (finalLabel !== activeNode.data?.customLabel) {
                        updateNodeConfiguration(activeNode.id, {
                          ...(activeNode.data?.configuration || {}),
                          customLabel: finalLabel,
                        });
                      }
                    }, 300);
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const isDisabled = !activeNode.data?.disabled;
                  // Forzar actualización inmediata en el objeto de datos del nodo
                  activeNode.data.disabled = isDisabled;
                  updateNodeConfiguration(activeNode.id, {
                    ...activeNode.data,
                    disabled: isDisabled,
                  });
                  // Disparar un evento de cambio local para que el canvas reaccione
                  window.dispatchEvent(
                    new CustomEvent("node-data-updated", {
                      detail: { nodeId: activeNode.id },
                    }),
                  );
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  activeNode.data?.disabled
                    ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                    : "text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10",
                )}
                title={
                  activeNode.data?.disabled ? "Enable Node" : "Disable Node"
                }
              >
                {activeNode.data?.disabled ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(t("common.confirm_delete", "Delete this node?"))
                  ) {
                    onDeleteNode(activeNode.id);
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title={t("common.delete_node", "Delete Node")}
              >
                <Trash2 size={16} />
              </button>
              <div className="w-[1px] h-4 bg-white/10 mx-1" />
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {(() => {
              const isComponent = nodeKey === "component";
              const isLoop = nodeKey === "loop";

              const renderCompositionDashboard = () => (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-white/5 bg-white/5 flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-bold">
                        Nodes
                      </span>
                      <span className="text-2xl font-bold text-white">
                        {resolvedStats.nodeCount ?? 0}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-white/5 bg-white/5 flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-bold">
                        I/O
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={cn(
                            "text-xs font-mono px-1.5 py-0.5 rounded",
                            resolvedStats.hasInput
                              ? "bg-indigo-500/20 text-indigo-300"
                              : "bg-white/5 text-slate-500",
                          )}
                        >
                          IN
                        </span>
                        <ArrowLeftRight size={12} className="text-slate-600" />
                        <span
                          className={cn(
                            "text-xs font-mono px-1.5 py-0.5 rounded",
                            resolvedStats.hasOutput
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-white/5 text-slate-500",
                          )}
                        >
                          OUT
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onEnterSubFlow) {
                        onEnterSubFlow(activeNode.id);
                        onClose();
                      }
                    }}
                    className="w-full py-4 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-3 group"
                  >
                    <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform">
                      <Layout size={18} className="text-indigo-400" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-indigo-300">
                        {isLoop ? "Open Loop Logic" : "Open Logic Flow"}
                      </span>
                      <span className="text-[10px] text-indigo-400/60">
                        {isLoop
                          ? "Dive into iteration internals"
                          : "Dive into component internals"}
                      </span>
                    </div>
                    <ArrowRight
                      size={16}
                      className="ml-auto text-indigo-500/50 group-hover:translate-x-1 transition-transform"
                    />
                  </button>

                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Sparkles size={12} className="text-amber-500" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                        Result & Emitted Data
                      </span>
                    </div>
                    {renderEmittedData()}
                  </div>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to ungroup this ${isLoop ? "loop" : "component"}? This will dissolve the boundaries.`,
                        )
                      ) {
                        onUngroup(activeNode.id);
                        onClose();
                      }
                    }}
                    className="w-full py-2 rounded-lg border border-red-500/10 text-red-400/70 hover:bg-red-500/5 hover:text-red-400 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoop ? "Ungroup Loop" : "Ungroup Component"}
                  </button>
                </div>
              );

              if (isComponent) {
                return (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                        <FileText size={12} />
                        Description
                      </label>
                      <textarea
                        value={localConfig.description || ""}
                        onChange={(e) =>
                          handleConfigUpdate("description", e.target.value)
                        }
                        placeholder="Describe what this component does..."
                        className="w-full h-24 bg-[var(--bg-canvas)]/50 border border-[var(--border-ui)] rounded-lg p-3 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-[var(--text-muted)] resize-none"
                      />
                    </div>
                    {renderNodeInputs()}
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      {renderCompositionDashboard()}
                    </div>
                  </div>
                );
              }

              if (isLoop) {
                return (
                  <div className="space-y-8">
                    {renderNodeInputs()}
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex items-center gap-2 px-1">
                        <Box size={12} className="text-slate-500" />
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                          Composition Details
                        </span>
                      </div>
                      {renderCompositionDashboard()}
                    </div>
                  </div>
                );
              }

              return renderNodeInputs();
            })()}
          </div>

          {/* Evidence preview for screenshot nodes (shown at bottom, only when not already shown inline via takeScreenshot checkbox) */}
          {nodeScreenshotUrl &&
          !definedInputs?.some((f) => f.key === "takeScreenshot") ? (
            <div className="p-4 border-t border-[var(--border-ui)] bg-[var(--bg-panel)]">
              <EvidenceCard
                screenshotUrl={nodeScreenshotUrl}
                nodeId={activeNode.id}
                title="Capture Preview"
                durationMs={
                  activeNode.data?.replayData?.duration_ms ||
                  activeNode.data?.result?.durationMs ||
                  activeNode.data?.result?.duration
                }
                timestamp={Date.now()}
              />
            </div>
          ) : null}

          {/* FOOTER ACTIONS (Themed) */}
          <div className="p-4 border-t border-[var(--border-ui)] bg-[var(--bg-panel)] shrink-0 space-y-3">
            {/* AI Suggestion / Healed Banner */}
            {(activeNode?.data?.state === "healed" ||
              activeNode?.data?.configuration?.healed ||
              (activeNode?.data?.type === "smart_selector" &&
                activeNode?.data?.result?.suggestedSelector)) && (
              <div className="mb-4 bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 space-y-3 shadow-xl shadow-violet-500/5 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-violet-500/20 rounded-lg shrink-0 border border-violet-500/20 shadow-inner">
                    <Sparkles size={16} className="text-violet-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-bold text-violet-200 uppercase tracking-wider">
                        AI Evidence Found
                      </p>
                      {activeNode.data.result?.confidence && (
                        <span
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                            activeNode.data.result.confidence > 0.8
                              ? "bg-green-500/20 text-green-400"
                              : "bg-amber-500/20 text-amber-400",
                          )}
                        >
                          {(activeNode.data.result.confidence * 100).toFixed(0)}
                          % Conf.
                        </span>
                      )}
                    </div>
                    {activeNode.data.configuration?.aiReasoning ||
                    activeNode.data.result?.reasoning ? (
                      <p className="text-[10px] text-violet-300/80 leading-relaxed line-clamp-2 italic">
                        "
                        {activeNode.data.configuration?.aiReasoning ||
                          activeNode.data.result?.reasoning}
                        "
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 bg-black/40 rounded-lg p-3 border border-white/5 shadow-inner">
                  <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-black opacity-40">
                    <span>Target Suggestion</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 font-mono text-xs text-violet-200 bg-violet-500/5 p-2 rounded border border-violet-500/10 truncate">
                      {activeNode.data.configuration?.healedValue ||
                        activeNode.data.result?.suggestedSelector ||
                        activeNode.data.result?.newSelector}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const resData = activeNode?.data?.result || {};
                    const newSelector =
                      activeNode?.data?.configuration?.healedValue ||
                      resData.suggestedSelector ||
                      resData.newSelector;

                    if (newSelector) {
                      const targetField =
                        activeNode?.data?.type === "smart_selector"
                          ? "originalSelector"
                          : "selector";

                      // Update config AND clear healed state
                      updateNodeConfiguration(activeNode.id, {
                        ...(activeNode.data?.configuration || {}),
                        [targetField]: newSelector,
                        healed: undefined,
                        healedFrom: undefined,
                        healedValue: undefined,
                        originalValue: undefined,
                        aiReasoning: undefined,
                        healingConfidence: undefined,
                      });

                      // Reset state to SUCCESS or default so orange border vanishes
                      updateNodeState(activeNode.id, NODE_STATES.SUCCESS);

                      toast.success(
                        t(
                          "actions.smart_selector.applied",
                          "Fix acknowledged!",
                        ),
                      );
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-violet-500/20 active:scale-[0.98]"
                >
                  <Sparkles size={14} fill="currentColor" />
                  Acknowledge Fix
                </button>
              </div>
            )}

            {/* CONFIGURATION VALIDATION WARNING */}
            {hasErrors && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                      {t(
                        "common.incomplete_config",
                        "Incomplete Configuration",
                      )}
                    </h4>
                    <p className="text-[11px] text-amber-500/80 leading-relaxed">
                      {t(
                        "common.node_cannot_run",
                        "This node cannot be executed yet. Missing mandatory field:",
                      )}{" "}
                      <span className="text-amber-400 font-bold">
                        {Object.values(validationErrors)[0]}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Action: RUN NODE */}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (hasErrors) {
                  toast.error(
                    `Incomplete configuration. Missing: ${Object.values(validationErrors)[0]}`,
                    {
                      icon: (
                        <AlertTriangle size={16} className="text-amber-500" />
                      ),
                    },
                  );
                  return;
                }

                console.log(
                  `[NodeConfig] Executing isolated node ${activeNode.id} (${activeNode.type})`,
                );

                console.log(
                  "[NodeConfig] 🚀 Running Node with variables:",
                  variablesMap,
                );

                await onExecute(
                  {
                    ...activeNode,
                    data: {
                      ...activeNode.data,
                      configuration: {
                        ...(activeNode.data?.configuration || {}),
                        ...localConfig,
                      },
                    },
                  },
                  { variables: variablesMap },
                );
                await refreshVariables();
              }}
              className={cn(
                "w-full flex items-center justify-center gap-3 py-3 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all relative overflow-hidden group mt-4",
                hasErrors
                  ? "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed"
                  : cn(
                      "text-white shadow-xl active:scale-[0.97] hover:-translate-y-0.5",
                      CATEGORY_STYLES[colorKey]?.panel?.buttonGradient,
                    ),
              )}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {hasErrors ? (
                <AlertTriangle
                  size={16}
                  className="text-amber-500 animate-pulse"
                />
              ) : (
                <Play
                  size={16}
                  fill="currentColor"
                  className="group-hover:scale-110 transition-transform"
                />
              )}
              {hasErrors
                ? t("common.incomplete", "Incomplete")
                : t("common.run_node", "Run Node")}
            </button>

            {/* NAVIGATION FOOTER */}
            {(precedingNodes.length > 0 || nextNodes.length > 0) && (
              <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() =>
                    precedingNodes[0] && onSelectNode(precedingNodes[0].id)
                  }
                  disabled={precedingNodes.length === 0}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <div className="w-px h-4 bg-white/5" />
                <button
                  onClick={() => nextNodes[0] && onSelectNode(nextNodes[0].id)}
                  disabled={nextNodes.length === 0}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </Motion.div>
      )}

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={32} />
          </button>
          <img
            src={lightboxUrl}
            alt="Fullscreen Evidence"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Data Inspector Modal */}
      {inspectedData && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-6 backdrop-blur-md"
          onClick={() => setInspectedData(null)}
        >
          <Motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-4xl max-h-[80vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {inspectedData.title}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Full Data Inspector
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text =
                      typeof inspectedData.content === "object"
                        ? JSON.stringify(inspectedData.content, null, 2)
                        : String(inspectedData.content);
                    navigator.clipboard.writeText(text);
                    toast.success("Copied to clipboard", { icon: "📋" });
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors"
                >
                  <Copy size={14} />
                  COPY
                </button>
                <button
                  className="p-1.5 text-slate-500 hover:text-white transition-colors"
                  onClick={() => setInspectedData(null)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
              <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
                {typeof inspectedData.content === "object"
                  ? JSON.stringify(inspectedData.content, null, 2)
                  : String(inspectedData.content)}
              </pre>
            </div>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Remove React.memo wrapper to rely on internal state and parent keying
export default NodeConfigurationPanel;
