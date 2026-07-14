import React, { memo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";

function StickyNoteNode({ id, data, selected }) {
  const { user } = useAuth();
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
    const event = new CustomEvent("update-node-config", {
      detail: {
        nodeId: id,
        configuration: {
          text: localText,
          lastEditedBy: user?.name || "Anonymous",
          lastEditedColor: user?.color || "#6b7280"
        }
      },
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
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200/40 dark:border-amber-700/20 text-[9px] select-none">
        <div className="truncate max-w-[120px]">
          {data?.configuration?.lastEditedBy && (
            <span
              style={{ color: data.configuration.lastEditedColor }}
              className="font-black tracking-wider uppercase opacity-85"
            >
              ✏️ {data.configuration.lastEditedBy}
            </span>
          )}
        </div>
        <div className="text-amber-600/70 dark:text-amber-400/50 font-bold uppercase tracking-wider text-right">
          Sticky Note
        </div>
      </div>
    </div>
  );
}

export default memo(StickyNoteNode);
