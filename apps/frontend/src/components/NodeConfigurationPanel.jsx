import React, { useMemo, useState, useCallback } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES, NODE_TYPE_MAP } from "@/config/nodeConstants";
import { api } from "../utils/api";
import EvidenceCard from "./EvidenceCard"; // New component import
import VariableInput from "./VariableInput";

const ConditionalBranchesEditor = ({ value, onChange, variables }) => {
  const { t } = useTranslation();
  const branches =
    Array.isArray(value) && value.length > 0
      ? value
      : [
          { id: "true", label: "True", expression: "" },
          { id: "false", label: "False", expression: "" },
        ];

  const updateBranch = (index, field, val) => {
    const newBranches = [...branches];
    newBranches[index] = { ...newBranches[index], [field]: val };
    onChange(newBranches);
  };

  const addBranch = () => {
    onChange([
      ...branches,
      { id: `branch_${Date.now()}`, label: "Nueva", expression: "" },
    ]);
  };

  const removeBranch = (index) => {
    if (branches.length <= 1) return; // Prevent deleting last
    const newBranches = [...branches];
    newBranches.splice(index, 1);
    onChange(newBranches);
  };

  return (
    <div className="space-y-4 mt-4 mb-2">
      <div className="flex justify-between items-center mb-1">
        <label className="text-[11px] uppercase tracking-[0.2em] font-black text-sky-400 ml-1 flex items-center gap-2">
          <Split size={14} />
          {t("nodes.config.branching_rules", "Reglas de Bifurcación")}
        </label>
        <div className="group relative">
          <Info
            size={14}
            className="text-slate-500 hover:text-sky-400 cursor-help transition-colors"
          />
          <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
            {t(
              "nodes.hints.conditional_logic",
              'La primera coincidencia detiene la evaluación. Deja vacío para "Si no..." (Else).',
            )}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {branches.map((branch, index) => {
          const isDefault = !branch.expression;
          const isTrue = branch.id === "true";
          const isFalse = branch.id === "false";

          return (
            <div
              key={index}
              className="px-4 py-4 bg-[#0f172a]/80 border border-sky-500/20 rounded-2xl space-y-3 relative group hover:border-sky-500/50 transition-all shadow-lg hover:shadow-sky-500/5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                      isTrue
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : isFalse
                          ? "bg-red-500/10 border-red-500/30 text-red-400"
                          : "bg-sky-500/10 border-sky-500/30 text-sky-400",
                    )}
                  >
                    {isTrue ? (
                      <CheckCircle2 size={16} />
                    ) : isFalse ? (
                      <XCircle size={16} />
                    ) : (
                      <GitBranch size={16} />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter block mb-0.5">
                      {index === 0 ? "IF (SI...)" : "ELSE IF (O SI...)"}
                    </span>
                    <input
                      type="text"
                      placeholder="Etiqueta (ej: Login Exitoso)"
                      value={branch.label}
                      onChange={(e) =>
                        updateBranch(index, "label", e.target.value)
                      }
                      className="w-full bg-transparent border-none p-0 text-xs font-bold text-white focus:outline-none placeholder:text-slate-600 focus:ring-0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-black/30 px-2 py-0.5 rounded border border-white/5 text-[9px] font-mono text-slate-400">
                    ID: {branch.id}
                  </div>
                  <button
                    onClick={() => removeBranch(index)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Eliminar Ruta"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="relative">
                <VariableInput
                  value={branch.expression || ""}
                  variables={variables}
                  placeholder={t(
                    "nodes.placeholders.condition_expression",
                    "Ex: ${status} === 200 (Vacío = Default)",
                  )}
                  onChange={(e) =>
                    updateBranch(index, "expression", e.target.value)
                  }
                  className="bg-black/40 border-sky-500/20 focus:border-sky-500/50 min-h-[38px] text-[11px] py-2"
                />
                {isDefault && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded text-[9px] font-black text-sky-400 pointer-events-none uppercase tracking-widest">
                    <Zap size={10} fill="currentColor" />
                    DEFAULT
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={addBranch}
        className="w-full py-3 bg-sky-500/5 hover:bg-sky-500/10 border border-dashed border-sky-500/30 rounded-2xl text-[11px] font-black uppercase tracking-widest text-sky-400 flex items-center justify-center gap-3 mt-4 transition-all hover:border-sky-500/60 active:scale-95 group"
      >
        <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center group-hover:bg-sky-500/40 transition-colors">
          <GitBranch size={12} />
        </span>
        {t("nodes.config.add_branch", "Agregar Nueva Regla")}
      </button>
    </div>
  );
};

const SwitchCasesEditor = ({ value, onChange, _variables }) => {
  const { t } = useTranslation();
  const cases = Array.isArray(value) ? value : [];

  const updateCase = (index, field, val) => {
    const newCases = [...cases];
    newCases[index] = { ...newCases[index], [field]: val };
    onChange(newCases);
  };

  const addCase = () => {
    const id = `case_${Date.now()}`;
    onChange([...cases, { id, value: "", label: "" }]);
  };

  const removeCase = (index) => {
    const newCases = [...cases];
    newCases.splice(index, 1);
    onChange(newCases);
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
        {cases.map((c, index) => (
          <div
            key={index}
            className="px-3 py-3 bg-[#0f172a]/60 border border-indigo-500/20 rounded-xl space-y-2 relative group hover:border-indigo-500/40 transition-all shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <CornerDownRight size={12} className="text-indigo-400" />
                </div>
                <input
                  type="text"
                  placeholder={t(
                    "nodes.placeholders.switch_value",
                    "Valor (ej: admin, true, 200)",
                  )}
                  value={c.value}
                  onChange={(e) => updateCase(index, "value", e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs font-bold text-white focus:outline-none placeholder:text-slate-600 focus:ring-0"
                />
              </div>
              <button
                onClick={() => removeCase(index)}
                className="p-1 text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="flex items-center gap-2 pl-8 border-t border-white/5 pt-2">
              <input
                type="text"
                placeholder={t(
                  "common.optional_label",
                  "Etiqueta visible (opcional)",
                )}
                value={c.label}
                onChange={(e) => updateCase(index, "label", e.target.value)}
                className="w-full bg-transparent border-none p-0 text-[10px] font-medium text-slate-400 focus:outline-none placeholder:text-slate-700 focus:ring-0"
              />
              <div className="bg-black/30 px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-500 shrink-0">
                ID: {c.id}
              </div>
            </div>
          </div>
        ))}
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
};

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
            key={index}
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

// --- CONFIGURATION SCHEMA ---
// Defines available input fields for each node type
const NODE_INPUTS = {
  // Browser
  open_url: [
    {
      key: "url",
      label: "URL",
      type: "text",
      placeholder: "https://example.com",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  launch_browser: [
    { key: "headless", label: "Headless Mode", type: "checkbox" },
    {
      key: "devicePreset",
      label: "📱 Device Template",
      type: "select",
      options: [
        { label: "🖥️ Desktop (1280x720)", value: "Desktop" },
        { label: "📱 iPhone SE", value: "iPhone SE" },
        { label: "📱 iPhone XR", value: "iPhone XR" },
        { label: "📱 iPhone 12 Pro", value: "iPhone 12 Pro" },
        { label: "📱 iPhone 14 Pro Max", value: "iPhone 14 Pro Max" },
        { label: "📱 Pixel 7", value: "Pixel 7" },
        { label: "📱 Samsung Galaxy S22", value: "Samsung Galaxy S22" },
        {
          label: "📱 Samsung Galaxy S20 Ultra",
          value: "Samsung Galaxy S20 Ultra",
        },
        { label: "📟 iPad Mini", value: "iPad Mini" },
        { label: "📟 iPad Air", value: "iPad Air" },
        { label: "📟 iPad Pro", value: "iPad Pro" },
        { label: "📟 Tablet (Generic)", value: "Tablet" },
        { label: "⚙️ Custom Size", value: "Custom" },
      ],
      default: "Desktop",
    },
    { key: "slowMo", label: "Slow Mo (ms)", type: "number", placeholder: "50" },
    {
      key: "recordVideo",
      label: "📹 Record Video",
      type: "checkbox",
      defaultValue: true,
    },
    {
      key: "args",
      label: "Extra Browser Arguments",
      type: "text",
      placeholder: "--enable-logging --v=1",
    },
    { key: "maximizeWindow", label: "Maximize Window", type: "checkbox" },
    {
      key: "width",
      label: "Viewport Width",
      type: "number",
      placeholder: "1280",
      isVisible: (data) =>
        !data.maximizeWindow && data.devicePreset === "Custom",
    },
    {
      key: "height",
      label: "Viewport Height",
      type: "number",
      placeholder: "720",
      isVisible: (data) =>
        !data.maximizeWindow && data.devicePreset === "Custom",
    },
    {
      key: "isMobile",
      label: "📱 Is Mobile Simulation",
      type: "checkbox",
      isVisible: (data) =>
        !data.maximizeWindow && data.devicePreset === "Custom",
    },
    {
      key: "hasTouch",
      label: "👆 Enable Touch Support",
      type: "checkbox",
      isVisible: (data) =>
        !data.maximizeWindow && data.devicePreset === "Custom",
    },
    {
      key: "networkProfile",
      label: "Initial Throttling Profile",
      type: "select",
      options: [
        { label: "No throttling", value: "No throttling" },
        { label: "WiFi fast", value: "WiFi fast" },
        { label: "WiFi slow", value: "WiFi slow" },
        { label: "4G", value: "4G" },
        { label: "Fast 3G", value: "Fast 3G" },
        { label: "Slow 3G", value: "Slow 3G" },
        { label: "2G", value: "2G" },
        { label: "High Latency", value: "High Latency" },
        { label: "Custom", value: "Custom" },
        { label: "Offline", value: "Offline" },
      ],
      default: "No throttling",
    },
    {
      key: "offline",
      label: "Offline Mode",
      type: "checkbox",
      isVisible: (data) => data.networkProfile === "Custom",
    },
    {
      key: "latency",
      label: "Start-up Latency (ms)",
      type: "number",
      placeholder: "e.g. 150",
      isVisible: (data) => data.networkProfile === "Custom",
    },
    {
      key: "downloadThroughput",
      label: "Download (Kbps)",
      type: "number",
      placeholder: "e.g. 1600",
      isVisible: (data) => data.networkProfile === "Custom",
    },
    {
      key: "uploadThroughput",
      label: "Upload (Kbps)",
      type: "number",
      placeholder: "e.g. 750",
      isVisible: (data) => data.networkProfile === "Custom",
    },
  ],
  resize_viewport: [
    {
      key: "devicePreset",
      label: "📱 Device Template",
      type: "select",
      options: [
        { label: "🖥️ Desktop (1280x720)", value: "Desktop" },
        { label: "📱 iPhone SE", value: "iPhone SE" },
        { label: "📱 iPhone XR", value: "iPhone XR" },
        { label: "📱 iPhone 12 Pro", value: "iPhone 12 Pro" },
        { label: "📱 iPhone 14 Pro Max", value: "iPhone 14 Pro Max" },
        { label: "📱 Pixel 7", value: "Pixel 7" },
        { label: "📱 Samsung Galaxy S22", value: "Samsung Galaxy S22" },
        {
          label: "📱 Samsung Galaxy S20 Ultra",
          value: "Samsung Galaxy S20 Ultra",
        },
        { label: "📟 iPad Mini", value: "iPad Mini" },
        { label: "📟 iPad Air", value: "iPad Air" },
        { label: "📟 iPad Pro", value: "iPad Pro" },
        { label: "📟 Tablet (Generic)", value: "Tablet" },
        { label: "⚙️ Custom Size", value: "Custom" },
      ],
      default: "Custom",
    },
    {
      key: "width",
      label: "Width (px)",
      type: "number",
      placeholder: "1280",
      isVisible: (data) => !data.devicePreset || data.devicePreset === "Custom",
    },
    {
      key: "height",
      label: "Height (px)",
      type: "number",
      placeholder: "720",
      isVisible: (data) => !data.devicePreset || data.devicePreset === "Custom",
    },
  ],

  find_element: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".my-element",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  // User Actions
  click: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".btn-primary",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  type_text: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: "input[name='q']",
    },
    {
      key: "text",
      label: "Text to Type",
      type: "text",
      placeholder: "Hello World",
      required: true, // Marked as required
    },
    { key: "delay", label: "Delay (ms)", type: "number", placeholder: "0" },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  hover: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".menu-item",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],

  // Sync
  check: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".checkbox",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  uncheck: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".checkbox",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],

  pause: [
    {
      key: "duration",
      label: "Duration (ms)",
      type: "number",
      placeholder: "1000",
    },
  ],
  wait_for_element: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".element",
    },
    {
      key: "condition",
      label: "Condition",
      type: "select",
      options: [
        { label: "Visible", value: "visible" },
        { label: "Hidden", value: "hidden" },
        { label: "Attached (Exist)", value: "attached" },
        { label: "Detached (Removed)", value: "detached" },
      ],
      required: true,
    },
    {
      key: "scrollIntoView",
      label: "Scroll into view?",
      type: "checkbox",
      default: false,
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],

  // Diagnostics
  take_screenshot: [
    {
      key: "selector",
      label: "Selector (Optional)",
      type: "selector",
      placeholder: ".element-to-capture",
    },
    { key: "fullPage", label: "Full Page", type: "checkbox" },
    {
      key: "format",
      label: "Format",
      type: "select",
      options: [
        { label: "PNG", value: "png" },
        { label: "JPEG", value: "jpeg" },
      ],
    },
    {
      key: "quality",
      label: "Quality (JPEG only)",
      type: "number",
      placeholder: "100",
    },
    {
      key: "path",
      label: "Filename (Optional)",
      type: "text",
      placeholder: "screenshot.png",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
  ],

  // Browser Management
  manage_tabs: [
    {
      key: "action",
      label: "Action",
      type: "select",
      options: [
        { label: "New Tab", value: "new" },
        { label: "Switch Tab", value: "switch" },
        { label: "Close Tab", value: "close" },
        { label: "List Tabs", value: "list" },
      ],
      required: true,
    },
    {
      key: "url",
      label: "URL (for New Tab)",
      type: "text",
      placeholder: "https://example.com",
    },
    {
      key: "tabIndex",
      label: "Tab Index (for Switch)",
      type: "number",
      placeholder: "0",
    },
  ],

  // User Actions (Extended)
  select_option: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: "select#country",
    },
    {
      key: "selectionValue",
      label: "Value / Label / Index",
      type: "text",
      placeholder: "US",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  scroll: [
    {
      key: "selector",
      label: "Container Selector (Optional)",
      type: "selector",
      placeholder: "body or .scrollable-div",
    },
    {
      key: "scrollToEnd",
      label: "Scroll to Bottom (Infinite)",
      type: "checkbox",
    },
    {
      key: "direction",
      label: "Direction",
      type: "select",
      options: [
        { label: "Down", value: "down" },
        { label: "Up", value: "up" },
        { label: "Right", value: "right" },
        { label: "Left", value: "left" },
      ],
      required: true,
      isVisible: (config) => !config.scrollToEnd,
    },
    {
      key: "amount",
      label: "Pixels Amount",
      type: "number",
      placeholder: "500",
      isVisible: (config) => !config.scrollToEnd,
    },
    {
      key: "maxScrolls",
      label: "Max Scroll Attempts",
      type: "number",
      placeholder: "50",
      isVisible: (config) => config.scrollToEnd === true,
    },
    {
      key: "waitTime",
      label: "Wait Between Scrolls (ms)",
      type: "number",
      placeholder: "2000",
      isVisible: (config) => config.scrollToEnd === true,
    },
    {
      key: "behavior",
      label: "Behavior",
      type: "select",
      options: [
        { label: "Smooth", value: "smooth" },
        { label: "Instant (Auto)", value: "auto" },
      ],
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  drag_drop: [
    {
      key: "sourceSelector",
      label: "Source (Drag)",
      type: "selector",
      placeholder: "#item-1",
      required: true,
    },
    {
      key: "targetSelector",
      label: "Target (Drop)",
      type: "selector",
      placeholder: "#bin",
      required: true,
    },
    {
      key: "steps",
      label: "Animation Steps",
      type: "number",
      placeholder: "10",
    },
    {
      key: "force",
      label: "Force Action (Skip Checks)",
      type: "checkbox",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  upload_file: [
    {
      key: "selector",
      label: "Input Selector",
      type: "selector",
      placeholder: "input[type='file']",
    },
    {
      key: "files",
      label: "File Paths (Comma-separated)",
      type: "text",
      placeholder: "file1.png, file2.png",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  read_file: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".element-to-read",
    },
    {
      key: "type",
      label: "Content Type",
      type: "select",
      options: [
        { label: "Text", value: "text" },
        { label: "HTML", value: "html" },
      ],
      default: "text",
    },
    {
      key: "variableName",
      label: "Variable Name",
      type: "text",
      placeholder: "e.g. extractedText",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
  ],
  write_file: [
    {
      key: "path",
      label: "Save Path",
      type: "text",
      placeholder: "./output/results.json",
      required: true,
    },
    {
      key: "data",
      label: "Data / Content",
      type: "textarea",
      placeholder: "Content or {{variable}}",
      required: true,
    },
    {
      key: "variableName",
      label: "Capture Saved Path (Variable Name)",
      type: "text",
      placeholder: "e.g. logPath",
    },
  ],
  download_file: [
    {
      key: "selector",
      label: "Download Button Selector",
      type: "selector",
      placeholder: ".download-btn",
      required: true,
    },
    {
      key: "path",
      label: "Save Path",
      type: "text",
      placeholder: "./downloads/report.pdf",
      required: true,
    },
    {
      key: "variableName",
      label: "Capture Download Path (Variable Name)",
      type: "text",
      placeholder: "e.g. downloadPath",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
  ],
  submit_form: [
    {
      key: "selector",
      label: "Form Selector",
      type: "selector",
      placeholder: "form#login",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],

  // Code & DOM
  execute_js: [
    {
      key: "script",
      label: "JavaScript Script",
      type: "textarea",
      placeholder: "// Your script here\nreturn document.title;",
      required: true,
    },
    {
      key: "returnValue",
      label: "Capture Result?",
      type: "checkbox",
    },
    {
      key: "variableName",
      label: "Variable Name",
      type: "text",
      placeholder: "resultVariableName",
      isVisible: (config) => config.returnValue === true,
      required: true,
    },
    {
      key: "args",
      label: "Arguments (JSON)",
      type: "text",
      placeholder: '{"key": "value"}',
    },
  ],
  get_set_content: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: ".element",
    },
    {
      key: "action",
      label: "Action",
      type: "select",
      options: [
        { label: "Get", value: "get" },
        { label: "Set", value: "set" },
      ],
      required: true,
    },
    {
      key: "contentType",
      label: "Content Type",
      type: "select",
      options: [
        { label: "Text", value: "text" },
        { label: "HTML", value: "html" },
        { label: "Value", value: "value" },
        { label: "Attribute", value: "attribute" },
      ],
      required: true,
    },
    {
      key: "attribute",
      label: "Attribute Name",
      type: "text",
      placeholder: "href",
      isVisible: (config) => config.contentType === "attribute",
    },
    {
      key: "value",
      label: "Value to Set",
      type: "text",
      placeholder: "New value...",
      isVisible: (config) => config.action === "set",
    },
    {
      key: "clearBeforeSet",
      label: "Clear before setting",
      type: "checkbox",
      isVisible: (config) =>
        config.action === "set" && config.contentType === "value",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  save_dom: [
    {
      key: "selector",
      label: "Selector (Optional)",
      type: "selector",
      placeholder: "body",
    },
    {
      key: "path",
      label: "File Path",
      type: "text",
      placeholder: "page.html",
    },
    {
      key: "variableName",
      label: "Variable Name",
      type: "text",
      placeholder: "domContent",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "30000",
    },
    {
      key: "takeScreenshot",
      label: "📸 Take Screenshot",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  log_errors: [
    {
      key: "enable",
      label: "Enable Console Logging",
      type: "checkbox",
      defaultValue: true,
    },
    {
      key: "logToFile",
      label: "Log to File",
      type: "checkbox",
      defaultValue: false,
    },
    {
      key: "filePath",
      label: "Log File Path (Optional)",
      type: "text",
      placeholder: "logs/browser_errors.log",
      isVisible: (config) => config.logToFile,
    },
  ],
  listen_events: [
    {
      key: "eventType",
      label: "Event Type",
      type: "select",
      options: [
        { label: "Click", value: "click" },
        { label: "Input / Typed", value: "input" },
        { label: "Change", value: "change" },
        { label: "Submit", value: "submit" },
        { label: "Dialog (Alert/Confirm)", value: "dialog" },
        { label: "Network Request", value: "request" },
        { label: "Network Response", value: "response" },
        { label: "Console Message", value: "console" },
      ],
      required: true,
    },
    {
      key: "selector",
      label: "Selector (Optional for DOM events)",
      type: "selector",
      placeholder: ".btn-to-watch",
      isVisible: (config) =>
        config &&
        ["click", "input", "change", "submit"].includes(config.eventType),
    },
    {
      key: "urlPattern",
      label: "URL Pattern (Glob/Regex)",
      type: "text",
      placeholder: "**/api/v1/*",
      isVisible: (config) =>
        config && ["request", "response"].includes(config.eventType),
    },
    {
      key: "method",
      label: "HTTP Method",
      type: "select",
      options: [
        { label: "All", value: "" },
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
      ],
      isVisible: (config) => ["request", "response"].includes(config.eventType),
    },
    {
      key: "timeout",
      label: "Listening Timeout (ms, 0 = indefinite)",
      type: "number",
      placeholder: "0",
    },
    {
      key: "logToFile",
      label: "Log to File",
      type: "checkbox",
      defaultValue: false,
    },
    {
      key: "filePath",
      label: "Log File Path",
      type: "text",
      placeholder: "logs/events.jsonl",
      isVisible: (config) => config.logToFile,
      required: true,
    },
  ],

  // AI
  // ⚠️ These are the ONLY node types that produce AI result data for the Result panel.
  call_llm: [
    {
      key: "prompt",
      label: "Prompt",
      type: "textarea",
      placeholder: "IA Instruction...",
    },
    {
      key: "system",
      label: "System Prompt",
      type: "textarea",
      placeholder: "Optional: System behavior",
    },
    {
      key: "variableName",
      label: "Variable Name",
      type: "text",
      defaultValue: "llmResult",
    },
    {
      key: "maxTokens",
      label: "Token Limit",
      type: "number",
      defaultValue: 2048,
    },
  ],
  generate_data: [
    {
      key: "description",
      label: "Data Description",
      type: "textarea",
      placeholder:
        "Describe the structured data you want to generate (e.g., 'Generate 5 users').",
    },
    {
      key: "expectedFormat",
      label: "Format",
      type: "select",
      options: [
        { label: "JSON", value: "json" },
        { label: "CSV", value: "csv" },
        { label: "Text", value: "text" },
      ],
      default: "json",
    },
    {
      key: "count",
      label: "Quantity",
      type: "number",
      defaultValue: 1,
    },
    {
      key: "variableName",
      label: "Output Variable",
      type: "text",
      defaultValue: "generatedData",
    },
    {
      key: "maxTokens",
      label: "Token Limit",
      type: "number",
      defaultValue: 2048,
      placeholder: "2048",
    },
  ],
  validate_semantic: [
    {
      key: "sourceTextVariable",
      label: "Source Text Variable",
      type: "text",
      placeholder: "${myText}",
    },
    {
      key: "validationPrompt",
      label: "Validation Prompt",
      type: "textarea",
      placeholder: "Does the text contain grammatical errors?",
    },
    {
      key: "expectedAnswer",
      label: "Expected Answer",
      type: "text",
      placeholder: "true / false",
    },
    {
      key: "variableName",
      label: "Variable Name",
      type: "text",
      defaultValue: "semanticValid",
    },
    {
      key: "maxTokens",
      label: "Token Limit",
      type: "number",
      defaultValue: 2048,
    },
  ],

  extract_dom_context: [
    {
      key: "selector",
      label: "Selector (Optional)",
      type: "selector",
      placeholder: "e.g. #content or .article-body",
    },
    {
      key: "extractionType",
      label: "Extraction Type",
      type: "select",
      options: [
        { label: "Text Only", value: "text" },
        { label: "Full HTML", value: "html" },
        { label: "Markdown", value: "markdown" },
      ],
      default: "text",
    },
    {
      key: "variableName",
      label: "Variable Name",
      type: "text",
      defaultValue: "domContext",
    },
    {
      key: "maxTokens",
      label: "Token Limit",
      type: "number",
      defaultValue: 2048,
    },
  ],
  chain_of_thought: [
    {
      key: "instruction",
      label: "Instruction / Question",
      type: "textarea",
      placeholder: "Describe the complex task the IA should reason about...",
    },
    {
      key: "thoughtVariable",
      label: "Thought Variable",
      type: "text",
      defaultValue: "aiThought",
    },
    {
      key: "answerVariable",
      label: "Final Answer Variable",
      type: "text",
      defaultValue: "aiAnswer",
    },
    {
      key: "maxTokens",
      label: "Token Limit",
      type: "number",
      defaultValue: 2048,
    },
  ],
  smart_selector: [
    {
      key: "originalSelector",
      label: "Original Selector (Failed)",
      type: "selector",
      placeholder: "e.g. button#submit",
    },
    {
      key: "intent",
      label: "Intent / Goal",
      type: "text",
      placeholder: "e.g. Click on the login button",
    },
    {
      key: "variableName",
      label: "Variable Name",
      type: "text",
      defaultValue: "suggestedSelector",
    },
    {
      key: "maxTokens",
      label: "Token Limit",
      type: "number",
      defaultValue: 2048,
    },
  ],

  // Sync (Extended)
  wait_navigation: [
    {
      key: "url",
      label: "Target URL / Pattern (Optional)",
      type: "text",
      placeholder: "**/success",
    },
    {
      key: "waitUntil",
      label: "Wait Until",
      type: "select",
      options: [
        { label: "Load", value: "load" },
        { label: "DOM Content Loaded", value: "domcontentloaded" },
        { label: "Network Idle", value: "networkidle" },
      ],
      required: true,
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      default: 30000,
    },
  ],
  wait_network: [
    {
      key: "idleTime",
      label: "Idle Time (ms)",
      type: "number",
      placeholder: "500",
    },
  ],
  wait_conditional: [
    {
      key: "waitType",
      label: "Wait For",
      type: "select",
      options: [
        { label: "🌐 Browser Expression (JS)", value: "browser" },
        { label: "🧠 Variable Condition", value: "variable" },
      ],
      default: "browser",
    },
    {
      key: "expression",
      label: "Condition (JS or JSON)",
      type: "textarea",
      placeholder:
        'browser: window.ready === true\nvariable: {"left": "${status}", "operator": "===", "right": "complete"}',
      required: true,
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      default: 30000,
    },
    {
      key: "polling",
      label: "Polling Interval (ms)",
      type: "number",
      default: 100,
      isVisible: (data) => data.waitType === "browser",
    },
  ],

  // Network
  // Network Consolidated
  configure_route: [
    {
      key: "urlPattern",
      label: "URL Pattern",
      type: "text",
      placeholder: "**/api/*",
      required: true,
    },
    {
      key: "routeAction",
      label: "Action",
      type: "select",
      options: [
        { label: "Block Request (Abort)", value: "abort" },
        { label: "Mock Response", value: "mock" },
        { label: "Modify Headers", value: "modify_headers" },
        { label: "Log Only", value: "log" },
      ],
      default: "abort",
      required: true,
    },
    {
      key: "method",
      label: "Method Filter (Optional)",
      type: "select",
      options: [
        { label: "Any", value: "ALL" },
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
      ],
    },
    {
      key: "statusCode",
      label: "Mock Status",
      type: "number",
      default: 200,
      isVisible: (data) => data.routeAction === "mock",
    },
    {
      key: "responseBody",
      label: "Mock Body (JSON/Text)",
      type: "textarea",
      placeholder: '{"success": true}',
      isVisible: (data) => data.routeAction === "mock",
    },
    {
      key: "headers",
      label: "Headers (JSON)",
      type: "textarea",
      placeholder: '{"Content-Type": "application/json"}',
      isVisible: (data) =>
        data.routeAction === "mock" || data.routeAction === "modify_headers",
    },
  ],

  wait_network_match: [
    {
      key: "urlPattern",
      label: "URL Pattern",
      type: "text",
      placeholder: "**/api/success",
      required: true,
    },
    {
      key: "type",
      label: "Wait For",
      type: "select",
      options: [
        { label: "Response (Complete)", value: "response" },
        { label: "Request (Sent)", value: "request" },
      ],
      default: "response",
    },
    {
      key: "method",
      label: "Method Filter (Optional)",
      type: "select",
      options: [
        { label: "Any", value: "ALL" },
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
      ],
    },
    {
      key: "statusCode",
      label: "Expected Status",
      type: "number",
      placeholder: "e.g. 200",
      isVisible: (data) => data.type === "response",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      default: 30000,
    },
  ],

  manage_session: [
    {
      key: "target",
      label: "Target",
      type: "select",
      options: [
        { label: "Cookie", value: "cookie" },
        { label: "Local Storage", value: "local_storage" },
        { label: "Session Storage", value: "session_storage" },
        { label: "HTTP Header", value: "header" },
        { label: "Query Param", value: "query" },
      ],
      default: "cookie",
      required: true,
    },
    {
      key: "action",
      label: "Action",
      type: "select",
      options: [
        { label: "Get", value: "get" },
        { label: "Set", value: "set" },
        { label: "Delete", value: "delete" },
        { label: "Clear All", value: "clear" },
      ],
      default: "get",
      required: true,
    },
    {
      key: "key",
      label: "Key / Name",
      type: "text",
      placeholder: "e.g. auth_token",
      isVisible: (data) =>
        data && ["get", "set", "delete"].includes(data.action),
      required: true,
    },
    {
      key: "value",
      label: "Value",
      type: "textarea",
      placeholder: "Enter value or {{variable}}",
      isVisible: (data) => data.action === "set",
      required: true,
    },
    {
      key: "variableName",
      label: "Save to Variable",
      type: "text",
      placeholder: "e.g. my_token",
      isVisible: (data) => data.action === "get",
      required: true,
    },
  ],

  set_network_conditions: [
    {
      key: "profile",
      label: "Throttling Profile",
      type: "select",
      options: [
        { label: "No throttling", value: "No throttling" },
        { label: "WiFi fast", value: "WiFi fast" },
        { label: "WiFi slow", value: "WiFi slow" },
        { label: "4G", value: "4G" },
        { label: "Fast 3G", value: "Fast 3G" },
        { label: "Slow 3G", value: "Slow 3G" },
        { label: "2G", value: "2G" },
        { label: "High Latency", value: "High Latency" },
        { label: "Custom", value: "Custom" },
        { label: "Offline", value: "Offline" },
      ],
      default: "No throttling",
      required: true,
    },
    {
      key: "offline",
      label: "Offline Mode",
      type: "checkbox",
      isVisible: (data) => data.profile === "Custom",
    },
    {
      key: "latency",
      label: "Latency (ms)",
      type: "number",
      placeholder: "e.g. 150",
      isVisible: (data) => data.profile === "Custom",
    },
    {
      key: "downloadThroughput",
      label: "Download (Kbps)",
      type: "number",
      placeholder: "e.g. 1600",
      isVisible: (data) => data.profile === "Custom",
    },
    {
      key: "uploadThroughput",
      label: "Upload (Kbps)",
      type: "number",
      placeholder: "e.g. 750",
      isVisible: (data) => data.profile === "Custom",
    },
  ],

  variable: [
    {
      key: "operation",
      label: "Operation",
      type: "select",
      options: [
        { value: "set", label: "Set" },
        { value: "get", label: "Get" },
        { value: "increment", label: "Increment" },
        { value: "push", label: "Push" },
      ],
      default: "set",
      required: true,
    },
    {
      key: "name",
      label: "Variable Name",
      type: "text",
      placeholder: "counter",
      required: true,
    },
    {
      key: "value",
      label: "Value",
      type: "textarea",
      placeholder: "42 or [1,2,3]",
      isVisible: (data) =>
        data && ["set", "increment", "push"].includes(data.operation),
    },
    {
      key: "scope",
      label: "Scope",
      type: "select",
      options: [
        { value: "flow", label: "Flow" },
        { value: "global", label: "Global" },
      ],
      default: "flow",
      required: true,
    },
  ],

  conditional: [
    {
      key: "branches",
      label: "Branches",
      type: "conditional_branches", // Custom type for rendering
      required: true,
    },
    // Keep legacy fallback input just in case for older nodes, but mostly hidden
    {
      key: "fallbackPath",
      label: "Fallback Destination ID",
      type: "text",
      placeholder: "false",
      default: "false",
      required: false,
    },
  ],

  switch: [
    {
      key: "variableName",
      label: "Variable to Evaluate",
      type: "text",
      placeholder: "status",
      required: true,
    },
    {
      key: "cases",
      label: "Switch Cases",
      type: "switch_cases",
      required: true,
    },
    {
      key: "scope",
      label: "Variable Scope",
      type: "select",
      options: [
        { value: "flow", label: "Flow" },
        { value: "global", label: "Global" },
      ],
      default: "flow",
    },
  ],

  loop: [
    {
      key: "mode",
      label: "Loop Mode",
      type: "select",
      options: [
        { value: "count", label: "Fixed Count (Repetir N veces)" },
        { value: "while", label: "While Condition (Mientras se cumpla)" },
        { value: "forEach", label: "ForEach Item (Para cada elemento)" },
      ],
      default: "count",
      required: true,
    },
    {
      key: "iterations",
      label: "Iterations",
      type: "number",
      placeholder: "10",
      isVisible: (data) => data.mode === "count",
    },
    {
      key: "condition",
      label: "While Condition",
      type: "textarea",
      placeholder: "${counter} < 100",
      isVisible: (data) => data.mode === "while",
    },
    {
      key: "array",
      label: "Array Variable",
      type: "text",
      placeholder: "${items}",
      isVisible: (data) => data.mode === "forEach",
    },
    {
      key: "itemVar",
      label: "Item Var Name",
      type: "text",
      placeholder: "currentItem",
      isVisible: (data) => data.mode === "forEach",
    },
    {
      key: "maxIterations",
      label: "Max Iterations",
      type: "number",
      default: 1000,
    },
  ],

  branch: [
    {
      key: "mode",
      label: "Execution Mode",
      type: "select",
      options: [
        { value: "parallel", label: "Parallel" },
        { value: "sequential", label: "Sequential" },
        { value: "race", label: "Race" },
      ],
      default: "sequential",
      required: true,
      hint: "branch_mode",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      default: 30000,
    },
  ],

  flow_control: [
    {
      key: "action",
      label: "Control Action",
      type: "select",
      options: [
        { value: "break", label: "Break" },
        { value: "continue", label: "Continue" },
        { value: "return", label: "Return" },
      ],
      required: true,
      hint: "flow_control_action",
    },
    {
      key: "returnValue",
      label: "Return Value (JSON)",
      type: "textarea",
      placeholder: '{"status": "success"}',
      isVisible: (data) => data.action === "return",
    },
  ],

  transform: [
    {
      key: "operation",
      label: "Transform Operation",
      type: "select",
      options: [
        { value: "map", label: "Map" },
        { value: "filter", label: "Filter" },
        { value: "reduce", label: "Reduce" },
        { value: "merge", label: "Merge" },
      ],
      default: "map",
      required: true,
      hint: "transform_logic",
    },
    {
      key: "input",
      label: "Input Array",
      type: "text",
      placeholder: "${items}",
      required: true,
    },
    {
      key: "expression",
      label: "Expression",
      type: "textarea",
      placeholder: "item.price * 1.1",
      isVisible: (data) =>
        data && ["map", "filter", "reduce"].includes(data.operation),
    },
    {
      key: "mergeWith",
      label: "Merge With Array",
      type: "text",
      placeholder: "${otherItems}",
      isVisible: (data) => data.operation === "merge",
    },
    {
      key: "outputVar",
      label: "Output Variable",
      type: "text",
      placeholder: "processedItems",
      required: true,
    },
  ],

  cli_params: [
    {
      key: "paramName",
      label: "Parameter Name",
      type: "text",
      placeholder: "--targetEnv",
      required: true,
    },
    {
      key: "paramType",
      label: "Parameter Type",
      type: "select",
      options: [
        { label: "string", value: "string" },
        { label: "number", value: "number" },
        { label: "boolean", value: "boolean" },
        { label: "json", value: "json" },
      ],
      default: "string",
    },
    {
      key: "defaultValue",
      label: "Default Value",
      type: "text",
      placeholder: "default_value",
    },
    {
      key: "required",
      label: "Required",
      type: "checkbox",
      default: true,
    },
    {
      key: "validationCode",
      label: "Validation Code (JS)",
      type: "textarea",
      placeholder: "if (value !== 'dev') throw new Error('invalid');",
    },
  ],

  return_code: [
    {
      key: "successField",
      label: "Success Field",
      type: "text",
      placeholder: "success",
      required: true,
    },
    {
      key: "exitOnFail",
      label: "Exit on Failure",
      type: "checkbox",
      default: true,
    },
    {
      key: "customCodes",
      label: "Custom Codes (JSON)",
      type: "textarea",
      placeholder: '{ "success": 0, "failed": 1 }',
    },
    {
      key: "verbose",
      label: "Verbose Logs",
      type: "checkbox",
      default: true,
    },
  ],

  integrate_ci: [
    {
      key: "provider",
      label: "CI Provider",
      type: "select",
      options: [
        { label: "GitLab", value: "gitlab" },
        { label: "GitHub", value: "github" },
        { label: "Jenkins", value: "jenkins" },
        { label: "Bitbucket", value: "bitbucket" },
      ],
      default: "gitlab",
      required: true,
    },
    {
      key: "saveArtifacts",
      label: "Save Artifacts",
      type: "checkbox",
      default: true,
    },
    {
      key: "outputPath",
      label: "Output Path",
      type: "text",
      placeholder: "gitlab-artifacts",
    },
    {
      key: "uploadReports",
      label: "Upload Reports",
      type: "checkbox",
      default: false,
    },
    {
      key: "envVariables",
      label: "Env Variables (JSON)",
      type: "textarea",
      placeholder: '{ "VAR": "value" }',
    },
    {
      key: "retryOnFail",
      label: "Retry on Failure",
      type: "number",
      placeholder: "0",
    },
    {
      key: "verbose",
      label: "Verbose Logs",
      type: "checkbox",
      default: true,
    },
  ],

  run_tests: [
    {
      key: "testSuite",
      label: "Test Suite Path",
      type: "text",
      placeholder: "tests/",
      required: true,
    },
    {
      key: "parallel",
      label: "Run Parallel",
      type: "checkbox",
      default: true,
    },
    {
      key: "retries",
      label: "Retries",
      type: "number",
      placeholder: "0",
    },
    {
      key: "reportFormat",
      label: "Report Format",
      type: "select",
      options: [
        { label: "JUnit", value: "junit" },
        { label: "HTML", value: "html" },
        { label: "JSON", value: "json" },
      ],
      default: "junit",
    },
    {
      key: "timeout",
      label: "Timeout (ms)",
      type: "number",
      placeholder: "900000",
    },
  ],

  component: [
    {
      key: "flowId",
      label: "Subflow to Execute",
      type: "text",
      placeholder: "Enter Flow ID",
      required: true,
      hint: "component_flow_id",
    },
    {
      key: "inputMapping",
      label: "Input Mapping (Parent -> Child)",
      type: "mapping",
      placeholder: "Map variables to subflow",
    },
    {
      key: "outputMapping",
      label: "Output Mapping (Child -> Parent)",
      type: "mapping",
      placeholder: "Map results back to parent",
    },
  ],

  input: [
    {
      key: "name",
      label: "Parameter Name",
      type: "text",
      placeholder: "my_param",
      required: true,
    },
    {
      key: "defaultValue",
      label: "Default Value",
      type: "text",
      placeholder: "fallback_value",
    },
  ],

  output: [
    {
      key: "name",
      label: "Output Name",
      type: "text",
      placeholder: "result_key",
      required: true,
    },
    {
      key: "value",
      label: "Value to Return",
      type: "text",
      placeholder: "${local_var}",
      required: true,
    },
  ],

  // Default fallback
  default: [
    {
      key: "selector",
      label: "Selector",
      type: "selector",
      placeholder: "Enter selector...",
    },
  ],
};

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
        // Enrich with live variable result if available
        const nodeLabel = n.data?.customLabel || n.data?.label || n.id;
        const liveResult =
          liveVariables[`${nodeLabel}.result`] ||
          liveVariables[`${n.id}.result`];

        if (liveResult !== undefined) {
          return {
            ...n,
            data: {
              ...n.data,
              result: liveResult,
            },
          };
        }
        return n;
      });

    // --- SUBFLOW CONTEXT ENRICHMENT ---
    // If this is an Entry node and we are in a subflow, add the parent component node
    const isEntryNode =
      activeNode.type === "entry" || activeNode.data?.type === "entry";
    if (isEntryNode && viewStack.length > 0 && currentProject) {
      const lastView = viewStack[viewStack.length - 1];
      if (lastView.nodeId) {
        // Find the parent flow's component node
        const parentFlow = currentProject.flows?.find(
          (f) => f.id === lastView.id,
        );
        if (parentFlow && parentFlow.nodes) {
          const parentComponentNode = parentFlow.nodes.find(
            (n) => n.nodeId === lastView.nodeId || n.id === lastView.nodeId,
          );
          if (parentComponentNode) {
            // Check if it's already in the list (unlikely as it's from another flow)
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
                id: parentComponentNode.nodeId || parentComponentNode.id, // Ensure consistent ID
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
  }, [activeNode, edges, nodes, viewStack, currentProject, liveVariables]);

  // --- COMPOSITION STATS RESOLUTION ---
  const resolvedStats = useMemo(() => {
    if (!activeNode || !currentProject)
      return { nodeCount: 0, hasInput: false, hasOutput: false };

    const isContainer = ["component", "loop"].includes(
      activeNode.type || activeNode.data?.type,
    );
    if (!isContainer)
      return { nodeCount: 0, hasInput: false, hasOutput: false };

    const flowId = activeNode.data?.flowId;
    if (!flowId) return { nodeCount: 0, hasInput: false, hasOutput: false };

    // Find the actual subflow in the project
    const subFlow = currentProject.flows?.find((f) => f.id === flowId);
    if (!subFlow) {
      // Fallback to in-memory snapshot if DB flow not yet in project list
      const nodesCount =
        activeNode.data?.nodeCount ?? activeNode.data?.subFlow?.nodes?.length;
      return {
        nodeCount: nodesCount || 0,
        hasInput:
          activeNode.data?.hasInput ??
          activeNode.data?.subFlow?.nodes?.some((n) => n.type === "input"),
        hasOutput:
          activeNode.data?.hasOutput ??
          activeNode.data?.subFlow?.nodes?.some((n) => n.type === "output"),
      };
    }

    return {
      nodeCount: subFlow.nodes?.length || 0,
      hasInput: subFlow.nodes?.some((n) => n.type === "input"),
      hasOutput: subFlow.nodes?.some((n) => n.type === "output"),
    };
  }, [activeNode, currentProject]);

  // Utility to safely stringify and truncate large results for preview
  const truncateResult = useCallback((result, maxLen = 1000) => {
    if (!result) return "";
    try {
      const str =
        typeof result === "object"
          ? JSON.stringify(result) // No indentation for preview
          : String(result);
      if (str.length > maxLen) {
        return str.substring(0, maxLen) + "... (truncated)";
      }
      return str;
    } catch (error) {
      console.warn("Truncate error:", error);
      return "[Unserializable Data]";
    }
  }, []);

  // Local state for immediate performance (fix typing lag)
  const [localConfig, setLocalConfig] = React.useState(
    activeNode?.data?.configuration || {},
  );
  // HEADER RENAMING STATE
  const [localLabel, setLocalLabel] = React.useState(
    activeNode?.data?.customLabel || activeNode?.data?.label || "",
  );

  const [lightboxUrl, setLightboxUrl] = useState(null); // Lightbox modal state
  const [inspectedData, setInspectedData] = useState(null); // Full data view state
  const lastSyncedConfigRef = React.useRef({
    config: activeNode?.data?.configuration || {},
    nodeId: activeNode?.id,
    nodeState: activeNode?.data?.state,
  });
  const updateTimeoutRef = React.useRef(null);

  // Sync LOCAL <-> GLOBAL
  // Optimized for Element Picker: Ensures picked values are reflected even if local state exists.
  React.useEffect(() => {
    if (!activeNode) return;

    const globalConfig = activeNode?.data?.configuration || {};
    const nodeState = activeNode?.data?.state;

    // A. Detect Node Switch -> Force reset
    const hasNodeChanged = activeNode.id !== lastSyncedConfigRef.current.nodeId;

    // B. Detect Pick Completion (Captured State change from Picking -> Default/Success)
    const justFinishedPicking =
      nodeState !== "picking" &&
      lastSyncedConfigRef.current.nodeState === "picking";

    const globalConfigStr = activeNode?.data?.configuration
      ? JSON.stringify(activeNode.data.configuration)
      : "{}";
    const lastConfigStr = lastSyncedConfigRef.current.config
      ? JSON.stringify(lastSyncedConfigRef.current.config)
      : "{}";

    // DRIFT: Global is different from what we thought we synced.
    // This happens if an external source (AI, Picker, Undo) changed the node data.
    const isExternalDrift = globalConfigStr !== lastConfigStr;

    if (hasNodeChanged || justFinishedPicking || isExternalDrift) {
      console.log("[NodeConfig] 🔄 EXTERNAL SYNC TRIGGERED. Reason:", {
        hasNodeChanged,
        justFinishedPicking,
        isExternalDrift,
      });

      // Prioritize external changes (AI, Picker) over local unsaved changes
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
      return;
    }

    // Always update state ref to catch the Picking -> Default transition next time
    lastSyncedConfigRef.current.nodeState = nodeState;

    // Debug: Log what's in the active node configuration
    console.log("[NodeConfig] 🔍 Active Node Config Check:", {
      nodeId: activeNode?.id,
      hasConfig: !!globalConfig,
      configKeys: Object.keys(globalConfig),
      selectorValue: globalConfig?.selector,
      isExternalDrift,
      justFinishedPicking,
    });
  }, [
    activeNode,
    activeNode?.id,
    activeNode?.data?.configuration,
    activeNode?.data?.customLabel,
    activeNode?.data?.label,
    activeNode?.data?.state,
  ]);

  // Helper to handle partial configuration updates safely
  const handleConfigUpdate = (key, value) => {
    // 1. Update LOCAL state immediately (Instant Feedback)
    console.log(`[NodeConfig] Updating ${key} to:`, value);
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);

    // 2. Debounce update to GLOBAL state (Performance)
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);

    updateTimeoutRef.current = setTimeout(() => {
      // Track what we are sending in the ref to avoid "echo" loop in useEffect
      lastSyncedConfigRef.current.config = newConfig;

      if (activeNode) {
        updateNodeConfiguration(activeNode.id, {
          ...(activeNode.data?.configuration || {}),
          ...newConfig,
        });
      }
    }, 200); // Reduced to 200ms for snappier feel and to reduce race window
  };

  // AI AUTO-HEAL HANDLER
  const handleAutoHeal = async (failedSelector) => {
    // 1. Create an AbortController specifically for the AI request
    const aiAbortController = new AbortController();

    // 2. Clear previous toast if any
    toast.dismiss("ai-heal-toast");

    // 3. Show Loading Toast with Abort Button
    toast.loading(
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-xs text-amber-500">
          AI Repair Mode (Ollama/Gemma 3) 🧠
        </span>
        <span className="text-[10px] opacity-80 leading-tight">
          Analyzing DOM context... This can take 1-2 mins on local machines.
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
      console.log(`[AI-Fix] Requesting heal for selector: ${failedSelector}`);
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

      console.log(`[AI-Fix] Response received:`, data);

      if (data && data.suggestion) {
        // Correctly identify field to update (Smart Selector uses originalSelector)
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

  // --- VALIDATION LOGIC (Moved Up) ---
  const validationErrors = useMemo(() => {
    const errors = {};
    const inputs = definedInputs || []; // Safety check
    inputs.forEach((field) => {
      const value = localConfig[field.key];

      // 1. Required Check
      if (
        field.required &&
        (value === undefined || value === "" || value === null)
      ) {
        errors[field.key] = t("validation.required", "Required");
        return;
      }

      // Skip if empty and not required
      if (!value && value !== 0 && !field.required) return;

      // 2. Numeric Check
      if (field.type === "number") {
        // Allow variables {{...}}
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

  // Cleanup
  React.useEffect(() => () => clearTimeout(updateTimeoutRef.current), []);

  // Determine screenshot URL for nodes that produce captures (used for evidence preview)
  const nodeScreenshotUrl =
    activeNode?.data?.replayData?.screenshot_path ||
    activeNode?.data?.result?.screenshot ||
    activeNode?.data?.screenshots?.after?.url ||
    activeNode?.data?.screenshots?.after?.path ||
    null;

  // Prepare dynamic variables map for VariableInput
  const variablesMap = React.useMemo(() => {
    const map = {};

    // 1. Merge live variables from backend (highest priority - actual execution results)
    if (liveVariables && typeof liveVariables === "object") {
      Object.entries(liveVariables).forEach(([key, val]) => {
        map[key] = val;
      });
    }

    // 2. Merge from preceding nodes (fallback for pre-execution state)
    if (precedingNodes) {
      precedingNodes.forEach((pn) => {
        if (pn.data?.result !== undefined) {
          // Only set if not already provided by liveVariables
          if (!(`${pn.id}.result` in map)) {
            map[`${pn.id}.result`] = pn.data.result;
          }
          if (pn.data?.label && !(`${pn.data.label}.result` in map)) {
            map[`${pn.data.label}.result`] = pn.data.result;
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

  // CRITICAL FIX: Stop event propagation to prevent ReactFlow from stealing focus
  const stopPropagation = (e) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation?.();
  };

  const colorKey = safeConfig.color;

  // Placeholder helpers
  const aiConfig = JSON.parse(localStorage.getItem("hal_ai_config") || "{}");
  const globalModel = aiConfig.selectedModel || "gemma3";
  const globalProvider = aiConfig.activeProvider || "ollama";

  const renderInput = (field) => {
    // Read from LOCAL state for performance
    const value = localConfig[field.key] ?? "";
    const error = validationErrors[field.key];

    switch (field.type) {
      case "conditional_branches":
        return (
          <ConditionalBranchesEditor
            key={field.key}
            value={value}
            variables={variablesMap}
            onChange={(newVal) => handleConfigUpdate(field.key, newVal)}
          />
        );
      case "switch_cases":
        return (
          <SwitchCasesEditor
            key={field.key}
            value={value}
            variables={variablesMap}
            onChange={(newVal) => handleConfigUpdate(field.key, newVal)}
          />
        );
      case "select":
        return (
          <div key={field.key} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1">
              {t(`nodes.fields.${field.key}`, field.label)}
            </label>
            <select
              value={value}
              onChange={(e) => handleConfigUpdate(field.key, e.target.value)}
              className={cn(
                "w-full bg-[var(--bg-canvas)]/50 border border-[var(--border-ui)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500/50 transition-all !pointer-events-auto !cursor-pointer",
                error && "border-red-500/50 focus:border-red-500 bg-red-500/5",
              )}
            >
              <option value="" disabled>
                {t("common.select_default", "Select an option...")}
              </option>
              {field.options?.map((opt) => (
                <option
                  key={opt.value}
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
          <div key={field.key} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1">
                {t(`nodes.fields.${field.key}`, field.label)}
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
                `nodes.placeholders.${field.key}`,
                field.placeholder,
              )}
              onChange={(e) => handleConfigUpdate(field.key, e.target.value)}
              className="w-full min-h-[100px] text-xs font-mono !pointer-events-auto !cursor-text !select-text py-2 px-3"
            />
          </div>
        );
      case "checkbox": {
        // ... (existing checkbox logic kept largely same, simplified for clarity here) ...
        // Special handling for takeScreenshot: show inline preview if available
        // Special handling for takeScreenshot: show inline preview if available
        // PRIORITIZATION: 1. Historical Replay Data 2. Live Result 3. Legacy
        const screenshotUrl =
          activeNode.data?.replayData?.screenshot_path ||
          activeNode.data?.result?.screenshot ||
          activeNode.data?.screenshots?.after?.url ||
          activeNode.data?.screenshots?.after?.path;

        const hasScreenshot = field.key === "takeScreenshot" && screenshotUrl;

        return (
          <div key={field.key} className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-ui)] bg-[var(--bg-canvas)]/50 cursor-pointer hover:bg-[var(--bg-canvas)] transition-colors">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) =>
                  handleConfigUpdate(field.key, e.target.checked)
                }
                className="w-4 h-4 rounded border-[var(--border-ui)] text-indigo-500 focus:ring-offset-0 focus:ring-indigo-500/50 bg-[var(--bg-node)] !pointer-events-auto !cursor-pointer"
              />
              <span className="text-xs font-medium text-[var(--text-main)] select-none">
                {field.label}
              </span>
            </label>

            {/* EVIDENCE CARD (Abstracted) */}
            {hasScreenshot && (
              <EvidenceCard
                screenshotUrl={screenshotUrl}
                durationMs={
                  activeNode.data?.replayData?.duration_ms ||
                  activeNode.data?.result?.durationMs ||
                  activeNode.data?.result?.duration
                }
                timestamp={Date.now()} // Auto-cache bust handled by EvidenceCard
              />
            )}
          </div>
        );
      }
      case "number":
        return (
          <div key={field.key} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1">
                {t(`nodes.fields.${field.key}`, field.label)}
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
          <div key={field.key} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1 flex items-center justify-between">
              {t(`nodes.fields.${field.key}`, field.label)}
              <div className="flex items-center gap-2">
                {/* AI FIX BUTTON */}
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
                <span className="text-[9px] text-indigo-400 opacity-70">
                  CSS / XPath
                </span>

                {/* AI SANITIZED INDICATOR (Phase 4) */}
                {activeNode?.data?.configuration?.isAI && (
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
                <button
                  type="button"
                  onClick={() => {
                    if (activeNode?.data?.state === "picking") {
                      console.log("[NodeConfig] User clicked CANCEL picking");
                      onCancelPick && onCancelPick();
                    } else {
                      console.log(
                        "[NodeConfig] User clicked START picking for field:",
                        field.key,
                      );
                      onStartPick && onStartPick(field.key);
                    }
                  }}
                  // Enabled even if picking, to allow cancel
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
                      ? "Picking... (Cancel)"
                      : window.location.hostname !== "localhost"
                        ? "Remote Pick"
                        : "Pick"}
                  </span>
                </button>
              </div>
            </label>
            <div className="relative">
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

            {/* Warning Patch for WEB Demo (Phase 3: Resolved) */}
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
            key={field.key}
            label={field.label}
            value={value}
            onChange={(newVal) => handleConfigUpdate(field.key, newVal)}
          />
        );
      default: // text
        return (
          <div key={field.key} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 ml-1">
                {t(`nodes.fields.${field.key}`, field.label)}
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

        {/* PRECEDING NODES DATA (Visibility into flow values) */}
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
              {precedingNodes.map((pn) => (
                <div
                  key={pn.id}
                  className="p-2 rounded-lg bg-slate-900/40 border border-white/5 overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-medium text-slate-400">
                      {pn.data?.customLabel || pn.data?.label || pn.type}
                    </span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-500 font-mono">
                      {`{{${pn.data?.label || pn.id}.result}}`}
                    </span>
                  </div>
                  {pn.data?.result ? (
                    <div className="relative group/data">
                      <div className="text-[11px] text-slate-300 font-mono line-clamp-6 bg-black/30 p-2.5 rounded pr-12 max-h-48 overflow-y-auto custom-scrollbar border border-white/5">
                        {truncateResult(pn.data.result, 2000)}
                      </div>
                      <div className="absolute right-1 top-1 flex flex-col gap-1 opacity-0 group-hover/data:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            const text =
                              typeof pn.data.result === "object"
                                ? JSON.stringify(pn.data.result, null, 2)
                                : String(pn.data.result);
                            navigator.clipboard.writeText(text);
                            toast.success("Copied to clipboard", {
                              icon: "📋",
                              id: "copy-toast",
                            });
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                          title="Copy"
                        >
                          <Copy size={10} />
                        </button>
                        <button
                          onClick={() =>
                            setInspectedData({
                              title:
                                pn.data?.customLabel ||
                                pn.data?.label ||
                                pn.type,
                              content: pn.data.result,
                            })
                          }
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                          title="View Full"
                        >
                          <Maximize2 size={10} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-600 italic">
                      No data emitted yet.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Result Visualization */}
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
              {/* Background Glow */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500" />

              {/* Extracted Content (DOM Context) */}
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

              {/* Call LLM Result */}
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

              {/* Chain of Thought Result */}
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

              {/* Generate Data Result */}
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

              {/* Validate Semantic Result */}
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

              {/* Universal Fallback: show raw data for unrecognized AI result shapes */}
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

              {/* Usage Stats Footer */}
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
          {/* HEADER */}
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

                    // MANIFIESTO: Live Update (Debounced)
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
                    }, 300); // 300ms debounce for typing comfort
                  }}
                  // onBlur removed - handled by debounce
                />
              </div>
            </div>

            {/* HEADER ACTIONS */}
            <div className="flex items-center gap-1">
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

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {/* Dynamic Content Switch */}
            {/* Dynamic Content Switch */}
            {(() => {
              const isComponent = activeNode.type === "component";
              const isLoop = activeNode.type === "loop";

              const renderCompositionDashboard = () => (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Node Count */}
                    <div className="p-3 rounded-lg border border-white/5 bg-white/5 flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-bold">
                        Nodes
                      </span>
                      <span className="text-2xl font-bold text-white">
                        {resolvedStats.nodeCount}
                      </span>
                    </div>
                    {/* Connections */}
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

                  {/* Navigation Action */}
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

                  {/* Ungroup Action */}
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
                    {/* Description Card */}
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
                    {renderCompositionDashboard()}
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
                    {activeNode.data.result?.reasoning && (
                      <p className="text-[10px] text-violet-300/80 leading-relaxed line-clamp-2 italic">
                        "{activeNode.data.result.reasoning}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 bg-black/40 rounded-lg p-3 border border-white/5 shadow-inner">
                  <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-black opacity-40">
                    <span>Target Suggestion</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 font-mono text-xs text-violet-200 bg-violet-500/5 p-2 rounded border border-violet-500/10 truncate">
                      {activeNode.data.result?.suggestedSelector ||
                        activeNode.data.result?.newSelector}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const resData = activeNode?.data?.result || {};
                    const newSelector =
                      resData.suggestedSelector || resData.newSelector;

                    if (newSelector) {
                      const targetField =
                        activeNode?.data?.type === "smart_selector"
                          ? "originalSelector"
                          : "selector";

                      // Update config AND clear healed state
                      updateNodeConfiguration(activeNode.id, {
                        ...(activeNode.data?.configuration || {}),
                        [targetField]: newSelector,
                      });

                      // Reset state to SUCCESS or default so orange border vanishes
                      updateNodeState(activeNode.id, NODE_STATES.SUCCESS);

                      toast.success(
                        t(
                          "actions.smart_selector.applied",
                          "Selector updated and fix committed!",
                        ),
                      );
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-violet-500/20 active:scale-[0.98]"
                >
                  <Sparkles size={14} fill="currentColor" />
                  Apply Suggested Fix
                </button>
              </div>
            )}

            {/* Primary Action */}
            <button
              onClick={async () => {
                await onExecute({
                  ...activeNode,
                  data: {
                    ...activeNode.data,
                    configuration: {
                      ...(activeNode.data?.configuration || {}),
                      ...localConfig,
                    },
                  },
                });
                await refreshVariables();
              }}
              disabled={hasErrors} // Block execution if validation/mandatory fields fail
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                hasErrors
                  ? "bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-50" // Disabled State
                  : cn(
                      "text-white shadow-lg active:scale-[0.98] hover:brightness-110 bg-gradient-to-r shadow-lg",
                      CATEGORY_STYLES[colorKey]?.panel?.buttonGradient,
                    ),
              )}
              title={
                hasErrors ? "Please fix configuration errors" : "Run this node"
              }
            >
              <Play size={14} fill="currentColor" />
              {t("common.run_node", "Run Node")}
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
