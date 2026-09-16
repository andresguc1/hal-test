import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  Suspense,
} from "react";
import { useTranslation } from "react-i18next";
import { Scan, ListPlus, AlertTriangle, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "../../utils/api";
import { useToast } from "../../hooks/useToast";
import { mergeConfigOnRefresh, countActions } from "./optionActions.js";
import {
  getRenderer,
  supportsMultiSelect,
  inferGroupType,
  preloadRenderers,
} from "./optionRenderers.js";

// Preload renderers on module load
preloadRenderers();

const enrichWithGroupType = (options, groupType) =>
  (options || []).map((opt) => (opt.groupType ? opt : { ...opt, groupType }));

const OptionPickerEditor = React.memo(
  ({
    value,
    onChange,
    containerSelector,
    detectedOptions: persistedDetectedOptions,
    onDetectedOptionsChange,
    staticHtml,
    onStaticHtmlChange,
  }) => {
    const { t } = useTranslation();
    const toast = useToast();

    const persistedAtMount = persistedDetectedOptions || [];

    const [loading, setLoading] = useState(false);
    const [detectedOptions, setDetectedOptions] = useState(() =>
      enrichWithGroupType(persistedAtMount, inferGroupType(persistedAtMount)),
    );
    const [groupType, setGroupType] = useState(() =>
      inferGroupType(persistedAtMount),
    );
    const [notice, setNotice] = useState(null);
    const [Renderer, setRenderer] = useState(null);

    const config = React.useMemo(
      () => (Array.isArray(value) ? value : []),
      [value],
    );

    // Re-sync the local view whenever the persisted detected options change
    // externally (node switch, form reset, undo). A fresh scan writes the same
    // data back through onDetectedOptionsChange, so this stays idempotent and
    // never clobbers a scan the user just performed.
    const persistedSnapshotRef = useRef(
      JSON.stringify(persistedDetectedOptions || []),
    );
    useEffect(() => {
      const next = JSON.stringify(persistedDetectedOptions || []);
      const prev = persistedSnapshotRef.current;
      persistedSnapshotRef.current = next;
      if (next === prev) return;

      const persisted = persistedDetectedOptions || [];
      const group = inferGroupType(persisted);
      setDetectedOptions(enrichWithGroupType(persisted, group));
      setGroupType(group);
      setNotice(null);
    }, [persistedDetectedOptions]);

    const getBrowserId = useCallback(() => {
      return localStorage.getItem("lastBrowserId") || null;
    }, []);

    // Load renderer when groupType changes
    const loadRenderer = useCallback(async (type) => {
      if (!type) {
        setRenderer(null);
        return;
      }
      const Component = await getRenderer(type);
      setRenderer(() => Component);
    }, []);

    useEffect(() => {
      loadRenderer(groupType);
    }, [groupType, loadRenderer]);

    // Capture page content from the active browser session (for static detection of native <select>)
    const capturePageContent = useCallback(async () => {
      const browserId = getBrowserId();
      if (!browserId) {
        setNotice(
          t(
            "nodes.select_option.no_browser",
            "No active browser session. Launch a browser first.",
          ),
        );
        return;
      }
      setLoading(true);
      setNotice(null);
      try {
        const res = await api.post("/actions/select_option/page_content", {
          browserId,
        });
        const data = res.data || {};
        if (data.html && onStaticHtmlChange) {
          onStaticHtmlChange(data.html);
          toast.success(
            t(
              "nodes.select_option.page_captured",
              "Page content captured for static detection.",
            ),
          );
        }
      } catch (err) {
        console.error("[OptionPickerEditor] Capture page error:", err);
        setNotice(
          err.message ||
            t(
              "nodes.select_option.capture_failed",
              "Failed to capture page content.",
            ),
        );
      } finally {
        setLoading(false);
      }
    }, [getBrowserId, t, toast, onStaticHtmlChange]);

    // Explicit, user-triggered scan. Never hides or resets what the user has
    // already configured: a failed/empty scan only shows a quiet notice.
    const scanOptions = useCallback(async () => {
      const selector = (containerSelector || "").trim();
      if (!selector) {
        setNotice(
          t(
            "nodes.select_option.container_required",
            "Enter the container selector first.",
          ),
        );
        return;
      }
      setLoading(true);
      setNotice(null);
      try {
        const payload = {
          containerSelector: selector,
          browserId: getBrowserId(),
        };
        // Include staticHtml if available (for static detection of native selects)
        if (staticHtml) {
          payload.staticHtml = staticHtml;
        }

        const res = await api.post("/actions/select_option/detect", payload);
        const responseBody = res.data || {};
        const resultData = responseBody.data || {};
        const { groupType: newGroupType = "", options = [] } = resultData;
        const hasOptions = Array.isArray(options) && options.length > 0;

        if (hasOptions) {
          // Attach groupType to every option so the saved configuration is
          // self-contained and the node runs deterministically at execution time.
          const enriched = enrichWithGroupType(options, newGroupType);
          const merged = mergeConfigOnRefresh(config, enriched);

          setDetectedOptions(enriched);
          setGroupType(newGroupType || "");
          // Merge keeps the user's configured actions, preserving them on re-scan.
          onChange(merged);
          if (onDetectedOptionsChange) {
            onDetectedOptionsChange(enriched);
          }
        } else {
          // Non-blocking: keep whatever options/actions the user already has.
          setNotice(
            responseBody.message ||
              resultData.message ||
              t(
                "nodes.select_option.no_options_notice",
                "No options could be read right now. Make sure the browser is open at the page and press Scan again. Your configured actions are preserved.",
              ),
          );
        }
      } catch (err) {
        console.error("[OptionPickerEditor] Scan error:", err);
        setNotice(
          err.message ||
            t(
              "nodes.select_option.scan_notice",
              "Could not read the page right now. Press Scan again when the browser is open; your configured actions are preserved.",
            ),
        );
      } finally {
        setLoading(false);
      }
    }, [
      containerSelector,
      staticHtml,
      config,
      getBrowserId,
      onChange,
      onDetectedOptionsChange,
      t,
    ]);

    const actionCount = countActions(config);
    const multiSelect = supportsMultiSelect(groupType);
    const missingCount = config.filter((c) => c._missing).length;

    const renderMissingBadge = () => {
      if (missingCount === 0) return null;
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle size={10} />
          {t("nodes.config.missing_options", "{count} option(s) missing", {
            count: missingCount,
          })}
        </span>
      );
    };

    const hasSelector = Boolean(containerSelector && containerSelector.trim());

    return (
      <div className="space-y-3 mt-1">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] uppercase tracking-[0.2em] font-black text-indigo-400 flex items-center gap-2">
            <Scan size={13} />
            {t("nodes.config.select_options", "Options")}
            {groupType && (
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400/80 px-1.5 py-0.5 rounded-full capitalize">
                {groupType}
              </span>
            )}
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] bg-slate-700/40 text-slate-300 px-1.5 py-0.5 rounded-full">
              {detectedOptions.length}{" "}
              {t("nodes.config.options_count", "options")}
            </span>
            {actionCount > 0 && (
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full">
                {actionCount} {t("nodes.config.actions_count", "actions")}
              </span>
            )}
            {renderMissingBadge()}
            {/* Capture Page - only when a browser session exists and no static HTML yet */}
            {getBrowserId() && !staticHtml && (
              <button
                type="button"
                onClick={capturePageContent}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                title={t(
                  "nodes.select_option.capture_page_title",
                  "Capture current page HTML for static detection (native <select> only)",
                )}
              >
                <Database size={11} className={cn(loading && "animate-spin")} />
                {t("nodes.select_option.capture_page", "Capture Page")}
              </button>
            )}
            {/* Scan - explicit, user-controlled */}
            <button
              type="button"
              onClick={scanOptions}
              disabled={loading || !hasSelector}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
              title={t(
                "nodes.select_option.scan_title",
                "Read the available options from the container.",
              )}
            >
              <Scan size={11} className={cn(loading && "animate-spin")} />
              {t("nodes.select_option.scan", "Scan")}
            </button>
          </div>
        </div>

        {notice && (
          <div className="px-2 py-1.5 rounded-md text-[10px] text-slate-400 bg-slate-500/10 border border-slate-600/30">
            {notice}
          </div>
        )}

        {!detectedOptions.length && !loading && (
          <div className="px-3 py-2.5 rounded-md border border-dashed border-slate-700 text-[10px] text-slate-500 flex items-center gap-2">
            <ListPlus size={13} className="text-slate-600" />
            <span>
              {t(
                "nodes.select_option.detect_hint",
                "Enter the container selector and press Scan to read the available options, then choose an action for each one. Your configuration is saved with the node.",
              )}
            </span>
          </div>
        )}

        {/* Renderer - always visible while there are options, so actions stay editable */}
        {detectedOptions.length > 0 && Renderer && (
          <Suspense
            fallback={
              <div className="px-3 py-4 text-center text-slate-500 text-[10px]">
                {t("nodes.config.loading_renderer", "Loading renderer...")}
              </div>
            }
          >
            <Renderer
              detectedOptions={detectedOptions}
              config={config}
              onChange={onChange}
              t={t}
              multiSelect={multiSelect}
            />
          </Suspense>
        )}

        {/* Loading state for renderer */}
        {detectedOptions.length > 0 && !Renderer && (
          <div className="px-3 py-4 text-center text-slate-500 text-[10px]">
            {t("nodes.config.loading_renderer", "Loading renderer...")}
          </div>
        )}
      </div>
    );
  },
);

OptionPickerEditor.displayName = "OptionPickerEditor";
export default OptionPickerEditor;
