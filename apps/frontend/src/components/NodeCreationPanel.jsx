import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Globe,
  Pointer,
  Code,
  Clock,
  Camera,
  Cable,
  Cookie,
  CheckSquare,
  Folder,
  Terminal,
  Settings2,
  Settings,
  Sparkles,
  GripVertical,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import SettingsPage from "./SettingsPage";
import { api } from "../utils/api";

/**
 * MAREA DESIGN SYSTEM - LEFT SIDEBAR (TOOLBOX)
 * Glass accordion panel for node selection.
 */

// Node categories with icons
const NODE_CATEGORIES = {
  browser_management: {
    icon: <Globe size={16} />,
    nodes: [
      { id: "launch_browser" },
      { id: "open_url" },
      { id: "close_browser" },
      { id: "manage_tabs" },
      { id: "resize_viewport" },
      { id: "go_back" },
      { id: "go_forward" },
    ],
  },
  dom_manipulation: {
    icon: <Code size={16} />,
    nodes: [
      { id: "find_element" },
      { id: "get_set_content" },
      { id: "wait_for_element" },
      { id: "execute_js" },
      { id: "assert_page_text" },
    ],
  },
  user_simulation: {
    icon: <Pointer size={16} />,
    nodes: [
      { id: "click" },
      { id: "type_text" },
      { id: "fill_form" },
      { id: "select_option" },
      { id: "submit_form" },
      { id: "scroll" },
      { id: "drag_drop" },
      { id: "upload_file" },
    ],
  },
  synchronization: {
    icon: <Clock size={16} />,
    nodes: [
      { id: "wait_visible" },
      { id: "wait_navigation" },
      { id: "wait_conditional" },
      { id: "pause" },
    ],
  },
  diagnostics: {
    icon: <Camera size={16} />,
    nodes: [
      { id: "take_screenshot" },
      { id: "save_dom" },
      { id: "log_errors" },
      { id: "listen_events" },
    ],
  },
  network_control: {
    icon: <Cable size={16} />,
    nodes: [
      { id: "intercept_request" },
      { id: "wait_network" },
      { id: "wait_for_response" },
      { id: "wait_for_request" },
      { id: "mock_response" },
      { id: "block_resource" },
      { id: "modify_headers" },
      { id: "set_network_conditions" },
      { id: "clear_all_mocks" },
    ],
  },
  session_management: {
    icon: <Cookie size={16} />,
    nodes: [
      { id: "manage_cookies" },
      { id: "manage_storage" },
      { id: "inject_tokens" },
      { id: "persist_session" },
    ],
  },
  test_execution: {
    icon: <CheckSquare size={16} />,
    nodes: [
      { id: "create_context" },
      { id: "cleanup_state" },
      { id: "handle_hooks" },
      { id: "control_exceptions" },
    ],
  },
  file_data: {
    icon: <Folder size={16} />,
    nodes: [
      { id: "read_data" },
      { id: "save_results" },
      { id: "handle_downloads" },
    ],
  },
  execution_interface: {
    icon: <Terminal size={16} />,
    nodes: [
      { id: "run_tests" },
      { id: "cli_params" },
      { id: "return_code" },
      { id: "integrate_ci" },
    ],
  },
  flow_control: {
    icon: <Settings2 size={16} />,
    nodes: [
      { id: "variable" },
      { id: "conditional" },
      { id: "loop" },
      { id: "branch" },
      { id: "flow_control" },
      { id: "transform" },
    ],
  },
  llm_ai: {
    icon: <Sparkles size={16} className="text-purple-400" />,
    nodes: [
      { id: "call_llm" },
      { id: "generate_data" },
      { id: "validate_semantic" },
      { id: "extract_dom_context" },
      { id: "chain_of_thought" },
    ],
  },
};

export default function NodeCreationPanel({
  addNode,
  isVisible /*, togglePanel */,
}) {
  const { t } = useTranslation();
  const [view, setView] = useState("nodes");
  const [openCategories, setOpenCategories] = useState(["browser_management"]);

  const [isAIConfigured, setIsAIConfigured] = useState(false);

  useEffect(() => {
    let active = true;

    const checkAIConfigValidity = async () => {
      try {
        const configStr = localStorage.getItem("hal_ai_config");
        if (!configStr) {
          if (active) setIsAIConfigured(false);
          return;
        }
        const config = JSON.parse(configStr);
        const provider = config.activeProvider || "ollama";
        const baseUrl = config.baseUrl;
        const apiKey = config.keys?.[provider] || config.apiKey || "";
        const model = config.selectedModel;

        if (provider === "ollama" && !baseUrl) {
          if (active) setIsAIConfigured(false);
          return;
        }
        if (provider !== "ollama" && !apiKey) {
          if (active) setIsAIConfigured(false);
          return;
        }

        const res = await api.post("/ai/validate", {
          provider,
          apiKey,
          baseUrl,
          model,
        });

        if (active) {
          setIsAIConfigured(!!res && res.success);
        }
      } catch (err) {
        console.warn(
          "[NodeCreationPanel] AI validation check failed:",
          err.message,
        );
        if (active) setIsAIConfigured(false);
      }
    };

    checkAIConfigValidity();

    window.addEventListener("hal_ai_config_updated", checkAIConfigValidity);
    return () => {
      active = false;
      window.removeEventListener(
        "hal_ai_config_updated",
        checkAIConfigValidity,
      );
    };
  }, []);

  const toggleCategory = (category) => {
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  if (!isVisible) return null;

  return (
    <aside
      className={cn(
        "absolute left-4 top-16 bottom-20 w-64 z-30 select-none flex flex-col", // Floating Position
        "bg-slate-800/90 backdrop-blur-xl", // Heavy Glass & Contrast Fix
        "border border-white/10 rounded-2xl", // Distinct Borders
        "shadow-2xl overflow-hidden", // Shadow & Clip
      )}
    >
      {view === "settings" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <SettingsPage onBack={() => setView("nodes")} />
        </div>
      ) : (
        <>
          {/* Header / Title (Optional) */}
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {t("common.toolbox", "Toolbox")}
            </h2>
          </div>

          {/* Categories and Nodes - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
            <div className="px-2 space-y-1">
              {Object.entries(NODE_CATEGORIES).map(([key, category]) => {
                const isAiCat = key === "llm_ai";
                const isLocked = isAiCat && !isAIConfigured;

                return (
                  <div key={key} className="mb-1">
                    {/* Category Header */}
                    <button
                      onClick={() => {
                        if (isLocked) {
                          setView("settings"); // Redirect to settings on click!
                          return;
                        }
                        toggleCategory(key);
                      }}
                      title={
                        isLocked
                          ? t(
                              "nodes.categories.llm_ai_locked_tooltip",
                              "Configure AI & Integrations in settings to unlock this category",
                            )
                          : undefined
                      }
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2",
                        "text-[11px] font-bold uppercase tracking-wider",
                        "hover:bg-white/5 rounded-md transition-all duration-200",
                        isLocked
                          ? "text-slate-600 cursor-pointer opacity-60 hover:opacity-100 border border-indigo-500/10 bg-indigo-950/10"
                          : "text-slate-500 hover:text-slate-200",
                        openCategories.includes(key) &&
                          !isLocked &&
                          "text-slate-200",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "opacity-70",
                            openCategories.includes(key) && !isLocked
                              ? "text-blue-400"
                              : "",
                            isLocked && "text-indigo-500/50",
                          )}
                        >
                          {category.icon}
                        </span>
                        <span>{t(`nodes.categories.${key}`)}</span>
                        {isLocked && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest ml-auto animate-pulse">
                            Locked
                          </span>
                        )}
                      </div>
                      {!isLocked && (
                        <ChevronLeft
                          size={12}
                          className={cn(
                            "transition-transform duration-200 opacity-50",
                            openCategories.includes(key) && "-rotate-90",
                          )}
                        />
                      )}
                    </button>

                    {/* Node Items (Draggable) */}
                    {openCategories.includes(key) && !isLocked && (
                      <div className="mt-1 ml-2 pl-2 border-l border-white/5 space-y-0.5">
                        {category.nodes.map((node) => (
                          <div
                            key={node.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                "application/reactflow",
                                node.id,
                              );
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onClick={() => addNode(node.id)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-md group cursor-grab active:cursor-grabbing",
                              "text-[13px] font-medium text-slate-400",
                              "hover:bg-white/5 hover:text-white hover:translate-x-1",
                              "transition-all duration-200",
                            )}
                          >
                            <span className="flex-1 truncate">
                              {t(`nodes.labels.${node.id}`)}
                            </span>
                            <GripVertical
                              size={12}
                              className="text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settings Button - Bottom */}
          <div className="p-3 border-t border-white/5 bg-slate-900/50">
            <button
              onClick={() => setView("settings")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                "text-sm font-medium text-slate-400 hover:text-white",
                "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10",
                "transition-all duration-200",
              )}
            >
              <Settings size={14} />
              <span>{t("settings.title", "Settings")}</span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
