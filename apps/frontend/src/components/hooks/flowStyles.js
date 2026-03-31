// flowStyles.js

/**
 * Estados mejorados para nodos de flujo.
 */
export const NODE_STATES = {
  DEFAULT: "default",
  EXECUTING: "executing",
  CAPTURING_BEFORE: "capturing-before",
  CAPTURING_AFTER: "capturing-after",
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  SKIPPED: "skipped",
  PICKING: "picking",
  HEALED: "healed",
};

export const PROFESSIONAL_COLORS = {
  [NODE_STATES.DEFAULT]: {
    background: "var(--system-background)",
    border: "#94a3b8", // slate-400
    text: "var(--label-primary)",
    shadow: "0 1px 2px rgba(0,0,0,0.05)",
    borderWidth: "1px",
  },
  [NODE_STATES.PICKING]: {
    background: "#f0f9ff", // sky-50
    border: "#0ea5e9", // sky-500
    text: "#0369a1", // sky-700
    shadow: "0 0 15px rgba(14,165,233,0.3)",
    animate: true,
    borderWidth: "2px",
    customClass: "animate-pulse ring-2 ring-sky-400",
  },
  [NODE_STATES.EXECUTING]: {
    background: "#fffbeb", // amber-50
    border: "#f59e0b", // amber-600
    text: "#b45309", // amber-800
    shadow: "0 0 12px rgba(245,158,11,0.2)",
    animate: true,
    borderWidth: "2px",
  },
  [NODE_STATES.SUCCESS]: {
    background: "#f0fdf4", // green-50
    border: "#16a34a", // green-600
    text: "#166534", // green-800
    shadow: "0 2px 8px rgba(22,163,74,0.15)",
    borderWidth: "1px",
  },
  [NODE_STATES.HEALED]: {
    background: "#fffbeb", // amber-50
    border: "#f59e0b", // amber-500
    text: "#b45309", // amber-700
    shadow: "0 0 12px rgba(245,158,11,0.2)",
    borderWidth: "2px",
  },
  [NODE_STATES.ERROR]: {
    background: "#fef2f2", // red-50
    border: "#dc2626", // red-600
    text: "#991b1b", // red-800
    shadow: "0 2px 8px rgba(220,38,38,0.2)",
    borderWidth: "2px",
  },
  [NODE_STATES.WARNING]: {
    background: "#fffbeb", // amber-50
    border: "#d97706", // amber-600
    text: "#92400e", // amber-800
    shadow: "0 2px 6px rgba(217,119,6,0.15)",
    borderWidth: "1px",
  },
  [NODE_STATES.SKIPPED]: {
    background: "#f8fafc", // slate-50
    border: "#cbd5e1", // slate-300
    text: "#64748b", // slate-500
    shadow: "0 1px 2px rgba(0,0,0,0.05)",
    borderWidth: "1px",
  },
};

/**
 * Obtiene el objeto de estilo para un nodo con apariencia de botón.
 */
export const getNodeStyle = (state, customStyle = {}) => {
  // const colorConfig = PROFESSIONAL_COLORS[state] || PROFESSIONAL_COLORS[NODE_STATES.DEFAULT];
  return {
    background: "transparent", // Let the component handle it
    color: "transparent", // Let the component handle it
    border: "none", // Let the component handle it
    padding: "0",
    borderRadius: "12px",
    boxShadow: "none",
    transition: "all 0.2s ease-in-out",
    minWidth: "200px",
    cursor: "pointer",
    ...customStyle,
  };
};

/*
Para la animación de 'EXECUTING', necesitarás el siguiente CSS global:
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.9; }
  100% { transform: scale(1); opacity: 1; }
}
*/

/**
 * Category colors for visual differentiation.
 * These are used as accents (left border strip) on the nodes.
 */
export const CATEGORY_COLORS = {
  browser_management: "#3b82f6", // Blue
  dom_manipulation: "#8b5cf6", // Purple
  user_simulation: "#f97316", // Orange
  synchronization: "#06b6d4", // Cyan
  diagnostics: "#ec4899", // Pink
  network_control: "#64748b", // Slate
  session_management: "#6366f1", // Indigo
  test_execution: "#ef4444", // Red
  file_data: "#10b981", // Emerald
  llm_ai: "#7c3aed", // Violet
  execution_interface: "#71717a", // Zinc
  default: "#94a3b8", // Gray
};
