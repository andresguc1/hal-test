import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Box,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_CATEGORIES } from "@/config/nodeConstants";
import { getSmartLabel } from "@/config/validationRules";
import { NODE_TYPE_MAP } from "@/config/nodeConstants";
import { buildNodeMetaRows } from "@/utils/nodeMetaRows";

/**
 * Presentational content for the contextual node information bubble.
 * Rendered inside a screen-space overlay (NOT inside the scaled canvas)
 * so it stays readable at any zoom level.
 */
export function NodeTooltipContent({ data, nodeKey, safeConfig, displayLabel, compact }) {
  const cfg = data?.configuration || {};

  const stateMeta = getStateMeta(data?.state);

  const rows = buildNodeMetaRows(nodeKey, cfg, data);

  // Show full URL/selector without truncation
  const categoryLabel = (
    NODE_CATEGORIES[safeConfig?.category]?.label ||
    safeConfig?.category ||
    nodeKey
  ).replace(/[_]/g, " ");

  return (
    <div
      role="tooltip"
      className={cn(
        "pointer-events-auto flex flex-col gap-1.5 rounded-lg",
        "border border-white/15 bg-slate-950/95 backdrop-blur-xl",
        "px-3 py-2.5 text-left shadow-2xl",
        compact ? "w-44" : "w-72",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Box size={12} className="shrink-0 text-sky-300" />
          <span className="truncate text-[11px] font-bold text-white leading-tight">
            {displayLabel}
          </span>
        </div>
        {stateMeta && (
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1 rounded px-1 py-0.5 text-[9px] font-black uppercase tracking-wider text-white",
              stateMeta.bg,
            )}
          >
            {stateMeta.icon}
            {stateMeta.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-sky-300/80">
        <span>{nodeKey}</span>
        {safeConfig?.category && <span className="text-white/30">·</span>}
        <span className="text-white/50">{categoryLabel}</span>
      </div>

      {rows.length > 0 && (
        <div className="mt-0.5 flex flex-col gap-1 border-t border-white/10 pt-1.5">
          {rows.map((row, i) => {
            const RowIcon = row.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] text-white/90 leading-snug"
              >
                {RowIcon && (
                  <RowIcon size={11} className="shrink-0 opacity-70" />
                )}
                <span className="break-all font-mono">{row.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {data?.result && !compact && (
        <div className="border-t border-white/10 pt-1.5 text-[10px] text-white/70">
          <span className="font-semibold text-white/50">result: </span>
          <span className="font-mono break-all">
            {truncateResult(data.result)}
          </span>
        </div>
      )}

      {(data?.error || data?.result?.error) && (
        <div className="flex items-start gap-1.5 border-t border-red-500/20 pt-1.5 text-[10px] text-red-300">
          <AlertCircle size={11} className="mt-0.5 shrink-0" />
          <span className="break-all">{renderTooltipError(data.error || data.result.error)}</span>
        </div>
      )}

      {data?.warnings?.length > 0 && !compact && (
        <div className="flex flex-col gap-1 border-t border-amber-500/20 pt-1.5">
          {data.warnings.slice(0, 3).map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-[10px] text-amber-300"
            >
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              <span className="break-all">
                {typeof w === "string"
                  ? w
                  : w?.message || JSON.stringify(w)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Screen-space overlay tooltip. Anchored to the hovered node's DOM rect so
 * it is positioned OUTSIDE the scaled canvas and stays readable at any zoom.
 */
export default function CanvasNodeTooltip({ anchor, onClose, children }) {
  if (!anchor) return null;

  const TIP_WIDTH = anchor.compact ? 180 : 290;
  const sideGap = 12;

  const anchorLeft = anchor.rect?.left ?? anchor.x ?? 0;
  const anchorRight = anchor.rect?.right ?? anchor.x ?? 0;
  const anchorTop = anchor.rect?.top ?? anchor.y ?? 0;

  const overflowRight = anchorRight + TIP_WIDTH + sideGap > window.innerWidth;
  const left = overflowRight
    ? anchorLeft - TIP_WIDTH - sideGap
    : anchorRight + sideGap;

  const vertical = Math.max(6, Math.min(anchorTop, window.innerHeight - 40));

  return (
    <div
      className="fixed z-[999]"
      style={{ left, top: vertical, maxWidth: "calc(100vw - 24px)" }}
      onMouseEnter={() => {}}
    >
      {children}
      <button
        onClick={onClose}
        aria-label="Close node info"
        className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] text-white shadow-lg hover:bg-slate-500 cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
}

function getStateMeta(state) {
  switch (state) {
    case "success":
      return { label: "ok", icon: <CheckCircle size={9} />, bg: "bg-emerald-500" };
    case "error":
      return { label: "error", icon: <XCircle size={9} />, bg: "bg-red-500" };
    case "running":
    case "executing":
      return { label: "running", icon: <Clock size={9} />, bg: "bg-amber-500" };
    case "warning":
      return { label: "warn", icon: <AlertTriangle size={9} />, bg: "bg-yellow-500" };
    default:
      return null;
  }
}

function truncateResult(result) {
  const raw =
    typeof result === "object"
      ? result?.resolvedValue ?? result?.value ?? JSON.stringify(result)
      : result;
  const s = String(raw ?? "");
  return s.length > 40 ? s.slice(0, 39) + "…" : s || "—";
}

function renderTooltipError(error) {
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    if (typeof error.message === "string") return error.message;
    if (typeof error.code === "string") return error.code;
  }
  return JSON.stringify(error);
}

/**
 * Screen-space overlay tooltip. Anchored to the hovered node's DOM rect so
 * it is positioned OUTSIDE the scaled canvas and stays readable at any zoom.
 *
 * At low zoom (zoom <= 0.5) the tooltip also accepts cursor-following mode:
 * it renders at the current pointer position when a node is under the cursor,
 * making small collapsed nodes inspectable without precise hover targets.
 */
export function CanvasNodeInfoOverlay({
  infoNode,
  anchorRect,
  onClose,
  zoom,
  cursorPos,
}) {
  const anchorRef = React.useRef(null);

  const anchor = anchorRect;
  const lowZoom = zoom <= 0.5;

  if (!infoNode || !anchor) return null;

  const { data, nodeKey } = infoNode;
  const safeConfig = NODE_TYPE_MAP[nodeKey] || {
    category: "default",
    color: "slate",
    icon: Box,
    label: nodeKey,
  };
  const smartLabel = getSmartLabel(nodeKey, data?.configuration);
  const displayLabel =
    data?.customLabel ||
    smartLabel ||
    data?.label ||
    nodeKey;

  const tooltipCursorPos = lowZoom && cursorPos ? cursorPos : null;

  return (
    <div ref={anchorRef} className="pointer-events-none">
      <CanvasNodeTooltip
        anchor={tooltipCursorPos ? { ...tooltipCursorPos, compact: true } : anchor}
        onClose={onClose}
        compact={lowZoom}
      >
        <NodeTooltipContent
          data={data}
          nodeKey={nodeKey}
          safeConfig={safeConfig}
          displayLabel={displayLabel}
          compact={lowZoom}
        />
      </CanvasNodeTooltip>
    </div>
  );
}