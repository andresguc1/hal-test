import React, { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  GitBranch,
  Box,
  Sparkles,
  Plus,
  CornerDownRight,
  AlertTriangle,
  Check,
  Zap,
  ChevronDown,
  Terminal,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import VariableInput from "../VariableInput";
import {
  buildVariableTypeLookup,
  resolveVariableType,
} from "@/utils/conditionTypeUtils";

const ConditionalBranchesEditor = React.memo(
  ({ value, onChange, variables, allVariables, suggestions }) => {
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

      return safeBranches.map((b) => {
        let cleanExpr = b.expression;
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

    const availableVariablePaths = suggestions || [];

    // Lookup map: template path -> { type, label } so the editor can adapt the
    // Value field to the type of the variable selected on the left.
    const variableTypeLookup = useMemo(
      () => buildVariableTypeLookup(suggestions),
      [suggestions],
    );

    const resolveLeftType = useCallback(
      (leftRef) => resolveVariableType(leftRef, variableTypeLookup),
      [variableTypeLookup],
    );

    const updateBranch = useCallback(
      (index, field, val) => {
        const newBranches = [...branches];
        const currentBranch = { ...newBranches[index] };
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

    const toggleMode = useCallback(
      (index) => {
        const newBranches = [...branches];
        const branch = { ...newBranches[index] };
        if (branch.mode === "simple") {
          branch.mode = "advanced";
          branch.expression = "";
        } else {
          branch.mode = "simple";
          branch.expression = { left: "", operator: "==", right: "" };
        }
        newBranches[index] = branch;
        onChange(newBranches);
      },
      [branches, onChange],
    );

    const addBranch = useCallback(() => {
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

    const removeBranch = useCallback(
      (index) => {
        if (branches.length <= 1) return;
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

    const resolveVariableValue = useCallback(
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
        const drill = (obj, pathParts) => {
          let curr = obj;
          for (const p of pathParts) {
            if (curr === null || curr === undefined || typeof curr !== "object")
              return undefined;
            if (p in curr) curr = curr[p];
            else return undefined;
          }
          return curr;
        };
        const realNodeKey = Object.keys(variables || {}).find(
          (k) => normalize(k) === normNodeName,
        );
        if (!realNodeKey) return undefined;
        return drill(variables[realNodeKey], propPath);
      },
      [variables],
    );

    const getValueSuggestions = useCallback(
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
        if (propName === "status") {
          ["success", "error", "loading", "pending"].forEach((s) => {
            if (!items.find((i) => i.label === s))
              items.push({ label: s, path: s, type: "string" });
          });
        }
        if (propName === "success") {
          ["true", "false"].forEach((s) => {
            if (!items.find((i) => i.label === s))
              items.push({ label: s, path: s, type: "boolean" });
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
                      className="bg-transparent border-none p-0 text-[11px] font-bold text-white/90 focus:outline-none placeholder:text-slate-700 focus:ring-0 truncate min-w-0 flex-1"
                    />
                  </div>
                  {!isElseBranch && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleMode(index)}
                        type="button"
                        aria-label={t(
                          "nodes.config.conditional.toggle_mode",
                          isAdvanced ? "Cambiar a modo regla" : "Cambiar a modo JS",
                        )}
                        title={isAdvanced ? "Modo JS" : "Modo regla"}
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
                        type="button"
                        aria-label={t(
                          "nodes.config.conditional.remove_rule",
                          "Eliminar regla",
                        )}
                        title={t("nodes.config.conditional.remove_rule", "Eliminar regla")}
                        className="p-1.5 min-w-[28px] min-h-[28px] inline-flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

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
                      <div className="flex flex-wrap items-center gap-2 bg-slate-900/40 p-2 rounded-xl border border-white/5">
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
                            autoOpen
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
                            aria-label={t(
                              "nodes.config.conditional.operator",
                              "Operador de comparación",
                            )}
                            className="w-full bg-slate-800/80 border-white/5 rounded-lg text-[11px] font-black text-sky-400 h-8 text-center appearance-none cursor-pointer focus:ring-1 focus:ring-sky-500/50 outline-none"
                          >
                            {operators.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1 min-w-[100px]">
                          {(() => {
                            const leftType = resolveLeftType(
                              branch.expression?.left,
                            );
                            const isBooleanLeft = leftType === "boolean";

                            if (isBooleanLeft) {
                              const currentRight = String(
                                branch.expression?.right || "",
                              );
                              const boolValue =
                                currentRight.trim() === "true";
                              return (
                                <select
                                  value={boolValue ? "true" : "false"}
                                  onChange={(e) =>
                                    updateBranch(
                                      index,
                                      "expr_right",
                                      e.target.value,
                                    )
                                  }
                                  aria-label={t(
                                    "nodes.config.conditional.value",
                                    "Valor de comparación",
                                  )}
                                  className="w-full bg-slate-800/80 border-white/5 rounded-lg text-[11px] font-black text-emerald-400 h-8 text-center appearance-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50 outline-none"
                                >
                                  <option value="true">true</option>
                                  <option value="false">false</option>
                                </select>
                              );
                            }

                            return (
                              <VariableInput
                                value={branch.expression?.right || ""}
                                variables={allVariables || variables}
                                contextualVariables={variables}
                                suggestions={[
                                  ...getValueSuggestions(
                                    branch.expression?.left,
                                  ),
                                  ...availableVariablePaths,
                                ]}
                                placeholder={t(
                                  "nodes.config.conditional.placeholder_val",
                                  "Valor...",
                                )}
                                onChange={(e) =>
                                  updateBranch(
                                    index,
                                    "expr_right",
                                    e.target.value,
                                  )
                                }
                                className="bg-slate-800/40 border-transparent text-[11px] h-8 rounded-lg focus:bg-slate-800 focus:border-sky-500/30"
                              />
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <button
            onClick={addBranch}
            type="button"
            aria-label={t("nodes.config.conditional.add_rule", "Agregar Nueva Regla")}
            className="w-full py-3 bg-sky-500/5 hover:bg-sky-500/10 border border-dashed border-sky-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-sky-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98] group"
          >
            <Plus
              size={14}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
            {t("nodes.config.conditional.add_rule", "Agregar Nueva Regla")}
          </button>
        </div>
      </div>
    );
  },
);

ConditionalBranchesEditor.displayName = "ConditionalBranchesEditor";

export default ConditionalBranchesEditor;
