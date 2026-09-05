import React from "react";
import { MiniMap } from "@xyflow/react";
import "./styles/StyledMiniMap.css";
import { NODE_TYPE_MAP, getColorHex } from "@/config/nodeConstants";
import { useTheme } from "next-themes";

export default function StyledMiniMap() {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme;

  const maskColors = {
    dark: {
      mask: "rgba(15, 23, 42, 0.7)",
      maskStroke: "#1E293B",
    },
    light: {
      mask: "rgba(248, 250, 252, 0.7)",
      maskStroke: "#CBD5E1",
    },
  };

  const themeConfig =
    currentTheme === "dark" ? maskColors.dark : maskColors.light;

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
      className="custom-minimap glass-panel"
      nodeStrokeColor={(n) => getNodeColor(n)}
      nodeColor={(n) => getNodeColor(n)}
      nodeBorderRadius={4}
      nodeStrokeWidth={2}
      maskColor={themeConfig.mask}
      maskStrokeColor={themeConfig.maskStroke}
      maskStrokeWidth={1}
      zoomable={true}
      pannable={true}
    />
  );
}
