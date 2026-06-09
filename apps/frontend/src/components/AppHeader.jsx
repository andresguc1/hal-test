import React, { memo } from "react";
import { motion as Motion } from "framer-motion"; // Renamed to Motion to avoid lint unused warning
import { useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  History,
  Layout,
  Info,
  Database,
  Sparkles,
  Cloud,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import UserMenu from "./UserMenu";
import HalLogo from "./HalLogo";
import { useAuth } from "../context/AuthContext";

const HeaderButton = ({ onClick, children, title, className }) => (
  <Motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={title}
    aria-label={title}
    className={cn(
      "relative flex items-center justify-center p-2 rounded-lg transition-all duration-300",
      "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]",
      className,
    )}
  >
    {children}
  </Motion.button>
);

const Breadcrumbs = ({ viewStack, onExit, currentFlowName }) => {
  if (!viewStack || viewStack.length === 0) return null;

  return (
    <nav
      aria-label="Flow breadcrumb"
      className="flex items-center gap-1 text-sm select-none"
    >
      {/* Root Link */}
      <button
        type="button"
        onClick={() => onExit()}
        className="text-[var(--text-secondary)] hover:text-indigo-400 cursor-pointer transition-colors bg-transparent border-none p-0"
      >
        Main
      </button>

      {viewStack.map((view, index) => (
        <React.Fragment key={`${view.id}-${index}`}>
          <span
            className="text-[var(--text-secondary)] opacity-50"
            aria-hidden="true"
          >
            /
          </span>
          <button
            type="button"
            onClick={() => (index < viewStack.length - 1 ? onExit() : null)} // Simple logic: clicking breadcrumb pops one level (not robust for deep nested yet)
            aria-current={
              index === viewStack.length - 1 ? "location" : undefined
            }
            className={cn(
              "transition-colors max-w-[150px] truncate bg-transparent border-none p-0",
              index === viewStack.length - 1
                ? "text-indigo-500 font-medium"
                : "text-[var(--text-secondary)] hover:text-indigo-400 cursor-pointer",
            )}
          >
            {view.label}
          </button>
        </React.Fragment>
      ))}

      {/* Current Level */}
      <span
        className="text-[var(--text-secondary)] opacity-50"
        aria-hidden="true"
      >
        /
      </span>
      <span
        className="text-indigo-500 font-medium truncate max-w-[200px]"
        aria-current="page"
      >
        {currentFlowName}
      </span>
    </nav>
  );
};

function AppHeader({
  onOpenSettings,
  onOpenApiKeys,
  onToggleHistory,
  onToggleVariables,
  isToolboxVisible,
  isVariablesVisible,
  onToggleToolbox,
  onToggleAskAI,
  isAskAIVisible,
  selectedProject,
  selectedFlow,
  activeBrowserId,
  onStopSession,
  isStarterTemplate,
  onSyncCloud,
  apiStatus = { state: "idle" },
  viewStack = [],
  onExitComponent,
}) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { user, authMode } = useAuth();
  const navigate = useNavigate();
  const isGuest = user?.isGuest || authMode === "local";

  // Local state to manage temporary visibility of success/error messages
  const [indicatorState, setIndicatorState] = React.useState("idle");

  React.useEffect(() => {
    if (!activeBrowserId) {
      setIndicatorState("none");
      return;
    }

    if (apiStatus.state === "running") {
      setIndicatorState("running");
    } else if (apiStatus.state === "success") {
      setIndicatorState("success");
      const timer = setTimeout(() => setIndicatorState("idle"), 2500);
      return () => clearTimeout(timer);
    } else if (apiStatus.state === "warning" || apiStatus.state === "error") {
      setIndicatorState("error");
    } else {
      setIndicatorState("idle");
    }
  }, [apiStatus.state, activeBrowserId]);

  const renderIndicator = () => {
    if (indicatorState === "none") return null;

    let config = {
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
      dotOuter: "",
      dotInner: "bg-slate-400",
      text: "text-slate-400",
      label: "Session Open",
    };

    switch (indicatorState) {
      case "running":
        config = {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          dotOuter:
            "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75",
          dotInner: "bg-emerald-500",
          text: "text-emerald-500",
          label: "Executing Flow...",
        };
        break;
      case "success":
        config = {
          bg: "bg-emerald-500/20",
          border: "border-emerald-500/30",
          dotOuter: "",
          dotInner: "bg-emerald-400",
          text: "text-emerald-400",
          label: "Success!",
        };
        break;
      case "error":
        config = {
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          dotOuter:
            "animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75",
          dotInner: "bg-red-500",
          text: "text-red-500",
          label: "Execution Error",
        };
        break;
    }

    return (
      <Motion.div
        key={indicatorState}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-2 ml-4 px-3 py-1 rounded-full border",
          config.bg,
          config.border,
        )}
      >
        <span className="relative flex h-2 w-2">
          {config.dotOuter && <span className={config.dotOuter}></span>}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              config.dotInner,
            )}
          ></span>
        </span>
        <span className={cn("text-xs font-medium", config.text)}>
          {config.label}
        </span>

        <button
          onClick={onStopSession}
          className={cn(
            "ml-2 hover:bg-black/10 p-1 rounded transition-colors",
            config.text,
          )}
          title="Stop Session & Close Browser"
          aria-label="Stop Session & Close Browser"
        >
          <div
            className="w-2.5 h-2.5 bg-current rounded-[1px]"
            aria-hidden="true"
          />
        </button>
      </Motion.div>
    );
  };

  return (
    <header
      className={cn(
        "h-14 w-full shrink-0 z-50 px-3 md:px-6 lg:px-8 relative transition-all duration-400",
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
        <div
          role="img"
          aria-label="HAL-TEST"
          className="text-[var(--text-primary)] font-bold tracking-wider text-base md:text-xl uppercase font-mono leading-none cursor-default select-none flex items-center gap-1 group"
        >
          <span className="text-indigo-500 group-hover:text-indigo-400 transition-colors">
            HAL
          </span>
          <span
            className="text-[var(--text-secondary)] opacity-50"
            aria-hidden="true"
          >
            -
          </span>
          <span className="text-amber-500 group-hover:text-amber-400 transition-colors">
            TEST
          </span>
        </div>

        {/* MODE INDICATOR */}
        {isGuest && (
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 ml-2 animate-in fade-in slide-in-from-left-2 duration-700">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
              Guest Mode
            </span>
          </div>
        )}

        {/* SESSION INDICATOR */}
        {renderIndicator()}
      </div>

      {/* CENTER - ABSOLUTE (The Fix) */}
      <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-[320px] md:max-w-[450px] lg:max-w-lg justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 text-sm select-none whitespace-nowrap">
          {viewStack && viewStack.length > 0 ? (
            <Breadcrumbs
              viewStack={viewStack}
              onExit={onExitComponent}
              currentFlowName={
                selectedFlow?.name || t("header.unknown", "Unknown")
              }
            />
          ) : selectedProject ? (
            <>
              <span className="text-[var(--text-primary)] font-semibold tracking-tight truncate max-w-[100px] md:max-w-[150px] lg:max-w-[200px]">
                {selectedProject.name}
              </span>
              <span className="text-[var(--text-secondary)] font-light shrink-0">
                /
              </span>
              <span
                className={cn(
                  "transition-colors truncate max-w-[100px] md:max-w-[200px] lg:max-w-[300px]",
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

          {isStarterTemplate && (
            <div className="group relative flex items-center gap-2 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 animate-in fade-in slide-in-from-top-1 duration-500">
              <Info size={14} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">
                Starter Template Active
              </span>

              {/* Educational Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 p-4 bg-slate-900/95 border border-indigo-500/30 rounded-xl shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100 origin-top z-[100] pointer-events-none">
                <div className="flex items-start gap-3 mb-2">
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Layout size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider pt-1">
                    Guide: First Steps
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed whitespace-normal italic">
                  This flow demonstrates a complete Google Search and validation
                  process. Use it to understand how nodes connect.
                  <br />
                  <br />
                  <span className="text-indigo-400 font-bold">Tip:</span> Look
                  for the pulsing nodes with "GUIDE" labels to learn what each
                  one does!
                </p>

                {/* Carrot/Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-t border-l border-indigo-500/30 rotate-45" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1 md:gap-2 lg:gap-3 relative z-20 shrink-0">
        <HeaderButton
          onClick={() => navigate("/dashboard")}
          title="Dashboard"
          id="header-dashboard-btn"
          className="hidden md:flex"
        >
          <LayoutDashboard size={18} />
        </HeaderButton>

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
          onClick={onToggleVariables}
          title="Variable Explorer"
          className={cn(
            isVariablesVisible && "text-emerald-500 bg-emerald-500/10",
          )}
        >
          <Database size={18} />
        </HeaderButton>

        <HeaderButton
          onClick={onSyncCloud}
          title="Sync to Cloud"
          className={cn(
            isGuest
              ? "text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 border border-indigo-500/10"
              : "text-indigo-500 bg-indigo-500/10",
          )}
        >
          <Cloud size={18} />
        </HeaderButton>

        <HeaderButton
          onClick={onToggleAskAI}
          title="Ask AI (Debug Console)"
          className={cn(isAskAIVisible && "text-indigo-400 bg-indigo-500/10")}
        >
          <Sparkles size={18} />
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
