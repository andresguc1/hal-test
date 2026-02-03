import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const Switch = React.forwardRef(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    const toggle = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={toggle}
        ref={ref}
        className={cn(
          // Base (iOS Size: 51x31 usually, but scaled here to fit UI: 50x30 roughly)
          "peer inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-ull border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "rounded-full",
          // Colors
          checked ? "bg-apple-green" : "bg-muted-foreground/30 dark:bg-muted",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        {...props}
      >
        <motion.span
          layout
          transition={{
            type: "spring",
            stiffness: 700,
            damping: 30,
          }}
          className={cn(
            "pointer-events-none block h-[27px] w-[27px] rounded-full bg-white shadow-lg ring-0",
            checked ? "translate-x-[20px]" : "translate-x-0",
          )}
        />
      </button>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
