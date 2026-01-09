import React from "react";
import { MiniMap } from "@xyflow/react";
import "./styles/StyledMiniMap.css";
import { NODE_STATES, PROFESSIONAL_COLORS } from "./hooks/flowStyles";
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
    const state = node.data?.state || NODE_STATES.DEFAULT;
    const stateColors =
      PROFESSIONAL_COLORS[state] || PROFESSIONAL_COLORS[NODE_STATES.DEFAULT];
    return stateColors.border || "#94a3b8";
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
        height: 120,
        width: 180,
        bottom: 40,
        right: 20,
        backgroundColor:
          currentTheme === "dark"
            ? "rgba(30, 41, 59, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(0,0,0,0.1)",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      }}
      zoomable={true}
      pannable={true}
    />
  );
}
