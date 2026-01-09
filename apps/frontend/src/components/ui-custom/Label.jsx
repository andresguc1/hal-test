import React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-[15px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground",
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  ),
);
Label.displayName = "Label";

export { Label };
