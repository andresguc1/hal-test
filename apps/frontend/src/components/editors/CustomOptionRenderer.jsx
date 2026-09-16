import React from "react";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";
import {
  ACTION_CHECK,
  ACTION_NO_CHANGE,
  ACTION_UNCHECK,
  ACTION_SELECT,
  getActionFor,
  setActionFor as setActionForHelper,
  selectAllFor,
  countActions,
} from "./optionActions.js";

const TYPE_BADGE = {
  custom_component: {
    label: "Custom",
    cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  custom: {
    label: "Custom",
    cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
};

const ACTION_BADGE = {
  NO_CHANGE: {
    labelKey: "nodes.config.action_no_change",
    cls: "bg-slate-600/20 text-slate-400 border-slate-600/40",
  },
  CHECK: {
    labelKey: "nodes.config.action_check",
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  UNCHECK: {
    labelKey: "nodes.config.action_uncheck",
    cls: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
  SELECT: {
    labelKey: "nodes.config.action_select",
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
};

const CURRENT_BADGE = {
  checked: {
    labelKey: "nodes.config.current_checked",
    cls: "bg-emerald-500/10 text-emerald-400",
  },
  unchecked: {
    labelKey: "nodes.config.current_unchecked",
    cls: "bg-slate-600/20 text-slate-500",
  },
  unknown: {
    labelKey: "nodes.config.current_unknown",
    cls: "bg-amber-500/10 text-amber-400",
  },
};

export const CustomOptionRenderer = React.memo(
  ({ detectedOptions, config, onChange, t, multiSelect }) => {
    const getAction = React.useCallback(
      (opt) => getActionFor(config, opt),
      [config],
    );
    const isCurrentState = React.useCallback((opt) => {
      if (opt.actualState) return opt.actualState.checked;
      return Boolean(opt.checked || opt.selected);
    }, []);

    const setActionFor = React.useCallback(
      (opt, action) => {
        onChange(setActionForHelper(config, opt, action));
      },
      [config, onChange],
    );

    const selectAll = React.useCallback(() => {
      onChange(selectAllFor(detectedOptions));
    }, [detectedOptions, onChange]);

    const actionCount = countActions(config);
    const enabledCount = detectedOptions.filter(
      (o) => o.enabled !== false,
    ).length;

    return (
      <div className="space-y-2">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
            <Settings size={12} />
            {t("nodes.config.detected_options", "Detected Options")} (
            {detectedOptions.length})
          </span>
          <div className="flex items-center gap-1">
            {multiSelect && enabledCount > 0 && (
              <button
                type="button"
                onClick={selectAll}
                disabled={enabledCount === 0}
                className="px-2 py-0.5 rounded text-[9px] font-semibold text-indigo-400 hover:bg-indigo-500/15 transition-colors disabled:opacity-40"
              >
                {t("nodes.config.all", "All")}
              </button>
            )}
            {actionCount > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                disabled={actionCount === 0}
                className="px-2 py-0.5 rounded text-[9px] font-semibold text-slate-400 hover:bg-slate-500/15 transition-colors disabled:opacity-40"
              >
                {t("nodes.config.clear", "Clear")}
              </button>
            )}
          </div>
        </div>

        {/* Options list */}
        <div className="border border-slate-700/60 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar divide-y divide-slate-800/60">
          {detectedOptions.map((opt, idx) => {
            const current = isCurrentState(opt);
            const badge = TYPE_BADGE[opt.type] || TYPE_BADGE.custom_component;
            const currentBadge =
              CURRENT_BADGE[current ? "checked" : "unchecked"];
            const action = getAction(opt);

            return (
              <div
                key={opt.id || idx}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 hover:bg-slate-800/40 transition-colors",
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
                      {t(
                        currentBadge.labelKey,
                        current ? "Checked" : "Unchecked",
                      )}
                    </span>
                    {opt.actualState && opt.actualState.enabled === false ? (
                      <span className="text-[8px] text-rose-400 px-1 py-px rounded-full bg-rose-500/10">
                        {t("nodes.config.disabled", "disabled")}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[8px] text-slate-600 font-mono truncate mt-0.5">
                    {opt.locator ||
                      `#${opt.containerSelector || "container"} [index ${opt.index}]`}
                  </div>
                </div>

                {/* Action selector - for custom, use SELECT/NO_CHANGE by default */}
                <div className="shrink-0 flex items-center">
                  <div className="flex items-center gap-0.5">
                    {["NO_CHANGE", "SELECT"].map((a) => {
                      const active = action === a;
                      const badge = ACTION_BADGE[a];
                      const isDisabled = opt.enabled === false;
                      return (
                        <button
                          key={a}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setActionFor(opt, a)}
                          title={t(badge.labelKey, a)}
                          className={cn(
                            "px-1.5 py-px rounded text-[9px] font-bold border leading-none transition-colors",
                            active
                              ? badge.cls
                              : "bg-transparent text-slate-600 border-transparent",
                            isDisabled && "opacity-35 cursor-not-allowed",
                          )}
                        >
                          {t(badge.labelKey, a)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

CustomOptionRenderer.displayName = "CustomOptionRenderer";
export default CustomOptionRenderer;
