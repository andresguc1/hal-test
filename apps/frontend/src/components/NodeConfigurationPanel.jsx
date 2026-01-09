// NodeConfigurationPanel.jsx - Refactored with MAREA Glass Overlay
import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Trash2,
  AlertCircle,
  Settings2,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "motion/react";
import { NODE_FIELD_CONFIGS } from "./hooks/constants";
// import { logger } from "../utils/logger"; // Unused
import { cn } from "@/lib/utils";

// ===============================================
// CUSTOM UI COMPONENTS (MAREA STYLE)
// ===============================================

const MareaLabel = ({ children, required }) => (
  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
    {children}
    {required && <span className="text-blue-400 ml-0.5">*</span>}
  </label>
);

const MareaInput = ({ className, error, ...props }) => (
  <input
    className={cn(
      "w-full bg-transparent border-b border-slate-700 text-slate-200 text-sm py-1 px-0",
      "focus:outline-none focus:border-blue-400 transition-colors placeholder:text-slate-600 rounded-none",
      error && "border-red-500 focus:border-red-500",
      className,
    )}
    {...props}
  />
);

const MareaSelect = ({ value, onChange, options, placeholder }) => (
  <div className="relative">
    <select
      value={value || ""}
      onChange={onChange}
      className="w-full bg-transparent border-b border-slate-700 text-slate-200 text-sm py-1 pr-6 pl-0 appearance-none focus:outline-none focus:border-blue-400 rounded-none cursor-pointer"
    >
      <option value="" disabled className="bg-slate-900 text-slate-500">
        {placeholder}
      </option>
      {options.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
          className="bg-slate-900 text-slate-200"
        >
          {opt.label}
        </option>
      ))}
    </select>
    <ChevronDown
      size={14}
      className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
    />
  </div>
);

const MareaSwitch = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cn(
      "relative w-8 h-4 rounded-full transition-colors duration-200",
      checked
        ? "bg-blue-500/50 border border-blue-400"
        : "bg-slate-800 border border-slate-700",
    )}
  >
    <div
      className={cn(
        "absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform duration-200 shadow-sm",
        checked ? "translate-x-4" : "translate-x-0",
      )}
    />
  </button>
);

// ===============================================
// MAIN COMPONENT
// ===============================================

export default function NodeConfigurationPanel({
  action,
  isVisible,
  onExecute,
  onClose,
  onDeleteNode,
  updateNodeConfiguration,
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (!action?.nodeId) {
      setFormData({});
      setErrors({});
      setIsDirty(false);
      return;
    }
    const currentData = action.currentData || {};
    const fields = NODE_FIELD_CONFIGS[action.type] || [];

    const initialData = {};
    if (fields.length === 0) {
      // Fallback or specific hardcoded nodes (like launch_browser which might not be config based yet)
      // For simplicity, copying raw data
      Object.assign(initialData, currentData);
    } else {
      fields.forEach((field) => {
        let value = currentData[field.name];
        if (
          (field.type === "text" || field.type === "args") &&
          Array.isArray(value)
        ) {
          value = value.join(" ");
        }
        initialData[field.name] =
          value ??
          field.defaultValue ??
          (field.type === "checkbox" ? false : "");
      });
    }

    setFormData(initialData);
    setErrors({});
    setIsDirty(false);
  }, [action?.nodeId, action?.type, action?.currentData]);

  // Validation logic (currently unused but kept for reference)
  /*
  const validateField = (fieldConfig, value) => {
    if (!fieldConfig) return null;
    if (
      fieldConfig.required &&
      (value === "" || value === undefined || value === null)
    ) {
      return `${t(`nodes.fields.${fieldConfig.name}`)} ${t("common.required_field")}`;
    }
    return null;
  }; 
  */

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    if (errors[name]) {
      setErrors((prev) => {
        const c = { ...prev };
        delete c[name];
        return c;
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    handleChange(name, newValue);
  };

  const handleSave = async () => {
    const normalized = { ...formData };
    // Number conversion logic here if needed
    if (updateNodeConfiguration && action?.nodeId) {
      updateNodeConfiguration(action.nodeId, normalized);
      setIsDirty(false);
    }
  };

  // Auto-save debounce
  useEffect(() => {
    if (!action?.nodeId || !isDirty) return;
    const timer = setTimeout(() => handleSave(), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, isDirty, action?.nodeId]);

  const renderField = (fieldConfig) => {
    // Conditional logic
    if (fieldConfig.conditional) {
      const { field, is } = fieldConfig.conditional;
      const dependentValue = formData[field];
      if (is === null && dependentValue) return null;
      if (is !== null && dependentValue !== is) return null;
    }

    const { name, type, placeholder, options } = fieldConfig;
    const value = formData[name];
    const error = errors[name];

    if (type === "select") {
      return (
        <div key={name} className="mb-5">
          <MareaLabel required={fieldConfig.required}>
            {t(`nodes.fields.${name}`, fieldConfig.label)}
          </MareaLabel>
          <MareaSelect
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            options={
              options?.map((o) => ({
                value: o.value,
                label: t(`nodes.options.${name}.${o.value}`, o.label),
              })) || []
            }
            placeholder={t("common.select_default")}
          />
          {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
        </div>
      );
    }

    if (type === "checkbox" || type === "boolean") {
      return (
        <div key={name} className="mb-5 flex items-center justify-between">
          <MareaLabel required={fieldConfig.required}>
            {t(`nodes.fields.${name}`, fieldConfig.label)}
          </MareaLabel>
          <MareaSwitch
            checked={!!value}
            onChange={(v) => handleChange(name, v)}
          />
        </div>
      );
    }

    if (type === "textarea") {
      return (
        <div key={name} className="mb-5">
          <MareaLabel required={fieldConfig.required}>
            {t(`nodes.fields.${name}`, fieldConfig.label)}
          </MareaLabel>
          <textarea
            name={name}
            value={value || ""}
            onChange={handleInputChange}
            placeholder={t(`nodes.placeholders.${name}`, placeholder)}
            rows={4}
            className={cn(
              "w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm p-2 rounded-md",
              "focus:outline-none focus:border-blue-400 transition-all font-mono placeholder:text-slate-600",
              error && "border-red-500",
            )}
          />
        </div>
      );
    }

    // Default Input
    return (
      <div key={name} className="mb-5">
        <MareaLabel required={fieldConfig.required}>
          {t(`nodes.fields.${name}`, fieldConfig.label)}
        </MareaLabel>
        <MareaInput
          type={type === "number" ? "number" : "text"}
          name={name}
          value={value || ""}
          onChange={handleInputChange}
          placeholder={t(`nodes.placeholders.${name}`, placeholder)}
          error={error}
        />
        {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isVisible && action && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            right: 0,
            top: "56px",
            bottom: 0,
            left: "auto",
            position: "fixed",
            height: "calc(100vh - 56px)",
          }} // Offset for Header (h-14 = 56px)
          className={cn(
            "w-[350px] h-screen z-[10000] flex flex-col pointer-events-auto", // Fixed Dimensions & Layering
            "bg-[#1e1e1e]", // Solid Dark Background
            "border-l border-[#444] shadow-2xl", // Left Border Separator
          )}
        >
          {/* Header */}
          <div className="h-14 shrink-0 border-b border-[#333] flex items-center justify-between px-4 bg-[#1e1e1e]">
            <div className="flex items-center gap-2 overflow-hidden">
              <Settings2 size={18} className="text-blue-400 shrink-0" />
              <span className="text-sm font-bold text-slate-200 uppercase tracking-wider truncate">
                {t(`nodes.labels.${action.type}`, action.type)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent flex flex-col gap-4 pb-24">
            {/* ID Display */}
            <div className="opacity-50 hover:opacity-100 transition-opacity">
              <label className="text-[10px] uppercase tracking-widest text-[#666] font-bold block mb-1">
                Node ID
              </label>
              <p className="font-mono text-[11px] text-[#888] select-all bg-black/20 p-1 rounded">
                {action.nodeId}
              </p>
            </div>

            <div className="h-px bg-[#333] w-full my-2" />

            {/* Fields */}
            {NODE_FIELD_CONFIGS[action.type] ? (
              NODE_FIELD_CONFIGS[action.type].map(renderField)
            ) : (
              <div className="text-xs text-slate-500 italic p-4 border border-dashed border-slate-700 rounded text-center">
                {t("nodes.config.no_configuration")}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[#333] bg-[#1e1e1e] flex gap-3">
            <button
              onClick={onExecute}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 rounded shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <Play size={14} fill="currentColor" />
              {t("common.test_node")}
            </button>
            <button
              onClick={() => {
                if (window.confirm(t("common.delete_confirm")))
                  onDeleteNode(action.nodeId);
              }}
              className="p-3 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded border border-slate-700 hover:border-red-800 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
