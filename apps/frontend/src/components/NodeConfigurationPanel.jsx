// NodeConfigurationPanel.jsx
import React, { useState, useEffect } from "react";
import { XCircle, Play, Trash2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { panelVariants } from "../utils/motion-variants";
import "./styles/NodeConfigurationPanel.css";
import { NODE_FIELD_CONFIGS, VISUAL_CHANGE_NODES } from "./hooks/constants";
import { logger } from "../utils/logger";
import ScreenshotViewer from "./ScreenshotViewer";

// ===============================================
// CRITICAL: Custom comparison function for React.memo
// This function prevents unnecessary re-renders during node dragging.
// If it returns 'true', the re-render is skipped.
const areEqual = (prevProps, nextProps) => {
  // 1. If visibility changes, we must re-render (panel open/closed).
  if (prevProps.isVisible !== nextProps.isVisible) return false;

  // 2. If the selected node changes (id or type), we must re-render (form content).
  if (prevProps.action?.nodeId !== nextProps.action?.nodeId) return false;
  if (prevProps.action?.type !== nextProps.action?.type) return false;

  // 3. If screenshots change, we must re-render
  const prevScreenshots = prevProps.action?.data?.screenshots;
  const nextScreenshots = nextProps.action?.data?.screenshots;
  if (prevScreenshots !== nextScreenshots) return false;

  // 4. We intentionally ignore the 'nodes' prop. Its reference changes constantly
  // during dragging, but the changes don't affect the form if the 'action' is the same.
  // We assume other props (functions) are wrapped in useCallback and are stable.

  return true;
};
// ===============================================

/**
 * Props:
 * - action
 * - isVisible
 * - onExecute(action)
 * - onClose()
 * - onDeleteNode(nodeId)
 * - updateNodeConfiguration(nodeId, newConfig)
 * - nodes  <-- complete LIST of nodes (volatile)
 */
function NodeConfigurationPanel({
  action,
  isVisible,
  onExecute,
  onClose,
  onDeleteNode,
  updateNodeConfiguration,
  nodes = [],
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
    if (fieldConfig.validation) return fieldConfig.validation(value, formData, t);
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setIsDirty(true);
    if (errors[name]) {
      setErrors((prev) => {
        const c = { ...prev };
        delete c[name];
        return c;
      });
    }
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

  // Auto-save logic: Save changes 500ms after the user stops typing
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

    // Build payload according to type
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
      // Additional validation for open_url
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

      // If onExecute exists, delegate entire execution to it and DO NOT fallback to local fetch.
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
        return; // important: avoid local fetch when onExecute exists
      }

      const BACKEND_API_BASE = "http://localhost:2001/api/actions";

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
        alert(t("nodes.config.request_error", { status: resp.status, statusText: resp.statusText }));
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

  const renderField = (fieldConfig) => {
    // Conditional rendering logic
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
      formData[name] ?? (fieldConfig.type === "checkbox" || fieldConfig.type === "boolean" ? false : "");
    const error = errors[name];

    const commonProps = {
      name,
      onChange: handleChange,
      className: error ? "input-error" : "",
    };

    const hintText = hint ? t(`nodes.hints.${name}`, hint) : (i18n.exists(`nodes.hints.${name}`) ? t(`nodes.hints.${name}`) : null);

    if (type === "select") {
      return (
        <div key={name} className="field-group">
          <label>
            {t(`nodes.fields.${name}`, fieldConfig.label)}
            {fieldConfig.required && <span className="required">*</span>}
          </label>
          <select {...commonProps} value={value}>
            <option value="">{t("common.select_default")}</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(`nodes.options.${name}.${opt.value}`, opt.label)}
              </option>
            ))}
          </select>
          {hintText && <p className="field-hint">{hintText}</p>}
          {error && (
            <span className="field-error">
              <AlertCircle size={14} /> {error}
            </span>
          )}
        </div>
      );
    }

    if (type === "checkbox" || type === "boolean") {
      return (
        <div key={name} className="field-group checkbox-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name={name}
              checked={!!value}
              onChange={handleChange}
            />
            <span>{t(`nodes.fields.${name}`, fieldConfig.label)}</span>
          </label>
          {hintText && <p className="field-hint">{hintText}</p>}
          {error && (
            <span className="field-error">
              <AlertCircle size={14} /> {error}
            </span>
          )}
        </div>
      );
    }

    if (type === "number") {
      return (
        <div key={name} className="field-group">
          <label>
            {t(`nodes.fields.${name}`, fieldConfig.label)}
            {fieldConfig.required && <span className="required">*</span>}
          </label>
          <input
            type="number"
            {...commonProps}
            value={value}
            placeholder={t(`nodes.placeholders.${name}`, placeholder)}
            min={min}
            max={max}
          />
          {hintText && <p className="field-hint">{hintText}</p>}
          {error && (
            <span className="field-error">
              <AlertCircle size={14} /> {error}
            </span>
          )}
        </div>
      );
    }

    if (type === "textarea") {
      return (
        <div key={name} className="field-group">
          <label>
            {t(`nodes.fields.${name}`, fieldConfig.label)}
            {fieldConfig.required && <span className="required">*</span>}
          </label>
          <textarea
            {...commonProps}
            value={value}
            placeholder={t(`nodes.placeholders.${name}`, placeholder)}
            rows={4}
          />
          {hintText && <p className="field-hint">{hintText}</p>}
          {error && (
            <span className="field-error">
              <AlertCircle size={14} /> {error}
            </span>
          )}
        </div>
      );
    }

    // default text
    return (
      <div key={name} className="field-group">
        <label>
          {t(`nodes.fields.${name}`, fieldConfig.label)}
          {fieldConfig.required && <span className="required">*</span>}
        </label>
        <input
          type="text"
          {...commonProps}
          value={value}
          placeholder={t(`nodes.placeholders.${name}`, placeholder)}
        />
        {hintText && <p className="field-hint">{hintText}</p>}
        {error && (
          <span className="field-error">
            <AlertCircle size={14} /> {error}
          </span>
        )}
      </div>
    );
  };

  const renderFields = () => {
    const fields = NODE_FIELD_CONFIGS[action?.type] || [];
    if (!action) return null;

    if (!fields || fields.length === 0) {
      if (action.type === "launch_browser") {
        return (
          <>
            <div className="field-group">
              <label>{t("nodes.fields.browserType")}</label>
              <select
                name="browserType"
                value={formData.browserType ?? "chromium"}
                onChange={handleChange}
              >
                <option value="chromium">chromium</option>
                <option value="firefox">firefox</option>
                <option value="webkit">webkit</option>
              </select>
            </div>
            <div className="field-group checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="headless"
                  checked={!!formData.headless}
                  onChange={handleChange}
                />
                {t("nodes.fields.headless")}
              </label>
            </div>
            <div className="field-group checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="maximizeWindow"
                  checked={!!formData.maximizeWindow}
                  onChange={handleChange}
                />
                {t("nodes.fields.maximizeWindow")}
              </label>
            </div>
            <div className="field-group">
              <label>{t("nodes.fields.slowMo")}</label>
              <input
                type="number"
                name="slowMo"
                value={formData.slowMo ?? 0}
                onChange={handleChange}
              />
            </div>
            <div className="field-group">
              <label>{t("nodes.fields.args")}</label>
              <input
                type="text"
                name="args"
                value={formData.args ?? ""}
                onChange={handleChange}
                placeholder="--start-maximized"
              />
            </div>
            <div className="field-group">
              <label>{t("nodes.fields.endpoint")}</label>
              <input
                type="text"
                name="endpoint"
                value={formData.endpoint ?? ""}
                onChange={handleChange}
              />
            </div>
          </>
        );
      }

      if (action.type === "open_url") {
        return (
          <>
            <div className="field-group">
              <label>
                {t("nodes.fields.url")}
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="url"
                value={formData.url ?? ""}
                onChange={handleChange}
                placeholder="https://www.google.com"
                required
                className={errors.url ? "input-error" : ""}
              />
              {errors.url && (
                <span className="field-error">
                  <AlertCircle size={14} /> {errors.url}
                </span>
              )}
            </div>

            <div className="field-group">
              <label>{t("nodes.fields.waitUntil")}</label>
              <select
                name="waitUntil"
                value={formData.waitUntil ?? "domcontentloaded"}
                onChange={handleChange}
              >
                <option value="load">load</option>
                <option value="domcontentloaded">domcontentloaded</option>
                <option value="networkidle0">networkidle0</option>
                <option value="networkidle2">networkidle2</option>
              </select>
            </div>

            <div className="field-group">
              <label>{t("nodes.fields.timeout")}</label>
              <input
                type="number"
                name="timeout"
                value={formData.timeout ?? 20000}
                onChange={handleChange}
                min={0}
              />
            </div>

            <div className="field-group">
              <label>{t("nodes.fields.endpoint")}</label>
              <input
                type="text"
                name="endpoint"
                value={formData.endpoint ?? ""}
                onChange={handleChange}
              />
            </div>
          </>
        );
      }

      if (action.type === "manage_tabs") {
        return (
          <>
            <div className="field-group">
              <label>{t("nodes.fields.action")}</label>
              <select
                name="action"
                value={formData.action ?? "new"}
                onChange={handleChange}
                required
              >
                <option value="new">new</option>
                <option value="switch">switch</option>
                <option value="close">close</option>
                <option value="list">list</option>
              </select>
            </div>

            {formData.action === "new" && (
              <div className="field-group">
                <label>
                  {t("nodes.fields.url")} ({t("common.optional")})
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="url"
                  value={formData.url ?? ""}
                  onChange={handleChange}
                  placeholder="https://www.google.com"
                  required
                />
              </div>
            )}

            {(formData.action === "switch" || formData.action === "close") && (
              <div className="field-group">
                <label>{t("nodes.fields.tabIndex")}</label>
                <input
                  type="number"
                  name="tabIndex"
                  value={formData.tabIndex ?? 0}
                  onChange={handleChange}
                  min={0}
                  placeholder="0"
                  required
                />
              </div>
            )}

            <div className="field-group">
              <label>{t("nodes.fields.endpoint")}</label>
              <input
                type="text"
                name="endpoint"
                value={formData.endpoint ?? ""}
                onChange={handleChange}
              />
            </div>
          </>
        );
      }

      // fallback generic
      return Object.keys(formData).map((k) => (
        <div className="field-group" key={k}>
          <label>{k}</label>
          <input
            type="text"
            name={k}
            value={formData[k] ?? ""}
            onChange={handleChange}
          />
        </div>
      ));
    }

    return fields.map(renderField);
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
          className="config-panel"
          role="complementary"
        >
          <div className="config-header">
            <h2>
              {t("common.configure")}:{" "}
              <span className="node-type">
                {t(`nodes.labels.${action.type}`)}
              </span>
            </h2>
            <button
              className="btn-close-panel"
              onClick={handleClose}
              aria-label={t("common.close_panel")}
            >
              <XCircle size={22} />
            </button>
          </div>

          <div className="config-body">{renderFields()}</div>

          {action?.data?.error && (
            <div className="error-display">
              <div className="error-header">
                <AlertCircle size={20} />
                <span>{t("common.execution_error")}</span>
              </div>
              <div className="error-message">
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
              </div>
            </div>
          )}

          {action?.type === "manage_tabs" &&
            action?.data?.configuration?.action === "list" &&
            action?.data?.result?.data?.tabs && (
              <div className="tab-list-display">
                <div className="tab-list-header">
                  <span>
                    📑{" "}
                    {t("nodes.config.tab_list_title", {
                      count: action.data.result.data.tabs.length,
                    })}
                  </span>
                </div>
                <div className="tab-list-content">
                  {action.data.result.data.tabs.map((tab, index) => (
                    <div
                      key={index}
                      className={`tab-item ${tab.active ? "active" : ""}`}
                    >
                      <div className="tab-index">#{index}</div>
                      <div className="tab-info">
                        <div className="tab-url" title={tab.url}>
                          {tab.url || "about:blank"}
                        </div>
                        {tab.active && (
                          <span className="tab-badge">
                            {t("nodes.config.active_tab")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {VISUAL_CHANGE_NODES.has(action?.type) && (
            <ScreenshotViewer
              screenshots={action?.data?.screenshots}
              nodeId={action?.nodeId}
              isVisible={isVisible}
            />
          )}

          <div className="config-footer">
            <button
              className={`btn-run ${!canExecute ? "disabled" : ""}`}
              onClick={handleExecute}
              disabled={!canExecute}
            >
              <Play size={18} /> {t("common.run")}
            </button>
            <button className="btn-cancel" onClick={handleClose}>
              {t("common.cancel")}
            </button>
            <button className="btn-delete" onClick={handleDelete}>
              <Trash2 size={18} /> {t("common.delete")}
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default React.memo(NodeConfigurationPanel, areEqual);
