// config/mockData.js
/**
 * Almacenamiento centralizado de todos los datos mock del framework (categorías,
 * esquemas de nodos y datos de proyecto simulados).
 */

// 1. Mock de Categorías
export const mockCategories = {
    browser_management: {
        label: 'Navegador',
        icon: '🌐',
        nodes: ['launch_browser', 'open_url', 'close_browser', 'manage_tabs', 'resize_viewport'],
    },
    dom_manipulation: {
        label: 'DOM',
        icon: '💻',
        nodes: ['find_element', 'get_set_content', 'wait_for_element', 'execute_js'],
    },
    user_simulation: {
        label: 'Interacción',
        icon: '👆',
        nodes: [
            'click',
            'type_text',
            'select_option',
            'submit_form',
            'scroll',
            'drag_drop',
            'upload_file',
        ],
    },
    synchronization: {
        label: 'Sincronización',
        icon: '⏱️',
        nodes: ['wait_visible', 'wait_navigation', 'wait_network', 'wait_conditional'],
    },
    diagnostics: {
        label: 'Diagnóstico',
        icon: '📷',
        nodes: ['take_screenshot', 'save_dom', 'log_errors', 'listen_events'],
    },
    network_control: {
        label: 'Red',
        icon: '🔌',
        nodes: ['intercept_request', 'mock_response', 'block_resource', 'modify_headers'],
    },
    session_management: {
        label: 'Sesión',
        icon: '🍪',
        nodes: ['manage_cookies', 'manage_storage', 'inject_tokens', 'persist_session'],
    },
    test_execution: {
        label: 'Contexto/Control',
        icon: '✅',
        nodes: ['create_context', 'cleanup_state', 'handle_hooks', 'control_exceptions'],
    },
    file_data: {
        label: 'Archivos/Datos',
        icon: '📁',
        nodes: ['read_data', 'save_results', 'handle_downloads'],
    },
    llm_ai: {
        label: 'Modelos de IA (LLM)',
        icon: '🧠',
        nodes: ['call_llm', 'generate_data', 'validate_semantic'],
    },
    execution_interface: {
        label: 'Ejecución',
        icon: '🖥️',
        nodes: ['run_tests', 'cli_params', 'return_code', 'integrate_ci'],
    },
};

// 2. Mock de Operaciones (Esquema JSON COMPLETO de campos de entrada para cada nodo)
// Nota: Contiene solo los nodos que tenías implementados parcialmente
export const allNodeFieldConfigs = {
    // --- BROWSER MANAGEMENT ---
    launch_browser: [
        /* ... configuración de launch_browser ... */
    ],
    close_browser: [
        /* ... configuración de close_browser ... */
    ],
    open_url: [
        /* ... configuración de open_url ... */
    ],
    resize_viewport: [
        /* ... configuración de resize_viewport ... */
    ],

    // --- USER SIMULATION ---
    click: [
        /* ... configuración de click ... */
    ],
    type_text: [
        /* ... configuración de type_text ... */
    ],
    select_option: [
        /* ... configuración de select_option ... */
    ],
    submit_form: [
        /* ... configuración de submit_form ... */
    ],
    scroll: [
        /* ... configuración de scroll ... */
    ],
    drag_drop: [
        /* ... configuración de drag_drop ... */
    ],
    upload_file: [
        /* ... configuración de upload_file ... */
    ],

    // --- SYNCHRONIZATION ---
    wait_conditional: [
        /* ... configuración de wait_conditional ... */
    ],
    wait_visible: [
        /* ... configuración de wait_visible ... */
    ],
    wait_navigation: [
        /* ... configuración de wait_navigation ... */
    ],
    wait_network: [
        /* ... configuración de wait_network ... */
    ],

    // --- DIAGNOSTICS ---
    take_screenshot: [
        /* ... configuración de take_screenshot ... */
    ],
    save_dom: [
        /* ... configuración de save_dom ... */
    ],
    log_errors: [
        /* ... configuración de log_errors ... */
    ],
    listen_events: [
        /* ... configuración de listen_events ... */
    ],

    // --- NETWORK CONTROL ---
    intercept_request: [
        /* ... configuración de intercept_request ... */
    ],
    mock_response: [
        /* ... configuración de mock_response ... */
    ],

    // ... Todos los demás nodos del archivo original ...
};

// 3. Mock de Datos de Proyecto Guardado
export const mockProjectData = {
    projectId: 'PRJ-42',
    projectName: 'Flujo de Login y Compra',
    description:
        'Simulación de usuario navegando, iniciando sesión y agregando un producto al carrito.',
    nodes: [
        {
            id: 'n1',
            type: 'launch_browser',
            data: { browser: 'chromium', headless: true },
            position: { x: 50, y: 50 },
        },
        {
            id: 'n2',
            type: 'open_url',
            data: { url: 'https://ejemplo.com/login', timeout: 45000 },
            position: { x: 50, y: 150 },
        },
        {
            id: 'n3',
            type: 'type_text',
            data: { selector: '#username', text: 'testuser' },
            position: { x: 250, y: 150 },
        },
        {
            id: 'n4',
            type: 'click',
            data: { selector: 'button[type="submit"]' },
            position: { x: 250, y: 250 },
        },
    ],
    edges: [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-4', source: 'n3', target: 'n4' },
    ],
};
