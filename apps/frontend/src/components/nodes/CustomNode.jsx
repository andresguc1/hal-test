/**
 * Custom Node Component for ReactFlow
 * Memoized to prevent unnecessary re-renders
 */

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const colors =
    PROFESSIONAL_COLORS[state] || PROFESSIONAL_COLORS[NODE_STATES.DEFAULT];

  // Determine category icon
  const categoryKey = NODE_TYPE_TO_CATEGORY[data?.type] || "default";
  const categoryColor = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default;

  // Get node-specific icon or fall back to category icon
  const NodeIconComponent = getNodeIcon(data?.type, categoryKey);

  // Determine state badge icon
  const getStateBadge = () => {
    switch (state) {
      case NODE_STATES.EXECUTING:
        return <Loader2 size={14} className="node-badge-icon animate-spin" />;
      case NODE_STATES.SUCCESS:
        return <CheckCircle size={14} className="node-badge-icon" />;
      case NODE_STATES.ERROR:
        return <XCircle size={14} className="node-badge-icon" />;
      default:
        return null;
    }
  };

  // Define state colors for enhanced visual effect
  const stateColors = {
    [NODE_STATES.DEFAULT]: {
      border: "#CBD5E1",
      shadow: "#64748B",
      glow: "rgba(203, 213, 225, 0.5)",
    },
    [NODE_STATES.EXECUTING]: {
      border: "#F59E0B",
      shadow: "#D97706",
      glow: "rgba(245, 158, 11, 0.4)",
    },
    [NODE_STATES.SUCCESS]: {
      border: "#10B981",
      shadow: "#059669",
      glow: "rgba(16, 185, 129, 0.4)",
    },
    [NODE_STATES.ERROR]: {
      border: "#EF4444",
      shadow: "#DC2626",
      glow: "rgba(239, 68, 68, 0.4)",
    },
    [NODE_STATES.SKIPPED]: {
      border: "#94A3B8",
      shadow: "#64748B",
      glow: "rgba(148, 163, 184, 0.3)",
    },
  };

  const currentStateColor =
    stateColors[state] || stateColors[NODE_STATES.DEFAULT];
  const borderColor = selected ? "#FF8C32" : currentStateColor.border;
  const shadowColor = currentStateColor.shadow;

  const nodeStyle = {
    background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.background}f0 100%)`,
    borderTop: `2px solid ${borderColor}`,
    borderRight: `2px solid ${borderColor}`,
    borderBottom: `3px solid ${borderColor}`,
    borderLeft: `5px solid ${categoryColor}`, // Category accent
    color: colors.text,
    padding: "12px 14px",
    borderRadius: "12px",
    width: "200px",
    minHeight: "70px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: selected
      ? `0 6px 0 ${shadowColor}, 0 0 0 3px ${currentStateColor.glow}`
      : `0 4px 0 ${shadowColor}`,
    transform: "translateY(0)",
    cursor: "pointer",
    overflow: "visible",
    transition: "all 0.2s ease",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
  };

  const labelStyle = {
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: "1.2",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  };

  const badgeContainerStyle = {
    position: "absolute",
    top: -6,
    right: -6,
    background:
      state === NODE_STATES.SUCCESS
        ? "#10B981"
        : state === NODE_STATES.ERROR
          ? "#EF4444"
          : state === NODE_STATES.EXECUTING
            ? "#F59E0B"
            : "transparent",
    borderRadius: "50%",
    padding: "4px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  };

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
          background: categoryColor,
          width: 10,
          height: 10,
          border: "2px solid white",
        }}
      />

      {/* State Badge */}
      {getStateBadge() && (
        <div style={badgeContainerStyle}>{getStateBadge()}</div>
      )}

      {/* Node Header with Icon and Label */}
      <div style={headerStyle}>
        <NodeIconComponent
          size={20}
          strokeWidth={2.5}
          style={{ color: categoryColor, flexShrink: 0 }}
        />
        <span style={labelStyle}>
          {t(`nodes.labels.${data?.type}`) || data?.label || "Node"}
        </span>
      </div>

      {/* Output Handle - Right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: categoryColor,
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
