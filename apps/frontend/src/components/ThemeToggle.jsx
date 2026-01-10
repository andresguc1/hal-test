import React from "react";
import { motion as Motion, AnimatePresence } from "motion/react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const ThemeToggle = ({ className }) => {
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark";

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    return (
        <Motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={cn(
                "relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-500",
                "bg-background/20 backdrop-blur-md border border-panel-border overflow-hidden",
                isDark
                    ? "text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    : "text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]",
                className
            )}
            aria-label="Toggle Theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                <Motion.div
                    key={theme}
                    initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 180, opacity: 0, scale: 0.5 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        duration: 0.4
                    }}
                    className="flex items-center justify-center h-full w-full"
                >
                    {isDark ? (
                        <Moon size={20} strokeWidth={2.5} fill="currentColor" fillOpacity={0.2} />
                    ) : (
                        <Sun size={20} strokeWidth={2.5} fill="currentColor" fillOpacity={0.2} />
                    )}
                </Motion.div>
            </AnimatePresence>

            {/* Internal Background Glow */}
            <Motion.div
                animate={{
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className={cn(
                    "absolute inset-0 -z-10",
                    isDark ? "bg-blue-500/10" : "bg-amber-500/10"
                )}
            />
        </Motion.button>
    );
};

export default ThemeToggle;
