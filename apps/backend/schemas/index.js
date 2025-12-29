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
export { default as manageTabsBodySchema } from './manage_tabs/body.js';
export { default as backForwardBodySchema } from './back_forward/body.js';

// 🖱️ Interacción con Elementos
export { default as findElementBodySchema } from './find_element/body.js';
export { default as getSetContentBodySchema } from './get_set_content/body.js';
export { default as executeJsBodySchema } from './execute_js/body.js';
export { default as clickBodySchema } from './click/body.js';
export { default as typeTextBodySchema } from './type_text/body.js';
export { default as selectOptionBodySchema } from './select_option/body.js';
export { default as submitFormBodySchema } from './submit_form/body.js';
export { default as scrollBodySchema } from './scroll/body.js';
export { default as dragDropBodySchema } from './drag_drop/body.js';
export { default as uploadFileBodySchema } from './upload_file/body.js';
export { default as interactionBodySchema } from './interaction/body.js';

// ⏳ Waits (Espera)
export { default as waitForElementBodySchema } from './wait_for_element/body.js';
export { default as waitVisibleBodySchema } from './wait_visible/body.js';
export { default as waitNavigationBodySchema } from './wait_navigation/body.js';
export { default as waitNetworkBodySchema } from './wait_network/body.js';
export { default as waitConditionalBodySchema } from './wait_conditional/body.js';
// Nota: wait_fixed no estaba en el router final, pero lo incluimos si es necesario.
export { default as waitFixedBodySchema } from './wait_fixed/body.js';

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

// 🍪 Sesión y Contexto
export { default as manageCookiesBodySchema } from './manage_cookies/body.js';
export { default as manageStorageBodySchema } from './manage_storage/body.js';
export { default as injectTokensBodySchema } from './inject_tokens/body.js';
export { default as persistSessionBodySchema } from './persist_session/body.js';
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
export { default as runTestsBodySchema } from './run_tests/body.js';

// 🔀 Flow Control
export { default as variableBodySchema } from './variable/body.js';
export { default as conditionalBodySchema } from './conditional/body.js';
export { default as loopBodySchema } from './loop/body.js';
export { default as branchBodySchema } from './branch/body.js';
export { default as flowControlBodySchema } from './flow_control/body.js';
export { default as transformBodySchema } from './transform/body.js';
