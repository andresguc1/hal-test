import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Info,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STRATEGIES = [
  { value: "label", label: "🔤 Visible text" },
  { value: "css", label: "🎯 CSS selector" },
];

const ACTIONS = [
  { value: "check", label: "✔ Check" },
  { value: "uncheck", label: "✖ Uncheck" },
  { value: "toggle", label: "🔄 Toggle" },
];

const CheckboxRow = ({
  item,
  index,
  update,
  remove,
  move,
  pickingField,
  onStartPick,
  onCancelPick,
  t,
}) => {
  const picking =
    pickingField === `fields.${index}.target` && item.strategy === "css";

  return (
    <div className="px-3 py-2.5 bg-[#0f172a]/60 border border-pink-500/15 hover:border-pink-500/30 rounded-xl space-y-2 relative group/field transition-all">
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <ArrowUp
            size={12}
            className="text-slate-600 hover:text-pink-400 cursor-pointer transition-colors"
            onClick={() => move(index, -1)}
          />
          <span className="text-[8px] font-mono text-slate-500">
            {index + 1}
          </span>
          <ArrowDown
            size={12}
            className="text-slate-600 hover:text-pink-400 cursor-pointer transition-colors"
            onClick={() => move(index, 1)}
          />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <select
              value={item.strategy || "label"}
              onChange={(e) => update(index, "strategy", e.target.value)}
              className="bg-[#0b1222] border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1.5 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none w-[42%]"
            >
              {STRATEGIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="flex-1 flex gap-1 relative">
              <input
                type="text"
                value={item.target || ""}
                onChange={(e) => update(index, "target", e.target.value)}
                placeholder={
                  item.strategy === "label"
                    ? 'Label text, e.g. "I accept the terms"'
                    : "CSS selector, e.g. input[name=agree]"
                }
                className="flex-1 bg-[#0b1222] border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1.5 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none min-w-0"
              />
              {item.strategy === "css" && (
                <button
                  type="button"
                  onClick={() => {
                    if (picking) {
                      onCancelPick?.();
                    } else {
                      onStartPick?.(`fields.${index}.target`);
                    }
                  }}
                  title={t("common.pick", "Pick in page")}
                  className={cn(
                    "px-2 flex items-center justify-center rounded-md transition-colors shrink-0",
                    picking
                      ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                      : "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30",
                  )}
                >
                  <MousePointerClick size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {ACTIONS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => update(index, "action", a.value)}
                className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                  (item.action || "check") === a.value
                    ? "bg-pink-500/20 border-pink-500/40 text-pink-300"
                    : "bg-[#0b1222] border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600",
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => remove(index)}
          className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

const CheckboxListEditor = React.memo(
  ({ value, onChange, onStartPick, onCancelPick, pickingField }) => {
    const { t } = useTranslation();

    const fields = useMemo(() => {
      try {
        return Array.isArray(value)
          ? value
          : typeof value === "string"
            ? JSON.parse(value)
            : [];
      } catch {
        return [];
      }
    }, [value]);

    const update = useCallback(
      (index, key, val) => {
        const next = [...fields];
        next[index] = { ...next[index], [key]: val };
        onChange(next);
      },
      [fields, onChange],
    );

    const move = useCallback(
      (index, dir) => {
        const next = [...fields];
        const target = index + dir;
        if (target < 0 || target >= next.length) return;
        const [row] = next.splice(index, 1);
        next.splice(target, 0, row);
        onChange(next);
      },
      [fields, onChange],
    );

    const add = useCallback(() => {
      onChange([...fields, { strategy: "label", target: "", action: "check" }]);
    }, [fields, onChange]);

    const remove = useCallback(
      (index) => {
        const next = [...fields];
        next.splice(index, 1);
        onChange(next);
      },
      [fields, onChange],
    );

    return (
      <div className="space-y-3 mt-2 mb-2">
        <div className="flex justify-between items-center">
          <label className="text-[11px] uppercase tracking-[0.2em] font-black text-pink-400 ml-1 flex items-center gap-2">
            {t("nodes.config.checkbox_rows", "Checkboxes")}
            {fields.length > 0 && (
              <span className="text-[9px] bg-pink-500/10 text-pink-400/70 px-1.5 py-0.5 rounded-full">
                {fields.length}
              </span>
            )}
          </label>
          <div className="group relative">
            <Info
              size={14}
              className="text-slate-500 hover:text-pink-400 cursor-help transition-colors"
            />
            <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl space-y-1">
              <p className="font-bold text-pink-400">How it works</p>
              <p>
                A checkbox can be found by its visible label text or by a CSS
                selector. Each row runs in order with its own target state.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {fields.length === 0 && (
            <p className="text-[10px] text-slate-500 px-1">
              Add at least one checkbox below.
            </p>
          )}
          {fields.map((f, index) => (
            <CheckboxRow
              key={f.id || `row_${index}_${f.target || index}`}
              item={f}
              index={index}
              update={update}
              remove={remove}
              move={move}
              pickingField={pickingField}
              onStartPick={onStartPick}
              onCancelPick={onCancelPick}
              t={t}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={add}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-pink-500/30 rounded-xl text-[10px] font-bold text-pink-400/80 uppercase tracking-wider hover:bg-pink-500/10 hover:border-pink-500/50 hover:text-pink-400 transition-all"
        >
          <Plus size={14} /> Add Checkbox
        </button>
      </div>
    );
  },
);

CheckboxListEditor.displayName = "CheckboxListEditor";
export default CheckboxListEditor;
