import React, { memo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

function StickyNoteNode({ id, data, selected }) {
  const text = data?.configuration?.text ?? "Write something...";
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(text);

  // Sync with remote state when not editing
  useEffect(() => {
    if (!isEditing) {
      setLocalText(text);
    }
  }, [text, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    // Trigger updateNodeConfiguration or custom setNodes directly via window/context if needed,
    // but the cleanest way is using React Flow's setNodes or calling the window method if registered.
    // Wait! Let's update the node configuration using ReactFlow's hook or custom window event,
    // or we can find updateNodeConfiguration in the context.
    // Since we are inside a node component, we can use window.updateNodeConfiguration if available,
    // or trigger a custom DOM event, or React Flow custom node hook.
    // Wait, let's see if there's a React Flow hook or window global to update state.
    // In our useFlowState hook, we can expose a global hook or register it.
    // Wait! React Flow nodes are rendered within the React Flow context, but do not have easy access
    // to custom hook setters unless they are passed in the data or registered on window.
    // Let's check if the parent passes a setter, or we can just dispatch a custom event.
    // Custom events are clean and 100% decouple components:
    const event = new CustomEvent("update-node-config", {
      detail: { nodeId: id, configuration: { text: localText } },
    });
    window.dispatchEvent(event);
  };

  return (
    <div
      className={cn(
        "relative p-4 rounded-md shadow-lg border-[2px] transition-all duration-200 select-none",
        "bg-amber-100 text-amber-900 border-amber-300 dark:bg-[#2c2415] dark:text-amber-200 dark:border-amber-700/60",
        "w-[220px] h-[180px] flex flex-col justify-between transform rotate-[-1deg]",
        selected
          ? "border-amber-500 shadow-xl ring-2 ring-amber-400/50"
          : "shadow-md",
      )}
    >
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {isEditing ? (
          <textarea
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            className={cn(
              "w-full h-full bg-transparent resize-none border-none outline-none focus:ring-0",
              "text-sm leading-relaxed font-sans font-medium",
            )}
          />
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            className="w-full h-full text-sm leading-relaxed overflow-y-auto cursor-text font-sans font-medium whitespace-pre-wrap"
          >
            {text || "Double-click to write..."}
          </div>
        )}
      </div>
      <div className="text-[9px] text-amber-600/70 dark:text-amber-400/50 font-bold uppercase tracking-wider text-right select-none">
        Sticky Note
      </div>
    </div>
  );
}

export default memo(StickyNoteNode);
