import React, { useState, useRef } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

// Parses a string into an array of text segments and variable segments
// Parses a string into an array of text segments and variable segments
const parseValue = (value) => {
  if (value === undefined || value === null || value === "") return [];
  // Coerce to string to handle objects consistently (prevents [object Object] in background layer)
  const str =
    typeof value === "object" && value !== null
      ? JSON.stringify(value)
      : value === undefined || value === null
        ? ""
        : String(value);
  // Support both {{var}} and ${var}
  const regex = /(\{\{[^}]+\}\}|\$\{[^}]+\})/g;
  const parts = str.split(regex);
  return parts.filter(Boolean).map((part) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      return {
        type: "variable",
        text: part,
        key: part.slice(2, -2),
        prefix: "{{",
        suffix: "}}",
      };
    }
    if (part.startsWith("${") && part.endsWith("}")) {
      return {
        type: "variable",
        text: part,
        key: part.slice(2, -1),
        prefix: "${",
        suffix: "}",
      };
    }
    return { type: "text", text: part };
  });
};

export const VariableInput = ({
  value = "",
  onChange,
  placeholder = "",
  className = "",
  variables = {},
  contextualVariables = null, // New prop to track valid flow context
  type = "text",
  hasError = false,
  suggestions = [], // New prop for autocomplete suggestions
  ...props
}) => {
  const containerRef = useRef(null);
  const bgRef = useRef(null);
  const datalistId = React.useId(); // Unique ID for datalist
  const [isFocused, setIsFocused] = useState(false);

  // Sync scrolling between foreground and background
  const handleScroll = (e) => {
    if (bgRef.current) {
      bgRef.current.scrollTop = e.target.scrollTop;
      bgRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const parsedParts = React.useMemo(() => parseValue(value), [value]);

  const renderBackgroundContent = () => {
    return parsedParts.map((part, i) => {
      if (part.type === "variable") {
        // Handle nested paths (e.g. "Login Steps.status")
        const resolveNested = (obj, path) => {
          if (!path.includes(".")) return obj[path];
          const parts = path.split(".");
          let curr = obj;
          for (const p of parts) {
            if (curr === null || curr === undefined || typeof curr !== "object")
              return undefined;
            curr =
              curr[p] !== undefined
                ? curr[p]
                : curr.data
                  ? curr.data[p]
                  : undefined;
          }
          return curr;
        };
        const varValue = resolveNested(variables, part.key);
        const hasValue =
          varValue !== undefined && varValue !== null && varValue !== "";
        const displayValue = hasValue ? varValue : "No data emitted yet";
        const isValid = varValue !== undefined;

        // Context validation
        const isOutOfContext =
          contextualVariables && !contextualVariables[part.key.split(".")[0]];
        const statusColor = !isValid
          ? "amber"
          : isOutOfContext
            ? "rose"
            : "indigo";

        return (
          <Tooltip.Provider key={i} delayDuration={100}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 -mx-0.5 pointer-events-auto cursor-help transition-colors font-mono",
                    statusColor === "indigo"
                      ? "bg-indigo-500/25 text-indigo-300 ring-1 ring-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                      : statusColor === "rose"
                        ? "bg-rose-500/20 text-rose-400 border-b-2 border-rose-500/50"
                        : "bg-amber-500/20 text-amber-400 border-b-2 border-dashed border-amber-500/50",
                  )}
                >
                  <span className="opacity-40 select-none mr-0.5">
                    {part.prefix}
                  </span>
                  <span className="relative">{part.key}</span>
                  <span className="opacity-40 select-none ml-0.5">
                    {part.suffix}
                  </span>
                </span>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-slate-900/95 text-slate-200 text-xs px-4 py-3 rounded-xl shadow-2xl border border-white/10 max-w-sm break-all z-[9999] backdrop-blur-md animate-in fade-in zoom-in duration-150"
                  sideOffset={8}
                >
                  <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          statusColor === "indigo"
                            ? "bg-indigo-400"
                            : statusColor === "rose"
                              ? "bg-rose-400"
                              : "bg-amber-400",
                        )}
                      />
                      <span className="font-bold text-[10px] uppercase tracking-widest text-slate-400">
                        {statusColor === "rose"
                          ? "Out of Context"
                          : "Variable Value"}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-slate-500 px-1.5 py-0.5 bg-black/40 rounded border border-white/5">
                      {part.prefix}
                      {part.suffix}
                    </span>
                  </div>

                  <div className="font-mono text-xs text-indigo-200 bg-black/30 p-2.5 rounded-lg border border-indigo-500/10 max-h-48 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                    {typeof displayValue === "object"
                      ? JSON.stringify(displayValue, null, 2)
                      : String(displayValue)}
                  </div>

                  {isOutOfContext && isValid && (
                    <div className="mt-2 text-[10px] text-rose-400/80 italic flex items-center gap-1">
                      <span>
                        ⚠️ This node is not directly connected to the current
                        node. The variable might not be available during
                        execution.
                      </span>
                    </div>
                  )}

                  {!isValid && (
                    <div className="mt-2 text-[10px] text-amber-400/80 italic flex items-center gap-1">
                      <span>
                        ⚠️ This variable has not been resolved yet in the
                        current run.
                      </span>
                    </div>
                  )}

                  <Tooltip.Arrow className="fill-slate-900/95" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        );
      }
      return (
        <span key={i} className="text-slate-300 pointer-events-none font-mono">
          {part.text}
        </span>
      );
    });
  };

  const isTextarea = type === "textarea";
  const Component = isTextarea ? "textarea" : "input";

  return (
    <div className="relative w-full" ref={containerRef} data-lpignore="true">
      {/* Background layer for styling variables */}
      <div
        ref={bgRef}
        className={cn(
          className,
          "absolute inset-0 pointer-events-none overflow-hidden !m-0 !outline-none focus:!ring-0",
          "font-mono antialiased",
          "!text-transparent !bg-transparent border-transparent",
          isTextarea ? "whitespace-pre-wrap break-words" : "whitespace-pre",
          "z-0",
        )}
        style={
          {
            // Match padding exactly. Tailwind classes in className will handle this usually,
            // but we ensure the alignment is perfect.
          }
        }
        aria-hidden="true"
      >
        <div
          className={cn("w-full h-full", !isTextarea && "flex items-center")}
        >
          {renderBackgroundContent()}
        </div>
      </div>

      {/* Actual interactive input */}
      <Component
        id={props.id}
        type={isTextarea ? undefined : type}
        value={
          typeof value === "object"
            ? JSON.stringify(value)
            : value === "[object Object]"
              ? ""
              : value
        }
        onChange={onChange}
        onScroll={handleScroll}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={""}
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore="true"
        spellCheck={false}
        list={suggestions?.length > 0 ? datalistId : undefined}
        className={cn(
          className,
          "relative z-10 font-mono antialiased",
          "text-transparent caret-indigo-500 selection:bg-indigo-500/40 selection:text-white",
          "!bg-transparent placeholder-transparent",
        )}
        {...props}
      />

      {/* Suggestion list */}
      {suggestions?.length > 0 && (
        <datalist id={datalistId}>
          {suggestions.map((s, idx) => (
            <option key={idx} value={s} />
          ))}
        </datalist>
      )}

      {/* Visible background box for the input (since input is transparent bg) */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none -z-10 rounded-lg transition-all",
          isFocused ? "bg-slate-900/40" : "bg-[var(--bg-canvas)]/50",
          hasError && "bg-red-500/5",
          "border",
          hasError
            ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
            : isFocused
              ? "border-indigo-500/50"
              : "border-[var(--border-ui)]",
        )}
      />

      {/* Placeholder overlay to keep it transparent but visible below input */}
      {!value && !isFocused && placeholder && (
        <div
          className={cn(
            "absolute inset-0 pointer-events-none flex text-xs font-mono opacity-60 text-[var(--text-muted)]",
            isTextarea ? "items-start pt-2 px-3" : "items-center px-3",
          )}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default VariableInput;
