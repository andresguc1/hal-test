import React from "react";
import { MiniMap } from "@xyflow/react";
import "./styles/StyledMiniMap.css";
import {
  NODE_TYPE_MAP,
  NODE_CATEGORIES,
  getColorHex,
} from "@/config/nodeConstants";
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

  // Function to get node color based on category
  const getNodeColor = (node) => {
    const nodeKey =
      node.data?.subType || node.data?.type || node.type || "launch_browser";
    const config = NODE_TYPE_MAP[nodeKey];
    if (config && config.color) {
      return getColorHex(config.color);
    }
    return "#64748b";
  };

  return (
    <MiniMap
      className="custom-minimap glass-panel z-[var(--z-hud)]"
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
        background: "transparent",
        border: "none",
        boxShadow: "none",
      }}
      zoomable={true}
      pannable={true}
    />
  );
}
