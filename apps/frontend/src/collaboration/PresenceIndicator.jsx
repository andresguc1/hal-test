/**
 * PresenceIndicator — Compact presence bar showing connected collaborators.
 *
 * Displays avatar circles for connected users with a count badge.
 * Expands on hover to show full user names and what they're working on.
 */

import React, { useState } from "react";
import { useAwareness } from "./useAwareness";
import { Users } from "lucide-react";

function PresenceIndicator() {
  const { peers, peerCount, isCollaborative } = useAwareness();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isCollaborative || peerCount === 0) {
    return null;
  }

  return (
    <div
      className="presence-indicator"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        borderRadius: "8px",
        background: "var(--hal-surface, rgba(30, 30, 40, 0.8))",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--hal-border, rgba(255,255,255,0.1))",
        cursor: "pointer",
        position: "relative",
        transition: "all 200ms ease",
      }}
    >
      {/* Stacked Avatars */}
      <div style={{ display: "flex", marginRight: "4px" }}>
        {peers.slice(0, 4).map((peer, index) => (
          <div
            key={peer.clientId}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: peer.user.color,
              border: "2px solid var(--hal-surface, #1e1e28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 600,
              color: "white",
              marginLeft: index > 0 ? "-8px" : "0",
              zIndex: 10 - index,
              position: "relative",
            }}
            title={peer.user.name}
          >
            {peer.user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        ))}
        {peerCount > 4 && (
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "var(--hal-muted, #555)",
              border: "2px solid var(--hal-surface, #1e1e28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
              fontWeight: 600,
              color: "white",
              marginLeft: "-8px",
              zIndex: 5,
              position: "relative",
            }}
          >
            +{peerCount - 4}
          </div>
        )}
      </div>

      {/* Collaboration Badge */}
      <Users size={14} style={{ color: "var(--hal-text-muted, #aaa)" }} />
      <span
        style={{
          fontSize: "12px",
          color: "var(--hal-text-muted, #aaa)",
          fontWeight: 500,
        }}
      >
        {peerCount}
      </span>

      {/* Live indicator dot */}
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#4CAF50",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />

      {/* Expanded Panel */}
      {isExpanded && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "8px",
            background: "var(--hal-surface, rgba(30, 30, 40, 0.95))",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--hal-border, rgba(255,255,255,0.1))",
            borderRadius: "12px",
            padding: "12px",
            minWidth: "200px",
            zIndex: 100,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--hal-text-muted, #888)",
              marginBottom: "8px",
            }}
          >
            Collaborators
          </div>
          {peers.map((peer) => (
            <div
              key={peer.clientId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 0",
                borderBottom:
                  "1px solid var(--hal-border, rgba(255,255,255,0.05))",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: peer.user.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {peer.user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--hal-text, white)",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {peer.user.name}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: peer.user.color,
                  }}
                >
                  {peer.selection?.length > 0
                    ? `Editing ${peer.selection.length} node(s)`
                    : "Viewing"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default React.memo(PresenceIndicator);
