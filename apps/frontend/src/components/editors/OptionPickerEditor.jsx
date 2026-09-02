import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  RefreshCw,
  Scan,
  CheckSquare,
  MinusSquare,
  ListPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "../../utils/api";
import { useToast } from "../../hooks/useToast";
import {
  ACTION_CHECK,
  ACTION_NO_CHANGE,
  ACTION_UNCHECK,
  getActionFor,
  setActionFor as setActionForHelper,
  selectAllFor,
  countActions,
} from "./optionActions.js";

const TYPE_BADGE = {
  select: { label: "Select", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  "select-multi": { label: "Select", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  checkbox: { label: "Checkbox", cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  "checkbox-role": { label: "Checkbox", cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  radio: { label: "Radio", cls: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30" },
  "radio-role": { label: "Radio", cls: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30" },
  list: { label: "List", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

const ACTION_BADGE = {
  NO_CHANGE: {
    labelKey: "nodes.config.action_no_change",
    cls: "bg-slate-600/20 text-slate-400 border-slate-600/40",
  },
  CHECK: { labelKey: "nodes.config.action_check", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  UNCHECK: { labelKey: "nodes.config.action_uncheck", cls: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
};

const CURRENT_BADGE = {
  checked: { labelKey: "nodes.config.current_checked", cls: "bg-emerald-500/10 text-emerald-400" },
  unchecked: { labelKey: "nodes.config.current_unchecked", cls: "bg-slate-600/20 text-slate-500" },
  unknown: { labelKey: "nodes.config.current_unknown", cls: "bg-amber-500/10 text-amber-400" },
};

const OptionPickerEditor = React.memo(({ value, onChange, containerSelector }) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [detectedOptions, setDetectedOptions] = useState([]);
  const [groupType, setGroupType] = useState("");
  const [error, setError] = useState(null);

  const config = React.useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const getBrowserId = useCallback(() => {
    return localStorage.getItem("lastBrowserId") || null;
  }, []);

  // Resolve the current action configured for an option (default NO_CHANGE).
  const getAction = useCallback(
    (opt) => getActionFor(config, opt),
    [config],
  );

  const isCurrentState = useCallback((opt) => {
    if (opt.actualState) return opt.actualState.checked;
    return Boolean(opt.checked || opt.selected);
  }, []);

  const setActionFor = useCallback(
    (opt, action) => {
      onChange(setActionForHelper(config, opt, action));
    },
    [config, onChange],
  );

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
        const res = await api.post("/actions/select_option/detect", {
          containerSelector: containerSelector.trim(),
          browserId: getBrowserId(),
        });
        const data = res.data || {};
        setDetectedOptions(data.options || []);
        setGroupType(data.groupType || "");
        if (!data.found || !data.options?.length) {
          setError(
            data.message ||
              t("nodes.select_option.none_found", "No options detected."),
          );
        }
      } catch (err) {
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
    [containerSelector, getBrowserId, t, toast],
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

  const selectAll = useCallback(() => {
    onChange(selectAllFor(detectedOptions));
  }, [detectedOptions, onChange]);

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const actionCount = countActions(config);
  const enabledCount = detectedOptions.filter((o) => o.enabled !== false).length;

  const renderActionControl = (opt) => {
    const action = getAction(opt);
    const options = [ACTION_NO_CHANGE, ACTION_CHECK, ACTION_UNCHECK];
    return (
      <div className="flex items-center gap-0.5">
        {options.map((a) => {
          const active = action === a;
          const badge = ACTION_BADGE[a];
          const isRadio = opt.type === "radio" || opt.type === "radio-role";
          const isSelect = opt.type === "select" || opt.type === "select-multi";
          const disabledForUncheck = a === ACTION_UNCHECK && isRadio;
          const disabledForCheck = a === ACTION_CHECK && isSelect;
          const isDisabled = opt.enabled === false || disabledForUncheck || disabledForCheck;
          return (
            <button
              key={a}
              type="button"
              disabled={isDisabled}
              onClick={() => setActionFor(opt, a)}
              title={t(badge.labelKey, a)}
              className={cn(
                "px-1.5 py-px rounded text-[9px] font-bold border leading-none transition-colors",
                active ? badge.cls : "bg-transparent text-slate-600 border-transparent",
                isDisabled && "opacity-35 cursor-not-allowed",
              )}
            >
              {t(badge.labelKey, a)}
            </button>
          );
        })}
      </div>
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

      {/* Detect button */}
      <button
        type="button"
        onClick={() => runDetect(false)}
        disabled={loading || !containerSelector?.trim()}
        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-[10px] font-bold text-indigo-100 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-colors"
      >
        {loading ? (
          <RefreshCw size={12} className="animate-spin" />
        ) : (
          <Scan size={12} />
        )}
        {t("nodes.config.detect", "Detect Options")}
      </button>

      {error && (
        <div className="px-2 py-1.5 rounded-md text-[10px] text-rose-300 bg-rose-500/10 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Legend */}
      {detectedOptions.length > 0 && (
        <div className="flex items-center gap-3 text-[8px] uppercase tracking-wide text-slate-500 px-0.5">
          <span>{t("nodes.config.current_label", "Current")}</span>
          <span className="flex-1" />
          <span>{t("nodes.config.action_label", "Action")}</span>
        </div>
      )}

      {/* Detected options preview */}
      {detectedOptions.length > 0 && (
        <div className="border border-slate-700/60 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/60">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              {t("nodes.config.detected_options", "Detected Options")} (
              {detectedOptions.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={selectAll}
                disabled={enabledCount === 0}
                className="px-2 py-0.5 rounded text-[9px] font-semibold text-indigo-400 hover:bg-indigo-500/15 transition-colors disabled:opacity-40"
              >
                <CheckSquare size={10} className="inline mr-0.5" />
                {t("nodes.config.all", "All")}
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={actionCount === 0}
                className="px-2 py-0.5 rounded text-[9px] font-semibold text-slate-400 hover:bg-slate-500/15 transition-colors disabled:opacity-40"
              >
                <MinusSquare size={10} className="inline mr-0.5" />
                {t("nodes.config.clear", "Clear")}
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar divide-y divide-slate-800/60">
            {detectedOptions.map((opt, idx) => {
              const current = isCurrentState(opt);
              const badge = TYPE_BADGE[opt.type] || TYPE_BADGE.list;
              const currentBadge = CURRENT_BADGE[current ? "checked" : "unchecked"];
              return (
                <div
                  key={opt.id || idx}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2 hover:bg-slate-800/40 transition-colors",
                    opt.enabled === false && "opacity-45",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-200 truncate">
                        {opt.label ||
                          `${t("nodes.config.option", "Option")} ${idx + 1}`}
                      </span>
                      <span
                        className={cn(
                          "text-[8px] px-1 py-px rounded border leading-none shrink-0",
                          badge.cls,
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={cn(
                          "text-[8px] px-1.5 py-px rounded-full leading-none",
                          currentBadge.cls,
                        )}
                      >
                        {t("nodes.config.current_label", "Current")}:{" "}
                        {t(currentBadge.labelKey, current ? "Checked" : "Unchecked")}
                      </span>
                      {opt.actualState && opt.actualState.enabled === false ? (
                        <span className="text-[8px] text-rose-400 px-1 py-px rounded-full bg-rose-500/10">
                          {t("nodes.config.disabled", "disabled")}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[8px] text-slate-600 font-mono truncate mt-0.5">
                      {opt.locator || `#${containerSelector} [index ${opt.index}]`}
                    </div>
                  </div>
                  {/* Action selector */}
                  <div className="shrink-0 flex items-center">
                    {renderActionControl(opt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!detectedOptions.length && !loading && (
        <div className="px-3 py-2.5 rounded-md border border-dashed border-slate-700 text-[10px] text-slate-500 flex items-center gap-2">
          <ListPlus size={13} className="text-slate-600" />
          {t(
            "nodes.select_option.detect_hint",
            "Enter a container selector and press “Detect Options” to scan for checkboxes, radios, selects, listboxes or custom options.",
          )}
        </div>
      )}
    </div>
  );
});

OptionPickerEditor.displayName = "OptionPickerEditor";
export default OptionPickerEditor;