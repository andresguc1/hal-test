import React, { memo } from "react";
import { motion as Motion } from "motion/react"; // Renamed to Motion to avoid lint unused warning
import { Sun, Moon, History, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import UserMenu from "./UserMenu";
import HalLogo from "./HalLogo";

const HeaderButton = ({ onClick, children, title, className }) => (
  <Motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={title}
    className={cn(
      "relative flex items-center justify-center p-2 rounded-lg transition-all duration-300",
      "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]",
      className,
    )}
  >
    {children}
  </Motion.button>
);

const Breadcrumbs = ({ viewStack, onExit }) => {
  if (!viewStack || viewStack.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-sm select-none">
      {/* Root Link */}
      <span
        onClick={() => onExit()}
        className="text-[var(--text-secondary)] hover:text-indigo-400 cursor-pointer transition-colors"
      >
        Main Flow
      </span>

      {viewStack.map((view, index) => (
        <React.Fragment key={view.id}>
          <span className="text-[var(--text-secondary)] opacity-50">/</span>
          <span
            onClick={() => (index < viewStack.length - 1 ? onExit() : null)} // Simple logic: clicking breadcrumb pops one level (not robust for deep nested yet)
            className={cn(
              "transition-colors max-w-[150px] truncate",
              index === viewStack.length - 1
                ? "text-indigo-500 font-medium"
                : "text-[var(--text-secondary)] hover:text-indigo-400 cursor-pointer",
            )}
          >
            {view.label}
          </span>
        </React.Fragment>
      ))}

      {/* Current Level (if needed, but usually viewStack includes current level logic) */}
    </div>
  );
};

function AppHeader({
  onOpenSettings,
  onOpenApiKeys,
  onToggleHistory,
  isToolboxVisible,
  onToggleToolbox,
  selectedProject,
  selectedFlow,
  viewStack,
  onExitComponent,
  activeBrowserId,
  onStopSession,
}) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        "h-14 w-full shrink-0 z-50 px-8 relative transition-all duration-400",
        "flex items-center justify-between",
        "bg-[var(--bg-panel)] border-b border-[var(--border-color)] glass-panel rounded-none shadow-sm font-sans",
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
      <div className="flex items-center gap-3 relative z-20 shrink-0">
        <HalLogo className="w-8 h-8" />
        <h1 className="text-[var(--text-primary)] font-bold tracking-wider text-xl uppercase font-mono leading-none cursor-default select-none flex items-center gap-1 group">
          <span className="text-indigo-500 group-hover:text-indigo-400 transition-colors">
            HAL
          </span>
          <span className="text-[var(--text-secondary)] opacity-50">-</span>
          <span className="text-amber-500 group-hover:text-amber-400 transition-colors">
            TEST
          </span>
        </h1>

        {/* SESSION INDICATOR */}
        {activeBrowserId && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 ml-4 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-emerald-500">
              Session Active
            </span>

            <button
              onClick={onStopSession}
              className="ml-2 hover:bg-emerald-500/20 p-1 rounded transition-colors text-emerald-600 hover:text-emerald-400"
              title="Stop Session & Close Browser"
            >
              <div className="w-2.5 h-2.5 bg-current rounded-[1px]" />
            </button>
          </Motion.div>
        )}
      </div>

      {/* CENTER - ABSOLUTE (The Fix) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-lg flex justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 text-sm select-none whitespace-nowrap">
          {viewStack && viewStack.length > 0 ? (
            <Breadcrumbs viewStack={viewStack} onExit={onExitComponent} />
          ) : selectedProject ? (
            <>
              <span className="text-[var(--text-primary)] font-semibold tracking-tight truncate max-w-[150px]">
                {selectedProject.name}
              </span>
              <span className="text-[var(--text-secondary)] font-light shrink-0">
                /
              </span>
              <span
                className={cn(
                  "transition-colors truncate max-w-[200px]",
                  selectedFlow
                    ? "text-indigo-500"
                    : "text-[var(--text-secondary)] italic",
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
          onClick={onToggleToolbox}
          title={isToolboxVisible ? "Hide Toolbox" : "Show Toolbox"}
          className={cn(isToolboxVisible && "text-indigo-500 bg-indigo-500/10")}
        >
          <Layout size={18} />
        </HeaderButton>

        <HeaderButton onClick={onToggleHistory} title="Execution History">
          <History size={18} />
        </HeaderButton>

        <HeaderButton
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={
            theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
          }
        >
          <Motion.div
            key={theme}
            initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="flex items-center justify-center"
          >
            {theme === "dark" ? (
              <Sun size={18} className="text-orange-400 fill-orange-400/10" />
            ) : (
              <Moon size={18} className="text-blue-500 fill-blue-500/10" />
            )}
          </Motion.div>
        </HeaderButton>
        <UserMenu
          onOpenSettings={onOpenSettings}
          onOpenApiKeys={onOpenApiKeys}
        />
      </div>
    </header>
  );
}

export default memo(AppHeader);
