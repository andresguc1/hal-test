/**
 * Custom Node Component for ReactFlow
 * Memoized to prevent unnecessary re-renders
 */

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Play, CheckCircle, XCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  NODE_STATES,
  PROFESSIONAL_COLORS,
  CATEGORY_COLORS,
} from "../hooks/flowStyles";
import { NODE_TYPE_TO_CATEGORY } from "../hooks/constants";
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
  const colors =
    PROFESSIONAL_COLORS[state] || PROFESSIONAL_COLORS[NODE_STATES.DEFAULT];

  // Determine icon based on state
  const getIcon = () => {
    switch (state) {
      case NODE_STATES.EXECUTING:
        return <Clock size={16} className="node-icon spinning" />;
      case NODE_STATES.SUCCESS:
        return <CheckCircle size={16} className="node-icon" />;
      case NODE_STATES.ERROR:
        return <XCircle size={16} className="node-icon" />;
      default:
        return <Play size={16} className="node-icon" />;
    }
  };

  // Determine category color
  const categoryKey = NODE_TYPE_TO_CATEGORY[data?.type] || "default";
  const categoryColor = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default;

  // Define state colors for 3D effect
  const stateColors = {
    [NODE_STATES.DEFAULT]: { border: colors.border, shadow: "#94a3b8" }, // Slate-400
    [NODE_STATES.EXECUTING]: { border: "#eab308", shadow: "#ca8a04" }, // Yellow-500/600
    [NODE_STATES.SUCCESS]: { border: "#22c55e", shadow: "#15803d" }, // Green-500/700
    [NODE_STATES.ERROR]: { border: "#ef4444", shadow: "#b91c1c" }, // Red-500/700
    [NODE_STATES.SKIPPED]: { border: "#64748b", shadow: "#475569" }, // Slate-500/600
  };

  const currentStateColor =
    stateColors[state] || stateColors[NODE_STATES.DEFAULT];
  const borderColor = selected
    ? colors.selectedBorder
    : currentStateColor.border;
  const shadowColor = selected
    ? colors.selectedBorder
    : currentStateColor.shadow;

  const nodeStyle = {
    background: colors.background,
    borderTop: `2px solid ${borderColor}`,
    borderRight: `2px solid ${borderColor}`,
    borderBottom: `2px solid ${borderColor}`,
    borderLeft: `6px solid ${categoryColor}`, // Category accent
    color: colors.text,
    padding: "0 10px 0 6px", // Reduced padding for compact size
    borderRadius: "10px", // Slightly more rounded for button look
    width: "180px", // Reduced width for more compact nodes
    height: "60px", // Increased height for more square shape
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    // 3D Shadow Effect: 0 offset x, 4px offset y, 0 blur, solid color
    boxShadow: `0 4px 0 ${shadowColor}`,
    transform: "translateY(0)", // Reset transform
    cursor: "pointer",
    overflow: "visible", // Allow shadow to be seen
    marginBottom: "4px", // Compensate for shadow
  };

  const contentContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px", // Reduced gap for compact layout
    flex: 1,
    overflow: "hidden",
    margin: "0 6px", // Reduced margin
  };

  const labelStyle = {
    fontSize: "13px", // Slightly smaller font for compact nodes
    fontWeight: 600, // Bolder text
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
  };

  // Helper to tint icon
  const getIconWithColor = () => {
    const icon = getIcon();
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, { color: categoryColor, size: 18 });
    }
    return icon;
  };

  // Description hidden in fixed mode to maintain size, or could be a subtitle
  // For now, we'll hide it or make it very subtle if it fits, but standardizing usually implies removing variable height elements.
  // We will rely on the tooltip for full details.

  return (
    <div
      style={nodeStyle}
      className="custom-node"
      title={data?.label + (data?.description ? `\n${data.description}` : "")}
    >
      {/* Input Handle - Left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: colors.border,
          width: 10,
          height: 10,
          border: "2px solid white",
        }}
      />

      {/* Node Content */}
      <div style={contentContainerStyle}>
        {getIconWithColor()}
        <span style={labelStyle}>
          {t(`nodes.labels.${data?.type}`) || data?.label || "Node"}
        </span>
      </div>

      {/* Error indicator (small dot or border change instead of text to keep size) */}
      {state === NODE_STATES.ERROR && (
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#ff6b6b",
          }}
        />
      )}

      {/* Output Handle - Right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: colors.border,
          width: 10,
          height: 10,
          border: "2px solid white",
        }}
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
