// schemas/index.js (ARCHIVO DE AGREGACIÓN DE ESQUEMAS)

// ==========================================================
// 🚀 Exportación unificada de todos los Body Schemas
//    Importa el esquema 'body.js' de cada carpeta y lo re-exporta.
// ==========================================================

// 🛠️ Navegación y Entorno
export { default as launchBrowserBodySchema } from './launch_browser/body.js';
export { default as closeBrowserBodySchema } from './close_browser/body.js';
export { default as openUrlBodySchema } from './open_url/body.js';
export { default as resizeViewportBodySchema } from './resize_viewport/body.js';
export { default as browserDialogBodySchema } from './browser_dialog/body.js';
export { default as manageTabsBodySchema } from './manage_tabs/body.js';
export { default as backForwardBodySchema } from './back_forward/body.js';

// 🖱️ Interacción con Elementos
export { default as findElementBodySchema } from './find_element/body.js';
export { default as getSetContentBodySchema } from './get_set_content/body.js';
export { default as executeJsBodySchema } from './execute_js/body.js';
export { default as clickBodySchema } from './click/body.js';
export { default as typeTextBodySchema } from './type_text/body.js';
export { default as selectOptionBodySchema } from './select_option/body.js';
export { default as fillFormBodySchema } from './fill_form/body.js';

export { default as scrollBodySchema } from './scroll/body.js';
export { default as dragDropBodySchema } from './drag_drop/body.js';
export { default as uploadFileBodySchema } from './upload_file/body.js';
export { default as interactionBodySchema } from './interaction/body.js';
export { default as hoverBodySchema } from './hover/body.js';

// ⏳ Waits (Espera)
export { default as waitForElementBodySchema } from './wait_for_element/body.js';
export { default as waitVisibleBodySchema } from './wait_visible/body.js';
export { default as waitNavigationBodySchema } from './wait_navigation/body.js';
export { default as waitNetworkBodySchema } from './wait_network/body.js';
export { default as waitConditionalBodySchema } from './wait_conditional/body.js';
// Nota: wait_fixed no estaba en el router final, pero lo incluimos si es necesario.
export { default as waitFixedBodySchema } from './wait_fixed/body.js';
export { default as pauseBodySchema } from './pause/body.js';

// 📸 Captura, Logs y Reportes
export { default as takeScreenshotBodySchema } from './take_screenshot/body.js';
export { default as saveDomBodySchema } from './save_dom/body.js';
export { default as logErrorsBodySchema } from './log_errors/body.js';
export { default as listenEventsBodySchema } from './listen_events/body.js';
export { default as saveResultsBodySchema } from './save_results/body.js';

// 🌐 Network, Headers y Bloqueo
// 🌐 Network, Headers y Bloqueo
export { default as interceptRequestBodySchema } from './intercept_request/body.js';
export { default as mockResponseBodySchema } from './mock_response/body.js';
export { default as blockResourceBodySchema } from './block_resource/body.js';
export { default as modifyHeadersBodySchema } from './modify_headers/body.js';
export { default as waitForResponseBodySchema } from './wait_for_response/body.js';
export { default as waitForRequestBodySchema } from './wait_for_request/body.js';
export { default as setNetworkConditionsBodySchema } from './set_network_conditions/body.js';
export { default as clearAllMocksBodySchema } from './clear_all_mocks/body.js';
export { default as configureRouteBodySchema } from './configure_route/body.js';
export { default as waitNetworkMatchBodySchema } from './wait_network_match/body.js';

// 🍪 Sesión y Contexto
export { default as persistSessionBodySchema } from './persist_session/body.js';
export { default as manageSessionBodySchema } from './manage_session/body.js';
export { default as manageCookiesBodySchema } from './manage_cookies/body.js';
export { default as createContextBodySchema } from './create_context/body.js';
export { default as closeContextBodySchema } from './close_context/body.js';
export { default as cleanupStateBodySchema } from './cleanup_state/body.js';

// 🔧 Utilidades, Flujo y CI/CD
export { default as handleHooksBodySchema } from './handle_hooks/body.js';
export { default as controlExceptionsBodySchema } from './control_exceptions/body.js';
export { default as readDataBodySchema } from './read_data/body.js';
export { default as handleDownloadsBodySchema } from './handle_downloads/body.js';
export { default as cliParamsBodySchema } from './cli_params/body.js';
export { default as returnCodeBodySchema } from './return_code/body.js';
export { default as integrateCIBodySchema } from './integrate_ci/body.js';

// 🧠 LLM y Pruebas
export { default as callLlmBodySchema } from './call_llm/body.js';
export { default as generateDataBodySchema } from './generate_data/body.js';
export { default as validateSemanticBodySchema } from './validate_semantic/body.js';
export { default as extractDomContextBodySchema } from './extract_dom_context/body.js';
export { default as chainOfThoughtBodySchema } from './chain_of_thought/body.js';
export { default as smartSelectorBodySchema } from './smart_selector/body.js';
export { default as runTestsBodySchema } from './run_tests/body.js';

// 🔀 Flow Control
export { default as variableBodySchema } from './variable/body.js';
export { default as forEachBodySchema } from './for_each/body.js';
export { default as conditionalBodySchema } from './conditional/body.js';
export { default as loopBodySchema } from './loop/body.js';
export { default as branchBodySchema } from './branch/body.js';
export { default as flowControlBodySchema } from './flow_control/body.js';
export { default as transformBodySchema } from './transform/body.js';
export { default as switchBodySchema } from './switch/body.js';
export { default as backendJsBodySchema } from './backend_js/body.js';
export { default as failFlowBodySchema } from './fail_flow/body.js';
export { default as componentBodySchema } from './component/body.js';
export { default as inputBodySchema } from './input/body.js';
export { default as outputBodySchema } from './output/body.js';
export { default as assertPageTextBodySchema } from './assert_page_text/body.js';

// 🛡️ Security Observability Layer
export { default as cspValidatorBodySchema } from './csp_validator/body.js';
export { default as headerAuditorBodySchema } from './header_auditor/body.js';
export { default as domSanitizerBodySchema } from './dom_sanitizer/body.js';
export { default as auditPolicyBodySchema } from './audit_policy/body.js';
export { default as sensitiveDataMonitorBodySchema } from './sensitive_data_monitor/body.js';

// 📦 v2 Storage Schemas
export { default as flowV2BodySchema } from './flow_v2/body.js';
export { default as componentV1BodySchema } from './component_v1/body.js';
export { default as pageV1BodySchema } from './page_v1/body.js';
export { default as projectV2BodySchema } from './project_v2/body.js';
