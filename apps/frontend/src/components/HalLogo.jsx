import React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const HalLogo = ({ className, isBusy }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <img
        src="/images/haltest_logo.jpeg"
        alt="HAL-TEST"
        className={cn(
          "w-full h-full object-contain transition-all duration-500 rounded-lg",
          isDark
            ? "shadow-sm brightness-110"
            : "shadow-xl border border-slate-200 contrast-125 saturate-110",
          isBusy ? "animate-pulse scale-105" : "hover:scale-110",
        )}
      />

      {/* Dynamic Glow Background - Dark Mode Only */}
      {isDark && (
        <div
          className={cn(
            "absolute inset-0 transition-all duration-700 -z-10 bg-blue-500",
            isBusy
              ? "blur-2xl opacity-40 animate-pulse scale-125"
              : "blur-xl opacity-20",
          )}
        />
      )}

      {/* Direct Shadow State for Light Mode Busy */}
      {!isDark && isBusy && (
        <div className="absolute inset-0 -z-10 bg-slate-200 blur-lg opacity-40 animate-pulse scale-110 rounded-lg" />
      )}
    </div>
  );
};

export default HalLogo;
