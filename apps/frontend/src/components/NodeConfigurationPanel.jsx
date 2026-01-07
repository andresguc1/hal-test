// NodeConfigurationPanel.jsx - Refactored with shadcn/ui
import React, { useState, useEffect } from "react";
import { XCircle, Play, Trash2, AlertCircle, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "motion/react";
import { panelVariants } from "../utils/motion-variants";
import { NODE_FIELD_CONFIGS, VISUAL_CHANGE_NODES } from "./hooks/constants";
import { logger } from "../utils/logger";
import ScreenshotViewer from "./ScreenshotViewer";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ===============================================
// CRITICAL: Custom comparison function for React.memo
const areEqual = (prevProps, nextProps) => {
  if (prevProps.isVisible !== nextProps.isVisible) return false;
  if (prevProps.action?.nodeId !== nextProps.action?.nodeId) return false;
  if (prevProps.action?.type !== nextProps.action?.type) return false;
  const prevScreenshots = prevProps.action?.data?.screenshots;
  const nextScreenshots = nextProps.action?.data?.screenshots;
  if (prevScreenshots !== nextScreenshots) return false;
  return true;
};
// ===============================================

function NodeConfigurationPanel({
  action,
  isVisible,
  onExecute,
  onClose,
  onDeleteNode,
  updateNodeConfiguration,
  nodes: _nodes = [],
}) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

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
      initialData.browserType = currentData.browserType ?? "chromium";
      initialData.headless =
        typeof currentData.headless === "boolean"
          ? currentData.headless
          : false;
      initialData.slowMo = currentData.slowMo ?? 0;
      initialData.args = Array.isArray(currentData.args)
        ? currentData.args.join(" ")
        : (currentData.args ?? "");
      initialData.maximizeWindow = !!currentData.maximizeWindow;
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

  const validateField = (fieldConfig, value) => {
    if (!fieldConfig) return null;
    if (
      fieldConfig.required &&
      (value === "" || value === undefined || value === null)
    ) {
      return `${t(`nodes.fields.${fieldConfig.name}`)} ${t("common.required_field")}`;
    }
    if (fieldConfig.validation)
      return fieldConfig.validation(value, formData, t);
    return null;
  };

  const validateForm = () => {
    const fields = NODE_FIELD_CONFIGS[action?.type] || [];
    const newErrors = {};

    if (fields.length === 0) {
      if (action?.type === "open_url") {
        if (!formData.url || formData.url.trim() === "") {
          newErrors.url = `${t("nodes.fields.url")} ${t("common.required_field")}`;
        } else {
          try {
            new URL(formData.url);
          } catch {
            newErrors.url = t("common.invalid_url");
          }
        }
      }
    } else {
      fields.forEach((field) => {
        const err = validateField(field, formData[field.name]);
        if (err) newErrors[field.name] = err;
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  // For native input events
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    handleChange(name, newValue);
  };

  const handleSave = async () => {
    const normalized = { ...formData };
    if (normalized.slowMo !== undefined && normalized.slowMo !== "")
      normalized.slowMo = Number(normalized.slowMo);
    if (typeof updateNodeConfiguration === "function" && action?.nodeId) {
      try {
        updateNodeConfiguration(action.nodeId, normalized);
        setIsDirty(false);
      } catch (err) {
        logger.error("updateNodeConfiguration failed", err, "NodeConfigPanel");
        alert(t("nodes.config.save_error"));
      }
    } else {
      setIsDirty(false);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (!action?.nodeId || !isDirty) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, isDirty, action?.nodeId]);

  const handleExecute = async () => {
    const valid = validateForm();
    if (!valid) return;
    await handleSave();
    if (!action) return;

    let payload = {};

    if (action.type === "launch_browser") {
      payload = {
        browserType: formData.browserType ?? "chromium",
        headless: !!formData.headless,
        slowMo: Number(formData.slowMo) || 0,
        args: formData.args ?? "",
        maximizeWindow: !!formData.maximizeWindow,
      };
    } else if (action.type === "open_url") {
      if (!formData.url || formData.url.trim() === "") {
        alert(t("nodes.config.url_required"));
        return;
      }
      payload = {
        url: formData.url.trim(),
        waitUntil: formData.waitUntil ?? "domcontentloaded",
        timeout: Number(formData.timeout) || 20000,
      };
    } else if (action.type === "manage_tabs") {
      const act = formData.action ?? "new";
      payload.action = act;

      if (act === "switch" || act === "close" || act === "navigate") {
        const ti = formData.tabIndex;
        const tabIndexNum = ti !== undefined && ti !== "" ? Number(ti) : NaN;
        if (!Number.isFinite(tabIndexNum) || tabIndexNum < 0) {
          alert(t("nodes.config.tab_index_invalid"));
          return;
        }
        payload.tabIndex = Math.trunc(tabIndexNum);
      }

      if (act === "new") {
        if (formData.url && String(formData.url).trim() !== "") {
          payload.url = String(formData.url).trim();
        }
      } else if (act === "navigate") {
        if (!formData.url || String(formData.url).trim() === "") {
          alert(t("nodes.config.navigate_url_required"));
          return;
        }
        payload.url = String(formData.url).trim();
      }
    } else {
      payload = { ...formData };
    }

    try {
      const execPackage = {
        nodeId: action.nodeId,
        type: action.type,
        payload,
      };

      logger.debug("Prepared execPackage", execPackage, "NodeConfigPanel");

      if (typeof onExecute === "function") {
        try {
          logger.debug("Delegating to onExecute", null, "NodeConfigPanel");
          const success = await onExecute(execPackage);
          logger.debug("onExecute returned", { success }, "NodeConfigPanel");
          if (!success) {
            alert(t("nodes.config.execution_failed"));
          } else {
            setIsDirty(false);
          }
        } catch (err) {
          logger.error("onExecute error", err, "NodeConfigPanel");
          alert(t("nodes.config.execution_error_generic"));
        }
        return;
      }

      const BACKEND_API_BASE =
        (import.meta.env.PROD
          ? "https://hal-test-backend.onrender.com"
          : "http://localhost:2001") + "/api/actions";

      const endpointByType = {
        launch_browser: `${BACKEND_API_BASE}/launch_browser`,
        open_url: `${BACKEND_API_BASE}/open_url`,
        close_browser: `${BACKEND_API_BASE}/close_browser`,
        manage_tabs: `${BACKEND_API_BASE}/manage_tabs`,
        resize_viewport: `${BACKEND_API_BASE}/resize_viewport`,
        click: `${BACKEND_API_BASE}/click`,
        go_back: `${BACKEND_API_BASE}/go_back`,
        go_forward: `${BACKEND_API_BASE}/go_forward`,
        type_text: `${BACKEND_API_BASE}/type_text`,
        wait_for_element: `${BACKEND_API_BASE}/wait_for_element`,
        execute_js: `${BACKEND_API_BASE}/execute_js`,
        select_option: `${BACKEND_API_BASE}/select_option`,
        submit_form: `${BACKEND_API_BASE}/submit_form`,
        scroll: `${BACKEND_API_BASE}/scroll`,
        drag_drop: `${BACKEND_API_BASE}/drag_drop`,
        upload_file: `${BACKEND_API_BASE}/upload_file`,
        take_screenshot: `${BACKEND_API_BASE}/take_screenshot`,
        save_dom: `${BACKEND_API_BASE}/save_dom`,
        log_errors: `${BACKEND_API_BASE}/log_errors`,
      };

      const defaultEndpoint =
        endpointByType[action.type] || `${BACKEND_API_BASE}/${action.type}`;

      const urlToCall = defaultEndpoint;
      logger.debug(
        "Performing fetch POST",
        { url: urlToCall, payload },
        "NodeConfigPanel",
      );

      const resp = await fetch(urlToCall, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        alert(
          t("nodes.config.request_error", {
            status: resp.status,
            statusText: resp.statusText,
          }),
        );
        return;
      }

      setIsDirty(false);
    } catch (err) {
      logger.error("Error executing action", err, "NodeConfigPanel");
      alert(t("nodes.config.connection_error"));
    }
  };

  const handleDelete = () => {
    if (!action) return;
    if (window.confirm(t("common.delete_confirm"))) {
      onDeleteNode(action.nodeId);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm(t("common.unsaved_changes"))) return;
    }
    onClose();
  };

  // ===============================================
  // FIELD RENDERERS
  // ===============================================
  const renderField = (fieldConfig) => {
    if (fieldConfig.conditional) {
      const { field, is } = fieldConfig.conditional;
      const dependentValue = formData[field];

      if (is === null) {
        if (dependentValue && String(dependentValue).trim() !== "") {
          return null;
        }
      } else {
        if (dependentValue !== is) {
          return null;
        }
      }
    }

    const { name, type, placeholder, options, min, max, hint } = fieldConfig;
    const value =
      formData[name] ??
      (fieldConfig.type === "checkbox" || fieldConfig.type === "boolean"
        ? false
        : "");
    const error = errors[name];

    const hintText = hint
      ? t(`nodes.hints.${name}`, hint)
      : i18n.exists(`nodes.hints.${name}`)
        ? t(`nodes.hints.${name}`)
        : null;

    if (type === "select") {
      return (
        <div
          key={name}
          className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-hal-neutral-800/50"
        >
          <Label className="text-hal-neutral-100 text-sm font-semibold block mb-4">
            {t(`nodes.fields.${name}`, fieldConfig.label)}
            {fieldConfig.required && (
              <span className="text-hal-error-500 ml-1">*</span>
            )}
          </Label>
          <Select
            value={value || ""}
            onValueChange={(val) => handleChange(name, val)}
          >
            <SelectTrigger className="w-full bg-hal-neutral-950 border-hal-neutral-800 text-hal-neutral-100 focus:ring-hal-primary-500 focus:border-hal-primary-500 !h-16 !text-lg [&>span]:whitespace-normal [&>span]:text-left transition-all duration-200 hover:border-hal-neutral-700">
              <SelectValue placeholder={t("common.select_default")} />
            </SelectTrigger>
            <SelectContent
              className="bg-hal-neutral-950 border-hal-neutral-800 rounded-lg max-h-[200px] overflow-auto w-[var(--radix-select-trigger-width)]"
              position="popper"
              sideOffset={4}
              align="start"
              side="bottom"
            >
              {options?.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-hal-neutral-100 focus:bg-hal-neutral-800 focus:text-white rounded py-2 text-base"
                >
                  {t(`nodes.options.${name}.${opt.value}`, opt.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hintText && (
            <p className="text-[11px] text-hal-neutral-500 italic mt-3 leading-relaxed">
              {hintText}
            </p>
          )}
          {error && (
            <div className="flex items-center gap-1 text-hal-error-500 text-xs mt-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
      );
    }

    if (type === "checkbox" || type === "boolean") {
      return (
        <div
          key={name}
          className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-hal-neutral-800/50 flex flex-row items-center justify-between gap-4"
        >
          <div className="flex-1 space-y-1">
            <Label
              htmlFor={name}
              className="text-hal-neutral-100 text-sm font-semibold cursor-pointer"
            >
              {t(`nodes.fields.${name}`, fieldConfig.label)}
            </Label>
            {hintText && (
              <p className="text-[11px] text-hal-neutral-500 italic leading-relaxed">
                {hintText}
              </p>
            )}
          </div>
          <Switch
            id={name}
            checked={!!value}
            onCheckedChange={(checked) => handleChange(name, checked)}
            className="data-[state=checked]:bg-hal-primary-500 data-[state=unchecked]:bg-hal-neutral-700"
          />
        </div>
      );
    }

    if (type === "number") {
      return (
        <div
          key={name}
          className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-hal-neutral-800/50"
        >
          <Label className="text-hal-neutral-100 text-sm font-semibold block mb-4">
            {t(`nodes.fields.${name}`, fieldConfig.label)}
            {fieldConfig.required && (
              <span className="text-hal-error-500 ml-1">*</span>
            )}
          </Label>
          <Input
            type="number"
            name={name}
            value={value}
            onChange={handleInputChange}
            placeholder={t(`nodes.placeholders.${name}`, placeholder)}
            min={min}
            max={max}
            className={cn(
              "w-full bg-hal-neutral-950 border-hal-neutral-800 text-hal-neutral-100 focus-visible:ring-hal-primary-500 focus-visible:border-hal-primary-500 !h-16 !text-lg font-mono transition-all duration-200",
              error && "border-hal-error-500",
            )}
          />
          {hintText && (
            <p className="text-[11px] text-hal-neutral-500 italic mt-3 leading-relaxed">
              {hintText}
            </p>
          )}
          {error && (
            <div className="flex items-center gap-1 text-hal-error-500 text-xs mt-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
      );
    }

    if (type === "textarea") {
      return (
        <div
          key={name}
          className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-hal-neutral-800/50"
        >
          <Label className="text-hal-neutral-100 text-sm font-semibold block mb-4">
            {t(`nodes.fields.${name}`, fieldConfig.label)}
            {fieldConfig.required && (
              <span className="text-hal-error-500 ml-1">*</span>
            )}
          </Label>
          <textarea
            name={name}
            value={value}
            onChange={handleInputChange}
            placeholder={t(`nodes.placeholders.${name}`, placeholder)}
            rows={5}
            className={cn(
              "w-full rounded-lg bg-hal-neutral-950 border border-hal-neutral-800 text-hal-neutral-100 p-4 text-base font-mono focus:outline-none focus:ring-2 focus:ring-hal-primary-500 focus:border-hal-primary-500 resize-y min-h-[120px] transition-all duration-200",
              error && "border-hal-error-500",
            )}
          />
          {hintText && (
            <p className="text-[11px] text-hal-neutral-500 italic mt-2 leading-relaxed">
              {hintText}
            </p>
          )}
          {error && (
            <div className="flex items-center gap-1 text-hal-error-500 text-xs mt-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
      );
    }

    // default text
    return (
      <div
        key={name}
        className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-hal-neutral-800/50"
      >
        <Label className="text-hal-neutral-100 text-sm font-semibold block mb-4">
          {t(`nodes.fields.${name}`, fieldConfig.label)}
          {fieldConfig.required && (
            <span className="text-hal-error-500 ml-1">*</span>
          )}
        </Label>
        <Input
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={t(`nodes.placeholders.${name}`, placeholder)}
          className={cn(
            "w-full bg-hal-neutral-950 border-hal-neutral-800 text-hal-neutral-100 focus-visible:ring-hal-primary-500 focus-visible:border-hal-primary-500 !h-16 !text-lg font-mono transition-all duration-200",
            error && "border-hal-error-500",
          )}
        />
        {hintText && (
          <p className="text-[11px] text-hal-neutral-500 italic mt-3 leading-relaxed">
            {hintText}
          </p>
        )}
        {error && (
          <div className="flex items-center gap-1 text-hal-error-500 text-xs mt-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>
    );
  };

  const renderFields = () => {
    const fields = NODE_FIELD_CONFIGS[action?.type] || [];
    if (!action) return null;

    if (!fields || fields.length === 0) {
      // Manual field rendering for nodes without config
      if (action.type === "launch_browser") {
        return (
          <div>
            <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50">
              <Label className="text-white text-sm font-semibold block mb-4">
                {t("nodes.fields.browserType")}
              </Label>
              <Select
                value={formData.browserType ?? "chromium"}
                onValueChange={(val) => handleChange("browserType", val)}
              >
                <SelectTrigger className="w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus:ring-[#1a73e8] focus:border-[#1a73e8] !h-16 !text-lg [&>span]:whitespace-normal [&>span]:text-left">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className="bg-[#15181c] border-[#3a3f47] rounded-lg max-h-[200px] overflow-auto w-[var(--radix-select-trigger-width)]"
                  position="popper"
                  sideOffset={4}
                  align="start"
                  side="bottom"
                >
                  <SelectItem
                    value="chromium"
                    className="text-[#e5e5e5] focus:bg-[#2a2f37] focus:text-white rounded py-2 text-base"
                  >
                    chromium
                  </SelectItem>
                  <SelectItem
                    value="firefox"
                    className="text-[#e5e5e5] focus:bg-[#2a2f37] focus:text-white rounded py-2 text-base"
                  >
                    firefox
                  </SelectItem>
                  <SelectItem
                    value="webkit"
                    className="text-[#e5e5e5] focus:bg-[#2a2f37] focus:text-white rounded py-2 text-base"
                  >
                    webkit
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50 flex flex-row items-center justify-between gap-4">
              <Label className="text-white text-sm font-semibold cursor-pointer flex-1">
                {t("nodes.fields.headless")}
              </Label>
              <Switch
                checked={!!formData.headless}
                onCheckedChange={(checked) => handleChange("headless", checked)}
                className="data-[state=checked]:bg-[#1a73e8] data-[state=unchecked]:bg-[#3a3f47]"
              />
            </div>

            <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50 flex flex-row items-center justify-between gap-4">
              <Label className="text-white text-sm font-semibold cursor-pointer flex-1">
                {t("nodes.fields.maximizeWindow")}
              </Label>
              <Switch
                checked={!!formData.maximizeWindow}
                onCheckedChange={(checked) =>
                  handleChange("maximizeWindow", checked)
                }
                className="data-[state=checked]:bg-[#1a73e8] data-[state=unchecked]:bg-[#3a3f47]"
              />
            </div>

            <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50">
              <Label className="text-white text-sm font-semibold block mb-4">
                {t("nodes.fields.slowMo")}
              </Label>
              <Input
                type="number"
                name="slowMo"
                value={formData.slowMo ?? 0}
                onChange={handleInputChange}
                className="w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus-visible:ring-[#1a73e8] focus-visible:border-[#1a73e8] !h-16 !text-lg"
              />
            </div>

            <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50">
              <Label className="text-white text-sm font-semibold block mb-4">
                {t("nodes.fields.args")}
              </Label>
              <Input
                type="text"
                name="args"
                value={formData.args ?? ""}
                onChange={handleInputChange}
                placeholder="--start-maximized"
                className="w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus-visible:ring-[#1a73e8] focus-visible:border-[#1a73e8] !h-16 !text-lg"
              />
            </div>

            <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50">
              <Label className="text-white text-sm font-semibold block mb-4">
                {t("nodes.fields.endpoint")}
              </Label>
              <Input
                type="text"
                name="endpoint"
                value={formData.endpoint ?? ""}
                onChange={handleInputChange}
                className="w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus-visible:ring-[#1a73e8] focus-visible:border-[#1a73e8] !h-16 !text-lg"
              />
            </div>
          </div>
        );
      }

      if (action.type === "open_url") {
        return (
          <div>
            <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50">
              <Label className="text-white text-sm font-semibold block mb-4">
                {t("nodes.fields.url")}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                type="text"
                name="url"
                value={formData.url ?? ""}
                onChange={handleInputChange}
                placeholder="https://www.google.com"
                className={cn(
                  "w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus-visible:ring-[#1a73e8] focus-visible:border-[#1a73e8] !h-16 !text-lg",
                  errors.url && "border-red-500",
                )}
              />
              {errors.url && (
                <div className="flex items-center gap-1 text-red-400 text-xs mt-2">
                  <AlertCircle size={14} /> {errors.url}
                </div>
              )}
            </div>

            <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50">
              <Label className="text-white text-sm font-semibold block mb-4">
                {t("nodes.fields.waitUntil")}
              </Label>
              <Select
                value={formData.waitUntil ?? "domcontentloaded"}
                onValueChange={(val) => handleChange("waitUntil", val)}
              >
                <SelectTrigger className="w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus:ring-[#1a73e8] focus:border-[#1a73e8] !h-16 !text-lg [&>span]:whitespace-normal [&>span]:text-left">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1d2024] border-[#2c2f33]">
                  <SelectItem
                    value="load"
                    className="text-[#e5e5e5] focus:bg-[#2a2f37] focus:text-white rounded py-2 text-base"
                  >
                    load
                  </SelectItem>
                  <SelectItem
                    value="domcontentloaded"
                    className="text-[#e5e5e5] focus:bg-[#2a2f37] focus:text-white rounded py-2 text-base"
                  >
                    domcontentloaded
                  </SelectItem>
                  <SelectItem
                    value="networkidle0"
                    className="text-[#e5e5e5] focus:bg-[#2a2f37] focus:text-white rounded py-2 text-base"
                  >
                    networkidle0
                  </SelectItem>
                  <SelectItem
                    value="networkidle2"
                    className="text-[#e5e5e5] focus:bg-[#2a2f37] focus:text-white rounded py-2 text-base"
                  >
                    networkidle2
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50">
              <Label className="text-white text-sm font-semibold block mb-4">
                {t("nodes.fields.timeout")}
              </Label>
              <Input
                type="number"
                name="timeout"
                value={formData.timeout ?? 20000}
                onChange={handleInputChange}
                min={0}
                className="w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus-visible:ring-[#1a73e8] focus-visible:border-[#1a73e8] !h-16 !text-lg"
              />
            </div>

            <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50">
              <Label className="text-white text-sm font-semibold block mb-4">
                {t("nodes.fields.endpoint")}
              </Label>
              <Input
                type="text"
                name="endpoint"
                value={formData.endpoint ?? ""}
                onChange={handleInputChange}
                className="w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus-visible:ring-[#1a73e8] focus-visible:border-[#1a73e8] !h-16 !text-lg"
              />
            </div>
          </div>
        );
      }

      if (action.type === "manage_tabs") {
        return (
          <div>
            <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50">
              <Label className="text-white text-sm font-semibold block mb-4">
                {t("nodes.fields.action")}
              </Label>
              <Select
                value={formData.action ?? "new"}
                onValueChange={(val) => handleChange("action", val)}
              >
                <SelectTrigger className="w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus:ring-[#1a73e8] focus:border-[#1a73e8] !h-16 !text-lg [&>span]:whitespace-normal [&>span]:text-left">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1d2024] border-[#2c2f33]">
                  <SelectItem
                    value="new"
                    className="text-[#e5e5e5] focus:bg-[#2a2f37] focus:text-white rounded py-2 text-base"
                  >
                    new
                  </SelectItem>
                  <SelectItem
                    value="switch"
                    className="text-[#e5e5e5] focus:bg-[#2a2f37] focus:text-white rounded py-2 text-base"
                  >
                    switch
                  </SelectItem>
                  <SelectItem
                    value="close"
                    className="text-[#e5e5e5] focus:bg-[#2a2f37] focus:text-white rounded py-2 text-base"
                  >
                    close
                  </SelectItem>
                  <SelectItem
                    value="list"
                    className="text-[#e5e5e5] focus:bg-[#2a2f37] focus:text-white rounded py-2 text-base"
                  >
                    list
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.action === "new" && (
              <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50">
                <Label className="text-white text-sm font-semibold block mb-4">
                  {t("nodes.fields.url")} ({t("common.optional")})
                </Label>
                <Input
                  type="text"
                  name="url"
                  value={formData.url ?? ""}
                  onChange={handleInputChange}
                  placeholder="https://www.google.com"
                  className="w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus-visible:ring-[#1a73e8] focus-visible:border-[#1a73e8] !h-16 !text-lg"
                />
              </div>
            )}

            {(formData.action === "switch" || formData.action === "close") && (
              <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50">
                <Label className="text-white text-sm font-semibold block mb-4">
                  {t("nodes.fields.tabIndex")}
                </Label>
                <Input
                  type="number"
                  name="tabIndex"
                  value={formData.tabIndex ?? 0}
                  onChange={handleInputChange}
                  min={0}
                  placeholder="0"
                  className="w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus-visible:ring-[#1a73e8] focus-visible:border-[#1a73e8] !h-16 !text-lg"
                />
              </div>
            )}

            <div className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50">
              <Label className="text-white text-sm font-semibold block mb-4">
                {t("nodes.fields.endpoint")}
              </Label>
              <Input
                type="text"
                name="endpoint"
                value={formData.endpoint ?? ""}
                onChange={handleInputChange}
                className="w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus-visible:ring-[#1a73e8] focus-visible:border-[#1a73e8] !h-16 !text-lg"
              />
            </div>
          </div>
        );
      }

      // fallback generic
      return (
        <div className="space-y-4">
          {Object.keys(formData).map((k) => (
            <div
              key={k}
              className="group relative pb-8 mb-8 last:border-0 border-b border-solid border-[#3a3f47]/50"
            >
              <Label className="text-white text-sm font-semibold block mb-4">
                {k}
              </Label>
              <Input
                type="text"
                name={k}
                value={formData[k] ?? ""}
                onChange={handleInputChange}
                className="w-full bg-[#15181c] border-[#3a3f47] text-[#e5e5e5] focus-visible:ring-[#1a73e8] focus-visible:border-[#1a73e8] !h-16 !text-lg"
              />
            </div>
          ))}
        </div>
      );
    }

    return <div className="space-y-4">{fields.map(renderField)}</div>;
  };

  if (!action) return null;
  const hasErrors = Object.keys(errors).length > 0;
  const canExecute = !hasErrors;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          key="node-config-panel"
          variants={panelVariants.right}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ right: 0, left: "auto" }}
          className="fixed top-[56px] h-[calc(100vh-56px-120px)] w-[360px] bg-[#22262b] border-l border-[#1a1d21] z-20 flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.5)]"
          role="complementary"
        >
          {/* Header */}
          <div className="p-4 mb-6 border-b border-[#0b0c10] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#1a73e8]" />
              <h2 className="text-base font-semibold text-[#ff8c32]">
                {t(`nodes.labels.${action.type}`)}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-[#b0b0b0] hover:text-white hover:bg-[#3c4044] h-8 w-8"
            >
              <XCircle size={18} />
            </Button>
          </div>

          {/* Body */}
          <ScrollArea className="flex-1 bg-[#22262b]">
            <div className="p-10">{renderFields()}</div>

            {/* Error Display */}
            {action?.data?.error && (
              <div className="mx-4 mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-md">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-1">
                  <AlertCircle size={16} />
                  <span>{t("common.execution_error")}</span>
                </div>
                <p className="text-red-300 text-xs font-mono">
                  {(() => {
                    const errorMsg = action.data.error;
                    if (
                      typeof errorMsg === "string" &&
                      errorMsg.includes("<!DOCTYPE")
                    ) {
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(errorMsg, "text/html");
                      const bodyText = doc.body?.textContent?.trim();
                      return bodyText || t("nodes.config.error_server_unknown");
                    }
                    return errorMsg;
                  })()}
                </p>
              </div>
            )}

            {/* Tab List Display */}
            {action?.type === "manage_tabs" &&
              action?.data?.configuration?.action === "list" &&
              action?.data?.result?.data?.tabs && (
                <div className="mx-4 mb-4 p-3 bg-[#1d2024] border border-[#4a4e54] rounded-md">
                  <div className="flex items-center gap-2 text-[#e5e5e5] font-semibold text-sm mb-2">
                    📑{" "}
                    {t("nodes.config.tab_list_title", {
                      count: action.data.result.data.tabs.length,
                    })}
                  </div>
                  <div className="space-y-2">
                    {action.data.result.data.tabs.map((tab, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-2 rounded text-xs font-mono",
                          tab.active
                            ? "bg-[#1a73e8]/20 border border-[#1a73e8]"
                            : "bg-[#0b0c10]",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[#b0b0b0]">#{index}</span>
                          <span
                            className="text-[#e5e5e5] truncate flex-1"
                            title={tab.url}
                          >
                            {tab.url || "about:blank"}
                          </span>
                          {tab.active && (
                            <span className="text-[#1a73e8] text-xs">
                              {t("nodes.config.active_tab")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Screenshot Viewer */}
            {VISUAL_CHANGE_NODES.has(action?.type) && (
              <ScreenshotViewer
                screenshots={action?.data?.screenshots}
                nodeId={action?.nodeId}
                isVisible={isVisible}
              />
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-[#0b0c10] bg-[#25282b] flex gap-2">
            <Button
              onClick={handleExecute}
              disabled={!canExecute}
              className="flex-1 bg-[#1a73e8] hover:bg-[#1565c0] text-white h-9"
            >
              <Play size={14} className="mr-2" />
              {t("common.run")}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-[#4a4e54] text-[#b0b0b0] hover:bg-[#3c4044] hover:text-white h-9 px-3"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleDelete}
              className="h-9 px-3"
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
              }}
            >
              <Trash2 size={14} className="mr-1" />
              {t("common.delete")}
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default React.memo(NodeConfigurationPanel, areEqual);
