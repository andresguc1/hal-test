import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const Select = React.forwardRef(
  (
    { className, children, value, onValueChange, placeholder, ...props },
    ref,
  ) => {
    // Extract options from children if they are standard <option> or custom components
    // But since we want to support the "SelectContent" "SelectItem" pattern from the caller's perspective to minimize refactor,
    // we might need a simpler approach or adapt the caller.
    //
    // STRATEGY: To make migration easiest, we will build a simplified Select that adheres to standard HTML <select>
    // but we might need to adjust the calling code from <Select><SelectTrigger>...</Select> to just <Select options={...} />
    // OR we create a compound component that mocks the API.
    //
    // For "Zero Dependency" robustness and speed, we will implement this as a WRAPPER around a native <select>.
    // The consumer will need to be refactored slightly to pass children as <option>s.
    //
    // However, `NodeConfigurationPanel` uses `SelectItem` components.
    // Let's implement a Compound Component pattern that renders a native select under the hood
    // to avoid complex popup positioning logic without Radix.

    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex h-9 w-full appearance-none items-center justify-between rounded-md border border-hal-neutral-800 bg-hal-neutral-950/50 px-3 py-2 text-sm placeholder:text-hal-neutral-600 focus:outline-none focus:ring-1 focus:ring-hal-primary-500 disabled:cursor-not-allowed disabled:opacity-50 text-hal-neutral-100 backdrop-blur-sm transition-colors hover:border-hal-neutral-700",
            className,
          )}
          value={value}
          onChange={(e) => onValueChange && onValueChange(e.target.value)}
          ref={ref}
          {...props}
        >
          {/* Placeholder logic if needed */}
          {placeholder && (
            <option value="" disabled selected>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none text-hal-neutral-100" />
      </div>
    );
  },
);
Select.displayName = "Select";

// Helper components to maintain compatibility with existing import structure if possible,
// or simply to provide semantic naming.
// Note: In a native select, we just need <option>.
const SelectItem = ({ value, children, className }) => (
  <option
    value={value}
    className={cn("bg-hal-neutral-950 text-hal-neutral-100", className)}
  >
    {children}
  </option>
);
SelectItem.displayName = "SelectItem";

// We don't strictly need Content/Trigger/Value for a native select,
// but if we want to Minimize Refactoring in NodeConfigurationPanel, we can create shims.
// However, the cleanest approach for "Pure Tailwind" is to simplify the usage in the parent.
// For now, I will export just Select and SelectItem.

export { Select, SelectItem };
