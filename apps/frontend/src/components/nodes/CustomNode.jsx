/**
 * Custom Node Component for ReactFlow
 * Memoized to prevent unnecessary re-renders
 * Refactored to use design tokens and Tailwind for consistency
 */

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  NODE_STATES,
  PROFESSIONAL_COLORS,
  CATEGORY_COLORS,
} from "../hooks/flowStyles";
import { NODE_TYPE_TO_CATEGORY } from "../hooks/constants";
import { getNodeIcon, CATEGORY_ICONS } from "./nodeIcons";
import "./CustomNode.css";

/**
 * Custom node component with optimized rendering
 *
 * @param {Object} props - Node props from ReactFlow
 * @param {Object} props.data - Node data
 * @param {boolean} props.selected - Whether node is selected
 * @param {string} props.id - Node ID
 */
function CustomNode({ data, selected }) {
  const { t } = useTranslation();
  const state = data?.state || NODE_STATES.DEFAULT;

  // Determine category
  const categoryKey = NODE_TYPE_TO_CATEGORY[data?.type] || "default";
  const categoryColor = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default;

  // Get node-specific icon or fall back to category icon
  const NodeIconComponent = getNodeIcon(data?.type, categoryKey);

  // Determine state badge icon
  const getStateBadge = () => {
    switch (state) {
      case NODE_STATES.EXECUTING:
        return <Loader2 size={14} className="text-white animate-spin" />;
      case NODE_STATES.SUCCESS:
        return <CheckCircle size={14} className="text-white" />;
      case NODE_STATES.ERROR:
        return <XCircle size={14} className="text-white" />;
      default:
        return null;
    }
  };

  // Get state-specific Tailwind classes
  const getStateClasses = () => {
    switch (state) {
      case NODE_STATES.SUCCESS:
        return "border-t-hal-success-500 border-r-hal-success-500 border-b-hal-success-500 shadow-[0_4px_0_rgb(var(--hal-success-700))] hover:shadow-[0_0_12px_rgba(16,185,129,0.4)]";
      case NODE_STATES.ERROR:
        return "border-t-hal-error-500 border-r-hal-error-500 border-b-hal-error-500 shadow-[0_4px_0_rgb(var(--hal-error-700))] hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-shake-error";
      case NODE_STATES.EXECUTING:
        return "border-t-hal-warning-500 border-r-hal-warning-500 border-b-hal-warning-500 shadow-[0_4px_0_rgb(var(--hal-warning-700))] animate-pulse-technical";
      case NODE_STATES.SKIPPED:
        return "border-t-hal-neutral-600 border-r-hal-neutral-600 border-b-hal-neutral-600 shadow-[0_4px_0_rgb(var(--hal-neutral-700))] opacity-60";
      default:
        return "border-t-hal-neutral-700 border-r-hal-neutral-700 border-b-hal-neutral-700 shadow-[0_4px_0_rgb(var(--hal-neutral-800))]";
    }
  };

  // Selected state classes
  const selectedClasses = selected
    ? "shadow-[0_6px_0_rgb(var(--hal-warning-600)),0_0_0_3px_rgba(245,158,11,0.4)] scale-105"
    : "";

  // Badge background color
  const getBadgeColor = () => {
    switch (state) {
      case NODE_STATES.SUCCESS:
        return "bg-hal-success-500";
      case NODE_STATES.ERROR:
        return "bg-hal-error-500";
      case NODE_STATES.EXECUTING:
        return "bg-hal-warning-500";
      default:
        return "bg-transparent";
    }
  };

  return (
    <div
      className={cn(
        // Base styles
        "custom-node relative",
        "bg-gradient-to-br from-hal-neutral-900 to-hal-neutral-950",
        "border-2 border-t-2 border-r-2 border-b-[3px]",
        "rounded-xl p-3",
        "w-[200px] min-h-[70px]",
        "flex flex-col gap-2",
        "cursor-pointer overflow-visible",
        "transition-all duration-200 ease-in-out",
        "text-hal-neutral-100",
        // State-specific styling
        getStateClasses(),
        // Selected state
        selectedClasses,
      )}
      style={{
        borderLeftWidth: "5px",
        borderLeftColor: categoryColor,
      }}
      title={data?.label + (data?.description ? `\n${data.description}` : "")}
    >
      {/* Input Handle - Left */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-[10px] h-[10px] border-2 border-white"
        style={{ background: categoryColor }}
      />

      {/* State Badge */}
      {getStateBadge() && (
        <div
          className={cn(
            "absolute -top-1.5 -right-1.5",
            "w-[26px] h-[26px]",
            "rounded-full",
            "flex items-center justify-center",
            "shadow-md",
            getBadgeColor(),
          )}
        >
          {getStateBadge()}
        </div>
      )}

      {/* Node Header with Icon and Label */}
      <div className="flex items-center gap-2.5 flex-1">
        <NodeIconComponent
          size={20}
          strokeWidth={2.5}
          className="flex-shrink-0"
          style={{ color: categoryColor }}
        />
        <span className="text-sm font-semibold leading-tight flex-1 overflow-hidden text-ellipsis line-clamp-2">
          {t(`nodes.labels.${data?.type}`) || data?.label || "Node"}
        </span>
      </div>

      {/* Output Handle - Right */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-[10px] h-[10px] border-2 border-white"
        style={{ background: categoryColor }}
      />
    </div>
  );
}

/**
 * Comparison function for React.memo
 * Only re-render if these props change
 */
function arePropsEqual(prevProps, nextProps) {
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.data?.state === nextProps.data?.state &&
    prevProps.data?.label === nextProps.data?.label &&
    prevProps.data?.description === nextProps.data?.description &&
    prevProps.data?.error === nextProps.data?.error
  );
}

// Export memoized component
export default memo(CustomNode, arePropsEqual);
