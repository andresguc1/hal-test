import React, { memo } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "motion/react"; // Leaving for potential future use, but commenting out usage to show intent? No, linter says unused.
// usage is actually: <HeaderButton> uses motion.button.
// Wait, the error said `motion` is defined but never used.
// Let me check the file content. HeaderButton uses motion.button.
// Maybe I should check if motion is imported correctly.
// "2:10 error 'motion' is defined but never used"
// If HeaderButton uses <motion.button>, then motion IS used.
// Maybe it's imported as `import { motion }` but then unused because of `HeaderButton`?
// Let's verify file content first.
import { Sun, Moon, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import UserMenu from "./UserMenu";

/**
 * MAREA DESIGN SYSTEM - APP HEADER
 * "Premium OS-Level" experience.
 */

const HeaderButton = ({ onClick, children, title, className }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, backgroundColor: "rgba(30, 41, 59, 0.7)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      title={title}
      className={cn(
        "relative flex items-center justify-center p-2 rounded-lg transition-all duration-200",
        "bg-slate-900/40 border border-white/5 backdrop-blur-sm",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]", // Subtle top lighting
        "text-slate-400 hover:text-slate-200 hover:border-white/10",
        className,
      )}
    >
      {children}
    </motion.button>
  );
};

function AppHeader({ onOpenSettings }) {
  const { theme, setTheme } = useTheme();

  return (
    <header
      className={cn(
        // Dimensions & Layout
        "h-14 shrink-0 w-full z-50 px-6 flex items-center justify-between",

        // MAREA: Abyss Blue Theme & Lighting
        "bg-[#0f172a]", // Abyss Blue base
        "border-b border-white/5", // Ultra-subtle border
        "shadow-[0_1px_0_0_rgba(0,0,0,0.2)]", // Drop shadow depth

        // Dot Pattern Overlay (CSS Radial Gradient simulation)
        "relative overflow-hidden",
      )}
    >
      {/* Background Dot Pattern (Subtle) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* LEFT: Branding */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Logo Container - Glowing Glass */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(79,70,229,0.2)] backdrop-blur-md relative overflow-hidden group">
          {/* Internal Shine */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <svg
            className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            fill="none"
            strokeWidth="2.5"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        {/* Title */}
        <div className="flex flex-col justify-center">
          <h1 className="text-white/90 font-bold tracking-wider text-[13px] uppercase font-mono leading-none">
            HAL-TEST
          </h1>
          <span className="text-[10px] text-slate-500 font-medium tracking-wide">
            AUTOMATION IDE
          </span>
        </div>
      </div>

      {/* RIGHT: User Actions */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Theme Toggle */}
        <HeaderButton
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle Theme"
        >
          <div className="relative w-4 h-4">
            <Sun
              size={16}
              strokeWidth={2}
              className="absolute inset-0 rotate-0 scale-100 transition-transform duration-500 dark:-rotate-90 dark:scale-0 text-amber-300"
            />
            <Moon
              size={16}
              strokeWidth={2}
              className="absolute inset-0 rotate-90 scale-0 transition-transform duration-500 dark:rotate-0 dark:scale-100 text-indigo-300"
            />
          </div>
        </HeaderButton>

        <div className="h-5 w-px bg-white/10 mx-1" />

        {/* Profile */}
        <UserMenu onOpenSettings={onOpenSettings} />
      </div>
    </header>
  );
}

export default memo(AppHeader);
