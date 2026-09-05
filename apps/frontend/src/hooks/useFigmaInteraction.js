import { useCallback, useMemo, useEffect, useState } from "react";
import { useReactFlow, SelectionMode } from "@xyflow/react";

/**
 * Hook to provide Figma-like interaction behaviors for React Flow
 *
 * Features:
 * - Pan with Space + Drag or Middle/Right Mouse Button
 * - Pan with Trackpad/Wheel (panOnScroll)
 * - Zoom with Ctrl + Scroll
 * - Zoom with Pinch (Trackpad)
 * - Marquee selection with Left Click Drag
 * - Zoom to cursor
 */
export function useFigmaInteraction() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [_isCtrlPressed, _setIsCtrlPressed] = useState(false);

  // Handle Key states
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.matches("input, textarea")) return;

      if (e.code === "Space" && !e.repeat) {
        setIsSpacePressed(true);
      }
      if (e.key === "Control" || e.key === "Meta") {
        _setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
      if (e.key === "Control" || e.key === "Meta") {
        _setIsCtrlPressed(false);
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
      _setIsCtrlPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Custom Zoom Handlers that zoom to center of viewport by default
  // or could be enhanced to zoom to cursor if we tracked cursor position
  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 300, padding: 0.2 });
  }, [fitView]);

  // Configuration object to spread onto <ReactFlow />
  const figmaConfig = useMemo(
    () => ({
      // --- Navigation ---
      // Standard behavior: Scroll for Zoom, Space+Drag for Pan
      panOnScroll: false,
      panOnScrollSpeed: 1,

      // Zoom with Scroll (standard)
      zoomOnScroll: true,

      // Pan with Middle (1) or Right (2) mouse buttons
      panOnDrag: [1, 2],

      // Enable pinch zoom for trackpads
      zoomOnPinch: true,

      // Disable double click zoom (conflicts with potential other actions)
      zoomOnDoubleClick: false,

      // --- Selection ---
      // Enable marquee selection with left click drag
      selectionOnDrag: true,
      // Figma uses partial selection (touching the node selects it)
      selectionMode: SelectionMode.Partial,
      // Do not select nodes while dragging the pane (avoids accidental selection)
      panOnScrollMode: "free",

      // --- Space Key Panning ---
      // We use a custom implementation or the built-in activation key
      // React Flow supports 'panActivationKeyCode' but we might want visual feedback
      panActivationKeyCode: "Space",

      // --- Limits & UX ---
      minZoom: 0.1, // Zoom out far
      maxZoom: 3, // Prevent excessive pixelation
      // Prevent nodes from being dragged when using space
      nodesDraggable: !isSpacePressed,
      nodesConnectable: !isSpacePressed,
      elementsSelectable: !isSpacePressed,
    }),
    [isSpacePressed],
  );

  // Cursor style management
  useEffect(() => {
    if (isSpacePressed) {
      document.body.style.cursor = "grab";
    } else {
      document.body.style.cursor = "";
    }
    return () => {
      document.body.style.cursor = "";
    };
  }, [isSpacePressed]);

  return {
    figmaConfig,
    isSpacePressed,
    handlers: {
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      fitView: handleFitView,
    },
  };
}
