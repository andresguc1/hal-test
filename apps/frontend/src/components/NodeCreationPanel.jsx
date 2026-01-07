import React, { useState } from "react";
import {
  ChevronLeft,
  Menu,
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
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "motion/react";
import { panelVariants } from "../utils/motion-variants";
import SettingsPage from "./SettingsPage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import "./styles/NodeCreationPanel.css";

// Definición de categorías y nodos (convertidos a claves de i18n para etiquetas)
const NODE_CATEGORIES = {
  browser_management: {
    icon: <Globe size={18} />,
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
    icon: <Code size={18} />,
    nodes: [
      { id: "find_element" },
      { id: "get_set_content" },
      { id: "wait_for_element" },
      { id: "execute_js" },
    ],
  },
  user_simulation: {
    icon: <Pointer size={18} />,
    nodes: [
      { id: "click" },
      { id: "type_text" },
      { id: "select_option" },
      { id: "submit_form" },
      { id: "scroll" },
      { id: "drag_drop" },
      { id: "upload_file" },
    ],
  },
  synchronization: {
    icon: <Clock size={18} />,
    nodes: [
      { id: "wait_visible" },
      { id: "wait_navigation" },
      { id: "wait_conditional" },
      { id: "pause" },
    ],
  },
  diagnostics: {
    icon: <Camera size={18} />,
    nodes: [
      { id: "take_screenshot" },
      { id: "save_dom" },
      { id: "log_errors" },
      { id: "listen_events" },
    ],
  },
  network_control: {
    icon: <Cable size={18} />,
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
    icon: <Cookie size={18} />,
    nodes: [
      { id: "manage_cookies" },
      { id: "manage_storage" },
      { id: "inject_tokens" },
      { id: "persist_session" },
    ],
  },
  test_execution: {
    icon: <CheckSquare size={18} />,
    nodes: [
      { id: "create_context" },
      { id: "cleanup_state" },
      { id: "handle_hooks" },
      { id: "control_exceptions" },
    ],
  },
  file_data: {
    icon: <Folder size={18} />,
    nodes: [
      { id: "read_data" },
      { id: "save_results" },
      { id: "handle_downloads" },
    ],
  },
  execution_interface: {
    icon: <Terminal size={18} />,
    nodes: [
      { id: "run_tests" },
      { id: "cli_params" },
      { id: "return_code" },
      { id: "integrate_ci" },
    ],
  },
  flow_control: {
    icon: <Settings2 size={18} />,
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
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    nodes: [
      { id: "call_llm" },
      { id: "generate_data" },
      { id: "validate_semantic" },
    ],
  },
};

export default function NodeCreationPanel({
  addNode,
  isVisible,
  togglePanel /* onOpenSettings prop ignored in favor of internal view */,
}) {
  const { t } = useTranslation();
  const [view, setView] = useState("nodes"); // "nodes" | "settings"

  // Set default open item (e.g., first category)
  const defaultOpen = "browser_management";

  return (
    <div className="panel-wrapper-burger">
      {/* Botón Toggle */}
      <Button
        variant="default"
        size="icon"
        className={cn(
          "fixed top-[76px] left-[20px] z-30 shadow-lg transition-all duration-300",
          isVisible && "left-[280px]",
        )}
        onClick={togglePanel}
        aria-label={isVisible ? t("common.hide_panel") : t("common.show_panel")}
      >
        {isVisible ? <ChevronLeft size={20} /> : <Menu size={20} />}
      </Button>

      {/* Panel lateral con AnimatePresence */}
      <AnimatePresence>
        {isVisible && (
          <motion.aside
            key="node-creation-panel"
            variants={panelVariants.left}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed top-[56px] left-0 h-[calc(100vh-56px-60px)] w-[280px] bg-hal-neutral-900 border-r border-hal-neutral-950 z-20 flex flex-col shadow-[2px_0_10px_rgba(0,0,0,0.7)]"
            role="complementary"
          >
            {view === "settings" ? (
              <div className="flex-1 flex flex-col bg-hal-neutral-900 overflow-hidden">
                <SettingsPage onBack={() => setView("nodes")} />
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-hal-neutral-950">
                  <h2 className="text-lg font-bold text-hal-primary-500 font-mono tracking-wider uppercase flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    {t("app.library_title")}
                  </h2>
                </div>

                <ScrollArea className="flex-1 bg-hal-neutral-900">
                  <div className="p-3">
                    <Accordion
                      type="single"
                      collapsible
                      defaultValue={defaultOpen}
                      className="w-full flex flex-col gap-1"
                    >
                      {Object.entries(NODE_CATEGORIES).map(
                        ([key, category]) => (
                          <AccordionItem
                            key={key}
                            value={key}
                            className="border-b border-hal-neutral-950 last:border-0 data-[state=open]:bg-hal-neutral-800 rounded-md transition-colors duration-200"
                          >
                            <AccordionTrigger className="hover:no-underline py-3 px-3 !bg-transparent hover:!bg-white/5 data-[state=open]:!bg-white/5 rounded-t-md">
                              <div className="flex items-center gap-5 text-sm font-medium font-mono text-hal-neutral-100">
                                <span className="text-hal-neutral-400 group-hover:text-hal-warning-500 transition-colors">
                                  {category.icon}
                                </span>
                                <span className="uppercase tracking-wide text-xs">
                                  {t(`nodes.categories.${key}`)}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="bg-hal-neutral-950 rounded-b-md">
                              <div className="flex flex-col gap-2 p-3">
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
                                    className="w-full"
                                  >
                                    <Button
                                      variant="secondary"
                                      className="w-full justify-start h-9 text-xs font-mono !bg-hal-neutral-800 hover:!bg-hal-primary-500 text-hal-neutral-100 border border-hal-neutral-700 hover:border-hal-primary-500 shadow-sm transition-all duration-200"
                                      onClick={() => addNode(node.id)}
                                    >
                                      <GripVertical className="mr-2 h-3 w-3 text-hal-neutral-400" />
                                      {t(`nodes.labels.${node.id}`)}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ),
                      )}
                    </Accordion>
                  </div>
                </ScrollArea>

                <div className="p-3 border-t border-hal-neutral-950 mt-auto bg-hal-neutral-800">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 px-3 gap-3 !bg-transparent text-hal-neutral-400 hover:!bg-hal-neutral-700 hover:text-hal-neutral-100 transition-all rounded-md group"
                    onClick={() => setView("settings")}
                  >
                    <Settings
                      size={18}
                      className="text-hal-neutral-400 group-hover:text-hal-neutral-100 transition-colors"
                    />
                    <span className="text-sm font-medium leading-none">
                      {t("settings.title", "Settings")}
                    </span>
                  </Button>
                </div>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
