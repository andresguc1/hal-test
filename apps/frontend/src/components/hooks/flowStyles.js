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
};

/**
 * Colores y estilos profesionales para estados de nodos con apariencia de botón.
 */
export const PROFESSIONAL_COLORS = {
  [NODE_STATES.DEFAULT]: {
    background: "#f8f9fa", // Fondo claro, apariencia de botón normal
    border: "#ced4da",
    text: "#212529",
    shadow: "0 2px 4px rgba(0,0,0,0.1)",
    borderWidth: "1px",
  },
  [NODE_STATES.EXECUTING]: {
    background: "#fff3e0", // Naranja claro (animación)
    border: "#ff9800",
    text: "#e65100",
    shadow: "0 0 12px rgba(255,152,0,0.4)",
    animate: true,
    borderWidth: "2px",
  },
  [NODE_STATES.SUCCESS]: {
    background: "#d4edda", // Verde claro
    border: "#28a745",
    text: "#155724",
    shadow: "0 2px 8px rgba(40,167,69,0.3)",
    borderWidth: "1px",
  },
  [NODE_STATES.ERROR]: {
    background: "#f8d7da", // Rojo claro
    border: "#dc3545",
    text: "#721c24",
    shadow: "0 2px 8px rgba(220,53,69,0.4)",
    borderWidth: "2px",
  },
  [NODE_STATES.WARNING]: {
    background: "#fff9c4", // Amarillo claro
    border: "#ffc107",
    text: "#856404",
    shadow: "0 2px 6px rgba(255,193,7,0.3)",
    borderWidth: "1px",
  },
  [NODE_STATES.SKIPPED]: {
    background: "#e9ecef", // Gris muy claro
    border: "#adb5bd",
    text: "#495057",
    shadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderWidth: "1px",
  },
  [NODE_STATES.CAPTURING_BEFORE]: {
    background: "#f3e8ff", // Púrpura claro
    border: "#9333ea",
    text: "#581c87",
    shadow: "0 0 12px rgba(147,51,234,0.4)",
    animate: true,
    borderWidth: "2px",
  },
  [NODE_STATES.CAPTURING_AFTER]: {
    background: "#cffafe", // Cyan claro
    border: "#06b6d4",
    text: "#164e63",
    shadow: "0 0 12px rgba(6,182,212,0.4)",
    animate: true,
    borderWidth: "2px",
  },
};

/**
 * Obtiene el objeto de estilo para un nodo con apariencia de botón.
 */
export const getNodeStyle = (state, customStyle = {}) => {
  const colorConfig =
    PROFESSIONAL_COLORS[state] || PROFESSIONAL_COLORS[NODE_STATES.DEFAULT];
  return {
    background: colorConfig.background,
    color: colorConfig.text,
    border: `${colorConfig.borderWidth || "2px"} solid ${colorConfig.border}`,
    padding: "10px 15px", // Tamaño de botón
    borderRadius: "8px", // Esquinas redondeadas
    fontSize: "14px",
    fontWeight: "600", // Texto audaz
    boxShadow: colorConfig.shadow,
    transition: "all 0.2s ease-in-out", // Transición suave
    minWidth: "180px",
    textAlign: "center",
    cursor: "pointer", // Indica interactividad
    // La animación 'pulse' necesita CSS global
    ...(colorConfig.animate && {
      animation: "pulse 1.5s infinite",
    }),
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
