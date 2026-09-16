import React from "react";
import { MiniMap } from "@xyflow/react";
import "./styles/StyledMiniMap.css";
import { NODE_TYPE_MAP, getColorHex } from "@/config/nodeConstants";

export default function StyledMiniMap() {
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
      nodeBorderRadius={2}
      nodeStrokeWidth={1}
      maskColor="rgba(15, 23, 42, 0.5)"
      maskStrokeColor="hsl(var(--primary) / 0.8)"
      maskStrokeWidth={2}
      zoomable={true}
      pannable={true}
    />
  );
}
