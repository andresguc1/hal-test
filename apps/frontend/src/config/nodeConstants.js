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
  Search,
  Sparkles,
  Zap,
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
    label: "AI / Intelligence",
    nodes: [
      "call_llm",
      "generate_data",
      "validate_semantic",
      "extract_dom_context",
      "chain_of_thought",
      "smart_selector",
    ],
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
    label: "Logic Engine",
    nodes: [
      "variable",
      "conditional",
      "switch",
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
      if (nodeType === "extract_dom_context") overrides.icon = Search;
      if (nodeType === "chain_of_thought") overrides.icon = Sparkles;
      if (nodeType === "smart_selector") overrides.icon = Zap;

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

// 3. NODE OUTPUT SCHEMAS (Static fallback for UX)
export const NODE_OUTPUTS = {
  launch_browser: {
    browserId: "string",
    status: "string",
    success: "boolean",
  },
  open_url: {
    url: "string",
    status: "number",
    success: "boolean",
    message: "string",
  },
  find_element: {
    found: "boolean",
    count: "number",
    selector: "string",
    success: "boolean",
  },
  click: {
    success: "boolean",
    selector: "string",
    message: "string",
  },
  type_text: {
    success: "boolean",
    text: "string",
    selector: "string",
    message: "string",
  },
  select_option: {
    success: "boolean",
    value: "string",
    selector: "string",
  },
  get_set_content: {
    success: "boolean",
    content: "string",
    type: "string",
  },
  execute_js: {
    success: "boolean",
    result: "any",
    message: "string",
  },
  call_llm: {
    success: "boolean",
    result: "string",
    usage: "object",
  },
  generate_data: {
    success: "boolean",
    data: "any",
  },
  extract_dom_context: {
    success: "boolean",
    context: "string",
  },
  take_screenshot: {
    success: "boolean",
    path: "string",
    url: "string",
  },
  run_tests: {
    success: "boolean",
    passed: "number",
    failed: "number",
    total: "number",
  },
  component: {
    success: "boolean",
    data: "object",
  },
  wait: {
    success: "boolean",
    duration: "number",
  },
  branch: {
    success: "boolean",
    path: "string",
  },
};

// 4. STYLE DEFINITIONS (SOLID THEME)
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
      headerBorder: "border-cyan-500/50",
      headerGradient: "from-cyan-600/60 via-cyan-600/20 to-transparent",
      categoryText: "text-cyan-500 dark:text-cyan-400",
      buttonGradient: "from-cyan-600 to-cyan-500 shadow-cyan-500/20",
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
      headerBorder: "border-blue-500/50",
      headerGradient: "from-blue-600/60 via-blue-600/20 to-transparent",
      categoryText: "text-blue-500 dark:text-blue-400",
      buttonGradient: "from-blue-600 to-blue-500 shadow-blue-500/20",
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
      headerBorder: "border-indigo-500/50",
      headerGradient: "from-indigo-600/60 via-indigo-600/20 to-transparent",
      categoryText: "text-indigo-500 dark:text-indigo-400",
      buttonGradient: "from-indigo-600 to-indigo-500 shadow-indigo-500/20",
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
      headerBorder: "border-violet-500/50",
      headerGradient: "from-violet-600/60 via-violet-600/20 to-transparent",
      categoryText: "text-violet-500 dark:text-violet-400",
      buttonGradient: "from-violet-600 to-violet-500 shadow-violet-500/20",
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
      headerBorder: "border-purple-500/50",
      headerGradient: "from-purple-600/60 via-purple-600/20 to-transparent",
      categoryText: "text-purple-500 dark:text-purple-400",
      buttonGradient: "from-purple-600 to-purple-500 shadow-purple-500/20",
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
      headerBorder: "border-fuchsia-500/50",
      headerGradient: "from-fuchsia-600/60 via-fuchsia-600/20 to-transparent",
      categoryText: "text-fuchsia-500 dark:text-fuchsia-400",
      buttonGradient: "from-fuchsia-600 to-fuchsia-500 shadow-fuchsia-500/20",
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
      headerBorder: "border-pink-500/50",
      headerGradient: "from-pink-600/60 via-pink-600/20 to-transparent",
      categoryText: "text-pink-500 dark:text-pink-400",
      buttonGradient: "from-pink-600 to-pink-500 shadow-pink-500/20",
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
      headerBorder: "border-amber-500/50",
      headerGradient: "from-amber-600/60 via-amber-600/20 to-transparent",
      categoryText: "text-amber-500 dark:text-amber-400",
      buttonGradient: "from-amber-600 to-amber-500 shadow-amber-500/20",
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
      headerBorder: "border-emerald-500/50",
      headerGradient: "from-emerald-600/60 via-emerald-600/20 to-transparent",
      categoryText: "text-emerald-500 dark:text-emerald-400",
      buttonGradient: "from-emerald-600 to-emerald-500 shadow-emerald-500/20",
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
      headerBorder: "border-rose-500/50",
      headerGradient: "from-rose-600/60 via-rose-600/20 to-transparent",
      categoryText: "text-rose-500 dark:text-rose-400",
      buttonGradient: "from-rose-600 to-rose-500 shadow-rose-500/20",
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
      headerBorder: "border-red-500/50",
      headerGradient: "from-red-600/60 via-red-600/20 to-transparent",
      categoryText: "text-red-500 dark:text-red-400",
      buttonGradient: "from-red-600 to-red-500 shadow-red-500/20",
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
      headerBorder: "border-orange-500/50",
      headerGradient: "from-orange-600/60 via-orange-600/20 to-transparent",
      categoryText: "text-orange-500 dark:text-orange-400",
      buttonGradient: "from-orange-600 to-orange-500 shadow-orange-500/20",
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
      headerBorder: "border-lime-500/50",
      headerGradient: "from-lime-600/60 via-lime-600/20 to-transparent",
      categoryText: "text-lime-500 dark:text-lime-400",
      buttonGradient: "from-lime-600 to-lime-500 shadow-lime-500/20",
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
      headerBorder: "border-yellow-500/50",
      headerGradient: "from-yellow-600/60 via-yellow-600/20 to-transparent",
      categoryText: "text-yellow-500 dark:text-yellow-400",
      buttonGradient: "from-yellow-600 to-yellow-500 shadow-yellow-500/20",
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
      headerBorder: "border-sky-500/50",
      headerGradient: "from-sky-600/60 via-sky-600/20 to-transparent",
      categoryText: "text-sky-500 dark:text-sky-400",
      buttonGradient: "from-sky-600 to-sky-500 shadow-sky-500/20",
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
      headerBorder: "border-slate-500/50",
      headerGradient: "from-slate-600/60 via-slate-600/20 to-transparent",
      categoryText: "text-slate-500 dark:text-slate-400",
      buttonGradient: "from-slate-600 to-slate-500 shadow-slate-500/20",
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
      headerBorder: "border-gray-500/50",
      headerGradient: "from-gray-600/60 via-gray-600/20 to-transparent",
      categoryText: "text-gray-500 dark:text-gray-400",
      buttonGradient: "from-gray-600 to-gray-500 shadow-gray-500/20",
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
      headerBorder: "border-slate-500/50",
      headerGradient: "from-slate-600/60 via-slate-600/20 to-transparent",
      categoryText: "text-slate-500 dark:text-slate-400",
      buttonGradient: "from-slate-600 to-slate-500 shadow-slate-500/20",
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
