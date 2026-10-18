import { useCallback } from "react";
import { cn } from "../../lib/utils";

const KEYBOARD_STEP = 24;

/**
 * Accessible drag handle for a vertically-resizable bottom panel.
 *
 * Pointer interaction delegates to the provided `onResizeStart(event, height)`.
 * Keyboard interaction adjusts the height directly through `onChange`:
 * ArrowUp grows, ArrowDown shrinks, Home jumps to min, End jumps to max.
 */
export default function PanelResizeHandle({
  value,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  onChange,
  onResizeStart,
  label = "Resize panel",
  className,
}) {
  const clamp = useCallback(
    (next) => Math.max(min, Math.min(max, next)),
    [min, max],
  );

  const handleKeyDown = useCallback(
    (event) => {
      let next = null;
      switch (event.key) {
        case "ArrowUp":
          next = value + KEYBOARD_STEP;
          break;
        case "ArrowDown":
          next = value - KEYBOARD_STEP;
          break;
        case "Home":
          next = min;
          break;
        case "End":
          next = max;
          break;
        default:
          return;
      }
      event.preventDefault();
      onChange?.(clamp(next));
    },
    [value, min, max, onChange, clamp],
  );

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={Math.round(min)}
      aria-valuemax={Number.isFinite(max) ? Math.round(max) : undefined}
      tabIndex={0}
      onMouseDown={(event) => onResizeStart?.(event, value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute top-0 left-0 right-0 h-1.5 cursor-row-resize z-20 outline-none",
        "group hover:bg-indigo-500/20 focus-visible:bg-indigo-500/20 transition-colors",
        className,
      )}
    >
      <div className="mx-auto mt-0.5 w-8 h-0.5 rounded-full bg-slate-600 group-hover:bg-indigo-400 group-focus-visible:bg-indigo-400 transition-colors" />
    </div>
  );
}
