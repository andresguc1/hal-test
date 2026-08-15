import React, { useState } from "react";
import { Zap, ChevronDown, ChevronUp, Check, Copy, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Renders after a successful element pick, showing:
 * - The selector type / strategy used
 * - Whether AI optimized the result
 * - All alternative candidate locators with priority badges
 * - A "Use this" button for each alternative
 */
export const SelectorResultPanel = ({ selectorMeta, onApplyAlternative }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  if (!selectorMeta?.candidates) return null;

  const TYPE_META = {
    playwrightTestId: {
      label: "getByTestId",
      badge: t("picker.badge_pw_best", "⚡ PW Best"),
      badgeClass: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
      isPlaywright: true,
    },
    playwrightRole: {
      label: "getByRole",
      badge: t("picker.badge_pw", "⚡ PW"),
      badgeClass: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
      isPlaywright: true,
    },
    playwrightText: {
      label: "getByText",
      badge: t("picker.badge_pw", "⚡ PW"),
      badgeClass: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
      isPlaywright: true,
    },
    playwrightLabel: {
      label: "getByPlaceholder",
      badge: t("picker.badge_pw", "⚡ PW"),
      badgeClass: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
      isPlaywright: true,
    },
    testId: {
      label: "data-testid (CSS)",
      badge: t("picker.badge_stable", "✓ Stable"),
      badgeClass: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
      isPlaywright: false,
    },
    id: {
      label: "#id",
      badge: t("picker.badge_stable", "✓ Stable"),
      badgeClass: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
      isPlaywright: false,
    },
    name: {
      label: "input[name]",
      badge: t("picker.badge_form", "Form"),
      badgeClass: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
      isPlaywright: false,
    },
    aria: {
      label: "aria-label (CSS)",
      badge: t("picker.badge_a11y", "A11y"),
      badgeClass: "bg-sky-500/15 text-sky-400 border border-sky-500/20",
      isPlaywright: false,
    },
    text: {
      label: "XPath text",
      badge: t("picker.badge_fragile", "⚠ Fragile"),
      badgeClass: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
      isPlaywright: false,
    },
    cssPath: {
      label: "CSS Path",
      badge: t("picker.badge_fragile", "⚠ Fragile"),
      badgeClass: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
      isPlaywright: false,
    },
  };

  const candidates = Object.entries(selectorMeta.candidates)
    .filter(([, v]) => v && typeof v === "string")
    .map(([type, value]) => ({
      type,
      value,
      meta: TYPE_META[type] || {
        label: type,
        badge: "?",
        badgeClass: "bg-slate-500/15 text-slate-400",
        isPlaywright: false,
      },
    }));

  // Sort: Playwright first, then by TYPE_META insertion order
  const typeOrder = Object.keys(TYPE_META);
  candidates.sort(
    (a, b) =>
      (typeOrder.indexOf(a.type) === -1 ? 99 : typeOrder.indexOf(a.type)) -
      (typeOrder.indexOf(b.type) === -1 ? 99 : typeOrder.indexOf(b.type)),
  );

  const handleCopy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // clipboard not available
    }
  };

  const isAI = selectorMeta.aiOptimized;
  const typeLabel =
    TYPE_META[selectorMeta.selectorType]?.label || selectorMeta.selectorType;
  const alternativeCount = candidates.length - 1;

  return (
    <div className="mt-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 overflow-hidden text-xs">
      {/* ── Header row ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-indigo-500/10 transition-colors"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          {isAI ? (
            <Sparkles size={10} className="text-violet-400 shrink-0" />
          ) : (
            <Zap size={10} className="text-indigo-400 shrink-0" />
          )}
          <span className="font-semibold text-slate-300 truncate">
            {isAI
              ? t("picker.ai_optimized", "AI Optimized")
              : t("picker.captured", "Selector capturado")}
          </span>
          <span className="text-slate-500 font-mono shrink-0">
            &middot; {typeLabel}
          </span>
          {alternativeCount > 0 && (
            <span className="ml-1 text-[9px] text-indigo-500 shrink-0">
              +{alternativeCount} {t("picker.alternatives_short", "alt")}
            </span>
          )}
        </span>
        {candidates.length > 1 &&
          (expanded ? (
            <ChevronUp size={10} className="text-slate-500 shrink-0" />
          ) : (
            <ChevronDown size={10} className="text-slate-500 shrink-0" />
          ))}
      </button>

      {/* ── Candidate list ── */}
      {expanded && candidates.length > 0 && (
        <div className="border-t border-indigo-500/15 divide-y divide-indigo-500/10">
          {candidates.map(({ type, value, meta }) => (
            <div
              key={type}
              className="flex items-start gap-2 px-2.5 py-1.5 group hover:bg-indigo-500/10 transition-colors"
            >
              {/* Labels & value */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-px rounded-full ${meta.badgeClass}`}
                  >
                    {meta.badge}
                  </span>
                  <span className="text-[9px] text-slate-500">{meta.label}</span>
                </div>
                <p className="text-[10px] font-mono text-slate-300 truncate leading-snug">
                  {value}
                </p>
              </div>

              {/* Action buttons — appear on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleCopy(value, type)}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded"
                  title={t("picker.copy", "Copiar")}
                >
                  {copiedKey === type ? (
                    <Check size={10} className="text-emerald-400" />
                  ) : (
                    <Copy size={10} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onApplyAlternative?.(value, type)}
                  className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-indigo-500/20 transition-colors"
                >
                  <Check size={9} />
                  {t("picker.use_this", "Usar")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
