import React from "react";
import { MiniMap } from "@xyflow/react";
import "./styles/StyledMiniMap.css";
import { NODE_STATES, PROFESSIONAL_COLORS } from "./hooks/flowStyles";

// Paleta de colores
const colors = {
  deepSpace: "#0B0C10",
  starBlue: "#1A73E8",
  metallicSilver: "#B0B0B0",
};

export default function StyledMiniMap() {
  // Function to get node color based on state
  const getNodeColor = (node) => {
    const state = node.data?.state || NODE_STATES.DEFAULT;
    const stateColors =
      PROFESSIONAL_COLORS[state] || PROFESSIONAL_COLORS[NODE_STATES.DEFAULT];
    return stateColors.background;
  };

  return (
    <MiniMap
      className="custom-minimap"
      nodeStrokeColor={(n) => getNodeColor(n)}
      nodeColor={(n) => getNodeColor(n)}
      nodeBorderRadius={6}
      nodeStrokeWidth={2}
      maskColor="rgba(11,12,16,0.8)"
      maskStrokeColor={colors.metallicSilver}
      maskStrokeWidth={1.5}
      style={{
        height: 120,
        width: 180,
        backgroundColor: colors.deepSpace,
        border: `1px solid ${colors.metallicSilver}`,
        borderRadius: "8px",
        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
      }}
      zoomable={true}
      pannable={true}
    />
  );
}
