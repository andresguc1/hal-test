import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

const buttonVariants = {
  primary:
    "bg-primary text-white hover:opacity-90 shadow-sm border-transparent",
  secondary:
    "bg-secondary text-primary hover:bg-secondary/80 border-transparent",
  ghost: "bg-transparent text-primary hover:bg-secondary/50 border-transparent",
  destructive:
    "bg-destructive text-white hover:opacity-90 shadow-sm border-transparent",
  outline:
    "bg-transparent border border-border text-foreground hover:bg-secondary/50",
};

const buttonSizes = {
  default: "h-11 px-5 py-2.5 text-[17px]", // iOS Standard Touch Target
  sm: "h-8 px-3 text-[15px]",
  lg: "h-14 px-8 text-[19px]",
  icon: "h-11 w-11 p-0 flex items-center justify-center",
};

const Button = React.forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "default",
      isLoading = false,
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? motion.slot : motion.button;

    return (
      <Component
        ref={ref}
        disabled={disabled || isLoading}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(
          // Base styles - Apple HIG
          "inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition-all duration-200 select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          // Variants & Sizes
          buttonVariants[variant] || buttonVariants.primary,
          buttonSizes[size] || buttonSizes.default,
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {children}
      </Component>
    );
  },
);

Button.displayName = "Button";

export { Button };
