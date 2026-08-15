import React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // Base Layout
        "flex h-11 w-full rounded-lg border px-3 py-2 text-[17px] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        // Apple Colors
        "bg-input/50 backdrop-blur-md border-transparent focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary ui-transition-colors",
        // Error state
        error && "border-destructive focus-visible:ring-destructive",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
