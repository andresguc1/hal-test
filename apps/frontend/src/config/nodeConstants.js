import {
  Globe,
  MousePointer,
  Clock,
  Bug,
  Code,
  Camera,
  Cable,
  Cookie,
  CheckSquare,
  Folder,
  Terminal,
  Settings2,
  Box,
  Brain,
  RefreshCw,
} from "lucide-react";

// --- GLOBAL ALL-IN-ONE CONFIGURATION ---

// 1. COLORS & CATEGORIES
export const NODE_CATEGORIES = {
  browser_management: {
    icon: Globe,
    color: "blue", // Browser = Blue (#3b82f6)
    label: "Browser",
    nodes: [
      "launch_browser",
      "open_url",
      "close_browser",
      "manage_tabs",
      "resize_viewport",
      "go_back",
      "go_forward",
      "wait_navigation",
      "reload_page",
    ],
  },
  dom_manipulation: {
    icon: Code,
    color: "cyan", // DOM = Cyan
    label: "DOM / Code",
    nodes: [
      "find_element",
      "get_set_content",
      "execute_js",
      "wait_for_element",
    ],
  },
  user_simulation: {
    icon: MousePointer,
    color: "pink", // User = Pink
    label: "User Actions",
    nodes: [
      "click",
      "type_text",
      "select_option",
      "submit_form",
      "scroll",
      "drag_drop",
      "hover",
    ],
  },
  diagnostics: {
    icon: Camera,
    color: "rose", // Diagnostics = Rose (#f43f5e) - REQUESTED CHANGE
    label: "Diagnostics",
    nodes: ["take_screenshot", "save_dom", "log_errors", "listen_events"],
  },
  llm_ai: {
    icon: Brain,
    color: "violet", // AI = Violet
    label: "AI Models",
    nodes: ["call_llm", "generate_data", "validate_semantic"],
  },
  network_control: {
    icon: Cable,
    color: "emerald", // Network = Emerald (#10b981)
    label: "Network",
    nodes: [
      "configure_route",
      "wait_network_match",
      "set_network_conditions",
      "clear_all_mocks",
      "wait_network",
    ],
  },
  test_execution: {
    icon: Cookie,
    color: "orange",
    label: "Context",
    nodes: [
      "manage_session",
      "persist_session",
      "create_context",
      "cleanup_state",
    ],
  },
  file_data: {
    icon: Folder,
    color: "yellow", // Files = Yellow (High visibility)
    label: "Files & Data",
    nodes: ["read_file", "write_file", "upload_file", "download_file"],
  },
  execution_interface: {
    icon: Terminal,
    color: "slate",
    label: "CLI / System",
    nodes: ["run_tests", "cli_params", "return_code", "integrate_ci"],
  },
  flow_control: {
    icon: Settings2,
    color: "purple", // Logic = Purple (Distinct from Error/Red)
    label: "Logic / Flow",
    nodes: [
      "variable",
      "conditional",
      "loop",
      "branch",
      "flow_control",
      "transform",
      "wait_conditional",
      "pause",
    ],
  },
  composition: {
    icon: Box,
    color: "gray", // Components = Gray/Neutral
    label: "Components",
    nodes: ["component", "input", "output"],
  },
};

// 2. HELPER: MAP NODE TYPE -> CATEGORY INFO
export const NODE_TYPE_MAP = Object.entries(NODE_CATEGORIES).reduce(
  (acc, [catKey, catData]) => {
    catData.nodes.forEach((nodeType) => {
      // Define specific overrides
      const overrides = {};
      if (nodeType === "close_browser") overrides.terminal = true;

      acc[nodeType] = {
        category: catKey,
        color: catData.color,
        icon: catData.icon,
        label: nodeType
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        ...overrides,
      };
    });
    return acc;
  },
  {},
);

// 3. STYLE DEFINITIONS (SOLID THEME)
// Strict strict synchronization.
// Nodes are SOLID colored blocks. Text is WHITE.
// Selected nodes get a WHITE border and colored glow.
export const CATEGORY_STYLES = {
  cyan: {
    card: "bg-cyan-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium group-hover:text-cyan-200",
    node: {
      base: "bg-cyan-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(6,182,212,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-cyan-500",
      shadow: "shadow-2xl shadow-cyan-500/20",
      header: "bg-cyan-600 text-white",
    },
  },
  blue: {
    card: "bg-blue-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-blue-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(59,130,246,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-blue-500",
      shadow: "shadow-2xl shadow-blue-500/20",
      header: "bg-blue-600 text-white",
    },
  },
  indigo: {
    card: "bg-indigo-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-indigo-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(99,102,241,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-indigo-500",
      shadow: "shadow-2xl shadow-indigo-500/20",
      header: "bg-indigo-600 text-white",
    },
  },
  violet: {
    card: "bg-violet-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-violet-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(139,92,246,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-violet-500",
      shadow: "shadow-2xl shadow-violet-500/20",
      header: "bg-violet-600 text-white",
    },
  },
  purple: {
    card: "bg-purple-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-purple-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(168,85,247,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-purple-500",
      shadow: "shadow-2xl shadow-purple-500/20",
      header: "bg-purple-600 text-white",
    },
  },
  fuchsia: {
    card: "bg-fuchsia-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-fuchsia-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(232,121,249,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-fuchsia-500",
      shadow: "shadow-2xl shadow-fuchsia-500/20",
      header: "bg-fuchsia-600 text-white",
    },
  },
  pink: {
    card: "bg-pink-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-pink-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(236,72,153,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-pink-500",
      shadow: "shadow-2xl shadow-pink-500/20",
      header: "bg-pink-600 text-white",
    },
  },
  amber: {
    card: "bg-amber-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-amber-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(245,158,11,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-amber-500",
      shadow: "shadow-2xl shadow-amber-500/20",
      header: "bg-amber-600 text-white",
    },
  },
  emerald: {
    card: "bg-emerald-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-emerald-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(16,185,129,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-emerald-500",
      shadow: "shadow-2xl shadow-emerald-500/20",
      header: "bg-emerald-600 text-white",
    },
  },
  rose: {
    card: "bg-rose-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-rose-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(244,63,94,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-rose-500",
      shadow: "shadow-2xl shadow-rose-500/20",
      header: "bg-rose-600 text-white",
    },
  },
  red: {
    card: "bg-red-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-red-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(239,68,68,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-red-500",
      shadow: "shadow-2xl shadow-red-500/20",
      header: "bg-red-600 text-white",
    },
  },
  orange: {
    card: "bg-orange-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-orange-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(249,115,22,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-orange-500",
      shadow: "shadow-2xl shadow-orange-500/20",
      header: "bg-orange-600 text-white",
    },
  },
  lime: {
    card: "bg-lime-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-lime-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(132,204,22,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-lime-500",
      shadow: "shadow-2xl shadow-lime-500/20",
      header: "bg-lime-600 text-white",
    },
  },
  yellow: {
    card: "bg-yellow-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-yellow-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(234,179,8,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-yellow-500",
      shadow: "shadow-2xl shadow-yellow-500/20",
      header: "bg-yellow-600 text-white",
    },
  },
  sky: {
    card: "bg-sky-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-sky-500 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(14,165,233,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-sky-500",
      shadow: "shadow-2xl shadow-sky-500/20",
      header: "bg-sky-600 text-white",
    },
  },
  slate: {
    card: "bg-slate-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-slate-600 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(100,116,139,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-slate-500",
      shadow: "shadow-2xl shadow-slate-500/20",
      header: "bg-slate-600 text-white",
    },
  },
  gray: {
    card: "bg-gray-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-gray-600 border border-white/20 shadow-md ring-2 ring-white/10",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(107,114,128,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-gray-500",
      shadow: "shadow-2xl shadow-gray-500/20",
      header: "bg-gray-600 text-white",
    },
  },
  // Fallback
  default: {
    card: "bg-slate-500 text-white hover:brightness-110 border-none shadow-sm",
    icon: "text-white",
    text: "text-white font-medium",
    node: {
      base: "bg-slate-600 border border-white/20 shadow-md",
      selected:
        "!border-[3px] !border-white shadow-[0_0_25px_rgba(100,116,139,0.8)] scale-105",
      glow: "",
    },
    panel: {
      border: "border-slate-500",
      shadow: "shadow-2xl shadow-slate-500/20",
      header: "bg-slate-600 text-white",
    },
  },
};

export const getTheme = (colorKey) =>
  CATEGORY_STYLES[colorKey] || CATEGORY_STYLES.slate;
export const getNodeConfig = (nodeType) =>
  NODE_TYPE_MAP[nodeType] || {
    category: "default",
    color: "slate",
    icon: Box,
    label: nodeType,
  };
