/**
 * RemoteCursors — SVG overlay that renders remote user cursors on the canvas.
 *
 * Projecting flow coordinates back to screen space ensures cursors stay pinned
 * to the actual flow canvas content regardless of zoom/pan levels.
 */

import React, { useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import { useAwareness } from "./useAwareness";

const CURSOR_SVG_PATH = "M0,0 L0,16 L4.5,13 L8,20 L10.5,19 L7,12 L12,12 Z";

function RemoteCursors() {
  const { peers, isCollaborative } = useAwareness();
  const { flowToScreenPosition } = useReactFlow();

  const visibleCursors = useMemo(() => {
    return peers
      .filter((p) => p.cursor && p.user)
      .map((peer) => {
        try {
          const screenPos = flowToScreenPosition({
            x: peer.cursor.x,
            y: peer.cursor.y,
          });
          return {
            ...peer,
            screenPos,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }, [peers, flowToScreenPosition]);

  if (!isCollaborative || visibleCursors.length === 0) {
    return null;
  }

  return (
    <div
      className="remote-cursors-layer"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1000,
        overflow: "visible",
      }}
    >
      {visibleCursors.map((peer) => (
        <div
          key={peer.clientId}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(${peer.screenPos.x}px, ${peer.screenPos.y}px)`,
            transition: "transform 80ms ease-out",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            style={{ overflow: "visible" }}
          >
            {/* Cursor arrow */}
            <path
              d={CURSOR_SVG_PATH}
              fill={peer.user.color}
              stroke="white"
              strokeWidth="0.5"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
            />
          </svg>
          {/* User name label */}
          <div
            style={{
              position: "absolute",
              left: "14px",
              top: "10px",
              background: peer.user.color,
              color: "white",
              fontSize: "11px",
              fontWeight: 500,
              padding: "2px 6px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
              lineHeight: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              maxWidth: "110px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {peer.user.name}
          </div>
        </div>
      ))}
    </div>
  );
}

export default React.memo(RemoteCursors);
