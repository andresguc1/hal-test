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
  // Importación de Brain para la categoría LLM/AI
  Brain,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { panelVariants } from "../utils/motion-variants";
import "./styles/NodeCreationPanel.css";

// Definición de categorías y nodos (convertidos a claves de i18n para etiquetas)
const NODE_CATEGORIES = {
  browser_management: {
    icon: <Globe size={20} />,
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
    icon: <Code size={20} />,
    nodes: [
      { id: "find_element" },
      { id: "get_set_content" },
      { id: "wait_for_element" },
      { id: "execute_js" },
    ],
  },
  user_simulation: {
    icon: <Pointer size={20} />,
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
    icon: <Clock size={20} />,
    nodes: [
      { id: "wait_visible" },
      { id: "wait_navigation" },
      { id: "wait_conditional" },
    ],
  },
  diagnostics: {
    icon: <Camera size={20} />,
    nodes: [
      { id: "take_screenshot" },
      { id: "save_dom" },
      { id: "log_errors" },
      { id: "listen_events" },
    ],
  },
  network_control: {
    icon: <Cable size={20} />,
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
    icon: <Cookie size={20} />,
    nodes: [
      { id: "manage_cookies" },
      { id: "manage_storage" },
      { id: "inject_tokens" },
      { id: "persist_session" },
    ],
  },
  test_execution: {
    icon: <CheckSquare size={20} />,
    nodes: [
      { id: "create_context" },
      { id: "cleanup_state" },
      { id: "handle_hooks" },
      { id: "control_exceptions" },
    ],
  },
  file_data: {
    icon: <Folder size={20} />,
    nodes: [
      { id: "read_data" },
      { id: "save_results" },
      { id: "handle_downloads" },
    ],
  },
  llm_ai: {
    icon: <Brain size={20} />,
    nodes: [
      { id: "call_llm" },
      { id: "generate_data" },
      { id: "validate_semantic" },
    ],
  },
  execution_interface: {
    icon: <Terminal size={20} />,
    nodes: [
      { id: "run_tests" },
      { id: "cli_params" },
      { id: "return_code" },
      { id: "integrate_ci" },
    ],
  },
};

const initialTabId = Object.keys(NODE_CATEGORIES)[0];

export default function NodeCreationPanel({ addNode, isVisible, togglePanel }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTabId);

  return (
    <div className="panel-wrapper-burger">
      {/* Botón Toggle */}
      <button
        className={`btn-toggle-burger ${isVisible ? "panel-open" : ""}`}
        aria-label={
          isVisible ? t("common.hide_panel") : t("common.show_panel")
        }
        onClick={togglePanel}
      >
        {isVisible ? <ChevronLeft size={20} /> : <Menu size={20} />}
      </button>

      {/* Panel lateral con AnimatePresence */}
      <AnimatePresence>
        {isVisible && (
          <motion.aside
            key="node-creation-panel"
            variants={panelVariants.left}
            initial="initial"
            animate="animate"
            exit="exit"
            className="panel-left"
            role="complementary"
          >
            <h2>{t("app.library_title")}</h2>

            <div className="panel-content-flex">
              {/* Tabs verticales */}
              <div
                className="tab-bar-vertical"
                role="tablist"
                aria-orientation="vertical"
              >
                {Object.keys(NODE_CATEGORIES).map((tabId) => (
                  <button
                    key={tabId}
                    className={`tab-button-vertical ${activeTab === tabId ? "active" : ""}`}
                    onClick={() => setActiveTab(tabId)}
                    aria-selected={activeTab === tabId}
                    role="tab"
                    title={t(`nodes.categories.${tabId}`)}
                  >
                    {NODE_CATEGORIES[tabId].icon}
                    <span className="tab-label-vertical">
                      {t(`nodes.categories.${tabId}`)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Contenido de nodos */}
              <div className="tab-content-vertical" role="tabpanel">
                {NODE_CATEGORIES[activeTab].nodes.map((node) => (
                  <motion.button
                    key={node.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/reactflow", node.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.08)" }}
                    whileTap={{ scale: 0.96 }}
                    className="btn-node"
                    onClick={() => addNode(node.id)}
                    title={t(`nodes.labels.${node.id}`)}
                  >
                    {t(`nodes.labels.${node.id}`)}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
