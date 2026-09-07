import React, { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useTranslation } from "react-i18next";
import {
    RefreshCw,
    Scan,
    CheckSquare,
    MinusSquare,
    ListPlus,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "../../utils/api";
import { useToast } from "../../hooks/useToast";
import {
    mergeConfigOnRefresh,
    countActions,
} from "./optionActions.js";
import { getRenderer, supportsMultiSelect, preloadRenderers } from "./optionRenderers.js";

// Preload renderers on module load
preloadRenderers();

const OptionPickerEditor = React.memo(({ value, onChange, containerSelector }) => {
    const { t } = useTranslation();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [detectedOptions, setDetectedOptions] = useState([]);
    const [groupType, setGroupType] = useState("");
    const [error, setError] = useState(null);
    const [Renderer, setRenderer] = useState(null);

    const config = React.useMemo(() => (Array.isArray(value) ? value : []), [value]);

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

    const runDetect = useCallback(
        async (silent = false) => {
            if (!containerSelector || !containerSelector.trim()) {
                if (!silent) {
                    const msg = t(
                        "nodes.select_option.container_required",
                        "A container selector is required.",
                    );
                    setError(msg);
                    toast.error(msg);
                }
                return;
            }
            setLoading(true);
            setError(null);
            try {
                console.log('[OptionPickerEditor] Running detect for selector:', containerSelector.trim());
                const res = await api.post("/actions/select_option/detect", {
                    containerSelector: containerSelector.trim(),
                    browserId: getBrowserId(),
                });
                const data = res.data || {};
                console.log('[OptionPickerEditor] Detection result:', { found: data.found, groupType: data.groupType, optionsCount: data.options?.length, options: data.options });

                // Merge with existing config to preserve user selections
                const mergedOptions = mergeConfigOnRefresh(config, data.options || []);

                setDetectedOptions(data.options || []);
                setGroupType(data.groupType || "");
                onChange(mergedOptions);

                if (!data.found || !data.options?.length) {
                    const msg = data.message ||
                        t("nodes.select_option.none_found", "No options detected. Check: browser session active, page loaded, selector correct.");
                    setError(msg);
                }
            } catch (err) {
                console.error('[OptionPickerEditor] Detection error:', err);
                setError(
                    err.message ||
                        t("nodes.select_option.detect_failed", "Detection failed."),
                );
                if (!silent) {
                    toast.error(
                        err.message ||
                            t("nodes.select_option.detect_failed", "Detection failed."),
                    );
                }
            } finally {
                setLoading(false);
            }
        },
        [containerSelector, getBrowserId, t, toast, config, onChange],
    );

    // Auto-detect on container change (debounced)
    const detectTimeoutRef = useRef(null);
    useEffect(() => {
        if (!containerSelector || !containerSelector.trim()) return;
        if (detectTimeoutRef.current) clearTimeout(detectTimeoutRef.current);
        detectTimeoutRef.current = setTimeout(() => {
            runDetect(true);
        }, 800);
        return () => {
            if (detectTimeoutRef.current) clearTimeout(detectTimeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerSelector]);

    const actionCount = countActions(config);
    const multiSelect = supportsMultiSelect(groupType);
    const missingCount = config.filter((c) => c._missing).length;

    const renderMissingBadge = () => {
        if (missingCount === 0) return null;
        return (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle size={10} />
                {t('nodes.config.missing_options', '{count} option(s) missing', { count: missingCount })}
            </span>
        );
    };

    return (
        <div className="space-y-3 mt-1">
            {/* Header */}
            <div className="flex items-center justify-between">
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
                        {detectedOptions.length} {t("nodes.config.options_count", "options")}
                    </span>
                    {actionCount > 0 && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full">
                            {actionCount} {t("nodes.config.actions_count", "actions")}
                        </span>
                    )}
                    {renderMissingBadge()}
                    {detectedOptions.length > 0 && (
                        <button
                            type="button"
                            onClick={() => runDetect(false)}
                            disabled={loading}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={11} className={cn(loading && "animate-spin")} />
                            {t("nodes.config.refresh", "Refresh")}
                        </button>
                    )}
                </div>
            </div>

            

            {error && (
                <div className="px-2 py-1.5 rounded-md text-[10px] text-rose-300 bg-rose-500/10 border border-rose-500/20">
                    {error}
                </div>
            )}

            {!detectedOptions.length && !loading && !groupType && (
                <div className="px-3 py-2.5 rounded-md border border-dashed border-slate-700 text-[10px] text-slate-500 flex items-center gap-2">
                    <ListPlus size={13} className="text-slate-600" />
                    {t(
                        "nodes.select_option.detect_hint",
                        "Enter a container selector. Auto-detect runs after 800ms. Ensure a browser session is active and the page is loaded.",
                    )}
                </div>
            )}

            {error && !detectedOptions.length && !loading && (
                <button
                    type="button"
                    onClick={() => runDetect(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-[10px] font-bold text-indigo-100 bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                    <RefreshCw size={12} />
                    {t("nodes.config.retry_detect", "Retry Detection")}
                </button>
            )}

            {/* Renderer - show when we have detected options */}
            {detectedOptions.length > 0 && Renderer && (
                <Suspense fallback={
                    <div className="px-3 py-4 text-center text-slate-500 text-[10px]">
                        {t('nodes.config.loading_renderer', 'Loading renderer...')}
                    </div>
                }>
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
                    {t('nodes.config.loading_renderer', 'Loading renderer...')}
                </div>
            )}
        </div>
    );
});

OptionPickerEditor.displayName = "OptionPickerEditor";
export default OptionPickerEditor;