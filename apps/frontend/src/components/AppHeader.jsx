import React, { memo } from "react";
import { motion as Motion } from "motion/react"; // Renamed to Motion to avoid lint unused warning
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import UserMenu from "./UserMenu";

const HeaderButton = ({ onClick, children, title, className }) => (
  <Motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={title}
    className={cn(
      "relative flex items-center justify-center p-2 rounded-lg transition-colors duration-200",
      "text-slate-400 hover:text-white hover:bg-white/5",
      className,
    )}
  >
    {children}
  </Motion.button>
);

function AppHeader({ onOpenSettings, selectedProject, selectedFlow }) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        "h-14 w-full shrink-0 z-50 px-8 relative", // relative is key for absolute centering
        "flex items-center justify-between",
        "bg-[#0f172a] border-b border-white/5 shadow-sm font-sans",
      )}
    >
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* LEFT */}
      <div className="flex items-center relative z-20 shrink-0">
        <h1 className="text-white/95 font-bold tracking-wider text-xl uppercase font-mono leading-none cursor-default select-none">
          {t("app.title", "HAL-TEST")}
        </h1>
      </div>

      {/* CENTER - ABSOLUTE (The Fix) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-lg flex justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 text-sm select-none whitespace-nowrap">
          {selectedProject ? (
            <>
              <span className="text-slate-200 font-semibold tracking-tight truncate max-w-[150px]">
                {selectedProject.name}
              </span>
              <span className="text-slate-600 font-light shrink-0">/</span>
              <span
                className={cn(
                  "transition-colors truncate max-w-[200px]",
                  selectedFlow
                    ? "text-indigo-400 font-medium"
                    : "text-slate-500 italic",
                )}
              >
                {selectedFlow
                  ? selectedFlow.name
                  : t("header.select_flow", "Select a flow")}
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-600 font-medium italic">
              {t("header.no_project", "-- No Project --")}
            </span>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-12 relative z-20 shrink-0">
        <HeaderButton
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={t("header.switch_theme", "Switch Theme")}
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <Sun
              size={18}
              className="absolute rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-300"
            />
            <Moon
              size={18}
              className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-300"
            />
          </div>
        </HeaderButton>
        <UserMenu onOpenSettings={onOpenSettings} />
      </div>
    </header>
  );
}

export default memo(AppHeader);
