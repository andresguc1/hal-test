/**
 * Icon mapping for node types by category
 * Maps each node type to a specific Lucide icon
 */

import {
    Globe,
    Code2,
    MousePointer2,
    Clock,
    Camera,
    Wifi,
    Cookie,
    CheckSquare,
    FolderOpen,
    Sparkles,
    Terminal,
    Settings2,
    // Specific node icons
    Link2,
    X,
    Maximize2,
    ArrowLeft,
    ArrowRight,
    Search,
    FileText,
    Eye,
    Zap,
    MousePointerClick,
    Keyboard,
    ListIcon,
    SendIcon,
    MoveVertical,
    Upload,
    Image as ImageIcon,
    Save,
    AlertCircle,
    Ear,
    RefreshCw,
    Network,
    Shield,
    Settings,
    Package,
    Trash2,
    Play,
    FileCode,
    Database,
    CloudDownload,
} from "lucide-react";

// Category Icons (for fallback)
export const CATEGORY_ICONS = {
    browser_management: Globe,
    dom_manipulation: Code2,
    user_simulation: MousePointer2,
    synchronization: Clock,
    diagnostics: Camera,
    network_control: Wifi,
    session_management: Cookie,
    test_execution: CheckSquare,
    file_data: FolderOpen,
    llm_ai: Sparkles,
    execution_interface: Terminal,
    flow_control: Settings2, // Added flow_control category
    default: Play,
};

// Node Type Icons (specific per node)
export const NODE_TYPE_ICONS = {
    // Browser Management
    launch_browser: Globe,
    open_url: Link2,
    close_browser: X,
    manage_tabs: Package,
    resize_viewport: Maximize2,
    go_back: ArrowLeft,
    go_forward: ArrowRight,

    // DOM Manipulation
    find_element: Search,
    get_set_content: FileText,
    wait_for_element: Eye,
    execute_js: Zap,

    // User Simulation
    click: MousePointerClick,
    type_text: Keyboard,
    select_option: ListIcon,
    submit_form: SendIcon,
    scroll: MoveVertical,
    drag_drop: MousePointer2,
    upload_file: Upload,

    // Synchronization
    wait_visible: Eye,
    wait_navigation: Clock,
    wait_conditional: Clock,
    wait_network: Network,

    // Diagnostics
    take_screenshot: ImageIcon,
    save_dom: Save,
    log_errors: AlertCircle,
    listen_events: Ear,

    // Network Control
    intercept_request: Shield,
    wait_for_response: Clock,
    wait_for_request: Clock,
    mock_response: RefreshCw,
    block_resource: Shield,
    modify_headers: Settings,
    set_network_conditions: Network,
    clear_all_mocks: Trash2,

    // Session Management
    manage_cookies: Cookie,
    manage_storage: Database,
    inject_tokens: Zap,
    persist_session: Save,

    // Test Execution
    create_context: Package,
    cleanup_state: Trash2,
    handle_hooks: Settings,
    control_exceptions: AlertCircle,

    // File & Data
    read_data: FileCode,
    save_results: Save,
    handle_downloads: CloudDownload,

    // LLM/AI
    call_llm: Sparkles,
    generate_data: Sparkles,
    validate_semantic: CheckSquare,

    // Execution Interface
    run_tests: Play,
    cli_params: Terminal,
    return_code: Terminal,
    integrate_ci: Settings,

    // Flow Control
    variable: Settings2,
};

/**
 * Get icon component for a node type
 * Falls back to category icon if specific icon not found
 */
export function getNodeIcon(nodeType, category) {
    return NODE_TYPE_ICONS[nodeType] || CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
}
