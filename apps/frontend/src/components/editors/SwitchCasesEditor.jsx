import React, { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftRight,
  Info,
  CornerDownRight,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import VariableInput from "../VariableInput";

const SwitchCasesEditor = React.memo(
  ({ value, onChange, data, variables, allVariables, suggestions }) => {
    const { t } = useTranslation();
    const cases = useMemo(() => (Array.isArray(value) ? value : []), [value]);

    const matchedCaseId = data?.result?.matchedCaseId;

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
      </div>
    );
  },
);

SwitchCasesEditor.displayName = "SwitchCasesEditor";

export default SwitchCasesEditor;
