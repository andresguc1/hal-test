import { useCallback, useRef } from "react";

/**
 * Pointer-driven vertical resize for bottom-docked panels.
 *
 * Dragging the handle upward grows the panel (delta = startY - currentY), which
 * matches the resize affordance of `TerminalPanel`. The hook is uncontrolled
 * regarding state: the caller owns `height` and receives new values through
 * `onResize`. Keyboard handling lives in `PanelResizeHandle`.
 */
export function useVerticalResize({
  onResize,
  minHeight = 220,
  maxHeight = () => Number.POSITIVE_INFINITY,
  onResizeEnd,
} = {}) {
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleResizeStart = useCallback(
    (event, currentHeight) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();

      draggingRef.current = true;
      startYRef.current = event.clientY;
      startHeightRef.current = currentHeight;

      const resolveMax = () =>
        typeof maxHeight === "function" ? maxHeight() : maxHeight;

      const handleMouseMove = (moveEvent) => {
        if (!draggingRef.current) return;
        const delta = startYRef.current - moveEvent.clientY;
        const next = Math.max(
          minHeight,
          Math.min(resolveMax(), startHeightRef.current + delta),
        );
        onResize?.(next);
      };

      const handleMouseUp = () => {
        draggingRef.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        onResizeEnd?.();
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    [onResize, minHeight, maxHeight, onResizeEnd],
  );

  return { handleResizeStart };
}
