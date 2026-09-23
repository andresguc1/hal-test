import React, { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Info,
  Plus,
  Trash2,
  Type,
  Link2,
  Braces,
  MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SOURCES = [
  { value: "text", label: "Text", icon: Type },
  { value: "attribute", label: "Attribute", icon: Link2 },
  { value: "html", label: "HTML", icon: Braces },
];

const ExtractFieldItem = ({
  f,
  index,
  updateField,
  removeField,
  pickingField,
  onStartPick,
  onCancelPick,
}) => (
  <div className="px-3 py-2.5 bg-[#0f172a]/60 border border-amber-500/15 hover:border-amber-500/30 rounded-xl space-y-2 relative group/field transition-all">
    <div className="flex items-center gap-2">
      <span className="text-[8px] font-mono text-slate-500 shrink-0">
        {index + 1}
      </span>
      <select
        value={f.source || "text"}
        onChange={(e) => updateField(index, "source", e.target.value)}
        className="bg-[#0b1222] border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none w-1/4 shrink-0"
        title="Source: text, attribute, or inner HTML"
      >
        {SOURCES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={f.name || ""}
        onChange={(e) => updateField(index, "name", e.target.value)}
        placeholder="Field name (column)"
        className="flex-1 bg-[#0b1222] border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none min-w-0"
      />
      <label
        className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0 cursor-pointer"
        title="Optional: missing/empty values do not fail the extraction"
      >
        <input
          type="checkbox"
          checked={f.optional === true}
          onChange={(e) => updateField(index, "optional", e.target.checked)}
          className="accent-amber-500"
        />
        Optional
      </label>
      <button
        type="button"
        onClick={() => removeField(index)}
        className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors shrink-0"
      >
        <Trash2 size={12} />
      </button>
    </div>

    <div className="flex gap-2">
      <div className="flex-1 flex gap-1 relative min-w-0">
        <input
          type="text"
          value={f.selector || ""}
          onChange={(e) => updateField(index, "selector", e.target.value)}
          placeholder="Selector relative to item (optional)"
          className="flex-1 bg-[#0b1222] border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none min-w-0"
        />
        <button
          type="button"
          onClick={() => {
            const fieldPath = `fields.${index}.selector`;
            if (pickingField === fieldPath) {
              onCancelPick?.();
            } else {
              onStartPick?.(fieldPath);
            }
          }}
          title="Pick on page"
          className={cn(
            "px-2 flex items-center justify-center rounded-md transition-colors shrink-0",
            pickingField === `fields.${index}.selector`
              ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
              : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30",
          )}
        >
          <MousePointerClick size={12} />
        </button>
      </div>
      {f.source === "attribute" && (
        <input
          type="text"
          value={f.attribute || ""}
          onChange={(e) => updateField(index, "attribute", e.target.value)}
          placeholder="Attribute (e.g. href)"
          className="w-1/3 bg-[#0b1222] border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
        />
      )}
    </div>
  </div>
);

const ExtractFieldsEditor = React.memo(
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

    const updateField = useCallback(
      (index, key, val) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [key]: val };
        onChange(newFields);
      },
      [fields, onChange],
    );

    const addField = useCallback(() => {
      onChange([
        ...fields,
        {
          name: "",
          source: "text",
          selector: "",
          attribute: "",
          optional: false,
        },
      ]);
    }, [fields, onChange]);

    const removeField = useCallback(
      (index) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        onChange(newFields);
      },
      [fields, onChange],
    );

    return (
      <div className="space-y-3 mt-2 mb-2">
        <div className="flex justify-between items-center">
          <label className="text-[11px] uppercase tracking-[0.2em] font-black text-amber-400 ml-1 flex items-center gap-2">
            {t("nodes.config.extract_fields", "Fields to Extract")}
            {fields.length > 0 && (
              <span className="text-[9px] bg-amber-500/10 text-amber-500/70 px-1.5 py-0.5 rounded-full">
                {fields.length}
              </span>
            )}
          </label>
          <div className="group relative">
            <Info
              size={14}
              className="text-slate-500 hover:text-amber-400 cursor-help transition-colors"
            />
            <div className="absolute right-0 bottom-full mb-2 w-60 p-3 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl space-y-1">
              <p className="font-bold text-amber-400">How it works</p>
              <p>
                Each item matched by the root selector becomes a record. Fields
                are resolved relative to it: leave the selector empty to read
                from the item itself.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {fields.map((f, index) => (
            <ExtractFieldItem
              key={f.id ?? `field-${index}`}
              f={f}
              index={index}
              updateField={updateField}
              removeField={removeField}
              pickingField={pickingField}
              onStartPick={onStartPick}
              onCancelPick={onCancelPick}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addField}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-2 px-3",
            "border border-dashed border-amber-500/30 rounded-xl",
            "text-[10px] font-bold text-amber-500/80 uppercase tracking-wider",
            "hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-500 transition-all",
          )}
        >
          <Plus size={14} /> {t("nodes.config.add_field", "Add Field")}
        </button>
      </div>
    );
  },
);

ExtractFieldsEditor.displayName = "ExtractFieldsEditor";
export default ExtractFieldsEditor;
