import React from "react";
import { MiniMap } from "@xyflow/react";
import "./styles/StyledMiniMap.css";
import { NODE_TYPE_MAP, NODE_CATEGORIES } from "@/config/nodeConstants";
import { useTheme } from "next-themes";

export default function StyledMiniMap() {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme;

  // Technical colors for Enterprise Tech theme
  const colors = {
    dark: {
      bg: "#0F172A",
      border: "#334155",
      mask: "rgba(15, 23, 42, 0.7)",
      maskStroke: "#1E293B",
    },
    light: {
      bg: "#ffffff",
      border: "#CBD5E1",
      mask: "rgba(248, 250, 252, 0.7)",
      maskStroke: "#CBD5E1",
    },
  };

  const themeConfig = currentTheme === "dark" ? colors.dark : colors.light;

  // Function to get node color based on state
  const getNodeColor = (node) => {
    // 1. Resolve Node Key
    const nodeKey =
      node.data?.subType || node.data?.type || node.type || "launch_browser";

    // 2. Resolve Config from Key
    const config = NODE_TYPE_MAP[nodeKey];

    // 3. Resolve Category Color
    if (config && config.color) {
      // Map color names to HEX values manually or import a map?
      // Since we need hex for MiniMap, let's map the names to the values we just defined in nodeConstants solid theme.
      // Actually, we can just use a simple switch or object here for the hexes since they are strict now.
      switch (config.color) {
        case "emerald":
          return "#10b981";
        case "blue":
          return "#3b82f6";
        case "orange":
          return "#f97316";
        case "rose":
          return "#f43f5e";
        case "cyan":
          return "#06b6d4";
        case "pink":
          return "#ec4899";
        case "violet":
          return "#8b5cf6";
        case "indigo":
          return "#6366f1";
        case "lime":
          return "#84cc16";
        case "sky":
          return "#0ea5e9";
        case "slate":
          return "#64748b";
        default:
          return "#64748b";
      }
    }
    return "#64748b";
  };

  return (
    <MiniMap
      className="custom-minimap"
      nodeStrokeColor={(n) => getNodeColor(n)}
      nodeColor={(n) => getNodeColor(n)}
      nodeBorderRadius={4}
      nodeStrokeWidth={2}
      maskColor={themeConfig.mask}
      maskStrokeColor={themeConfig.maskStroke}
      maskStrokeWidth={1}
      style={{
        position: "absolute",
        height: 120,
        width: 180,
        bottom: 20,
        right: 20,
        backgroundColor:
          currentTheme === "dark"
            ? "rgba(30, 41, 59, 1)"
            : "rgba(255, 255, 255, 1)",
        border: "2px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
      zoomable={true}
      pannable={true}
    />
  );
}
