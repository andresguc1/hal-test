import { detectOptionsScript } from './OptionDetector.js';
import {
    enrichDetectionResult,
    classifyOptionTypeRaw,
    calculateConfidence,
    buildRobustLocator,
    computeReliableState,
    determineGroupId,
    determineFinalGroupType,
    generateAnalysisNotes,
} from './ComponentClassifier.js';
import '../services/strategies/index.js';

/**
 * OptionDiscoveryService
 *
 * Servicio de descubrimiento de opciones de selección dentro de un contenedor.
 * Usa OptionDetector.js para detección bruta y ComponentClassifier para enriquecimiento.
 *
 * @typedef {('native_select' | 'native_select_multi' |
 *   'checkbox' | 'radio' | 'aria_option' | 'aria_checkbox' |
 *   'aria_radio' | 'list_item' | 'custom_component')} OptionType
 *
 * @typedef {Object} DetectedOption
 * @property {string} id
 * @property {OptionType} type
 * @property {string} label
 * @property {string|null} value
 * @property {boolean} selected
 * @property {boolean} checked
 * @property {boolean} enabled
 * @property {boolean} visible
 * @property {string} locator
 * @property {number} confidence
 * @property {string|null} groupId
 * @property {Object} actualState
 *
 * @typedef {Object} DiscoveryResult
 * @property {'select' | 'select-multi' | 'checkbox-group' | 'radio-group' | 'listbox' | 'combobox' | 'list' | 'unknown'} groupType
 * @property {DetectedOption[]} options
 * @property {string} containerSelector
 * @property {string[]} analysisNotes
 */

/**
 * Ejecuta el descubrimiento de opciones dentro de un container selector.
 *
 * @param {import('playwright').Page} page
 * @param {string} containerSelector
 * @param {Object} [options]
 * @param {number} [options.timeout=30000]
 * @returns {Promise<DiscoveryResult>}
 */
export async function discoverOptions(page, containerSelector, options = {}) {
    const _timeout = options.timeout || 30000;

    if (!page || page.isClosed()) {
        return {
            groupType: 'unknown',
            options: [],
            containerSelector,
            analysisNotes: [
                'No active page available for option detection.',
                'Verify the browser session is still running.',
            ],
        };
    }

    let rawResult;
    try {
        rawResult = await page.evaluate(detectOptionsScript, containerSelector);
    } catch (err) {
        return {
            groupType: 'unknown',
            options: [],
            containerSelector,
            analysisNotes: [`Error ejecutando el detector de opciones: ${err.message}`],
        };
    }

    if (!rawResult?.found || !rawResult.options?.length) {
        return {
            groupType: 'unknown',
            options: [],
            containerSelector,
            analysisNotes: [
                `No se detectaron opciones dentro de "${containerSelector}".`,
                'Verifique que el contenedor exponga controles de selección (checkbox, radio, select, list items).',
            ],
        };
    }

    const enriched = enrichDetectionResult(rawResult);

    return {
        groupType: enriched.groupType,
        options: enriched.options,
        containerSelector,
        analysisNotes: enriched.analysisNotes,
    };
}

/**
 * Detects options using a specific strategy (for combobox, custom components that need menu open).
 *
 * @param {import('playwright').Page} page
 * @param {string} containerSelector
 * @param {Object} options
 * @param {string} options.strategy - Strategy groupType to use for detection
 * @param {number} [options.timeout=30000]
 * @returns {Promise<DiscoveryResult>}
 */
export async function discoverOptionsWithStrategy(page, containerSelector, options = {}) {
    const { strategy, timeout = 30000 } = options;

    if (!page || page.isClosed()) {
        return {
            groupType: 'unknown',
            options: [],
            containerSelector,
            analysisNotes: ['No active page available for option detection.'],
        };
    }

    const { getStrategy } = await import('./InteractionStrategy.js');
    const strategyInstance = getStrategy(strategy);

    let rawResult;
    try {
        rawResult = await strategyInstance.detect(page, containerSelector, timeout);
    } catch (err) {
        return {
            groupType: 'unknown',
            options: [],
            containerSelector,
            analysisNotes: [
                `Error ejecutando detector de estrategia "${strategy}": ${err.message}`,
            ],
        };
    }

    if (!rawResult?.length) {
        return {
            groupType: 'unknown',
            options: [],
            containerSelector,
            analysisNotes: [`No options found with strategy "${strategy}".`],
        };
    }

    const rawResultObj = {
        found: true,
        groupType: strategy,
        options: rawResult,
    };

    const enriched = enrichDetectionResult(rawResultObj);

    return {
        groupType: enriched.groupType,
        options: enriched.options,
        containerSelector,
        analysisNotes: enriched.analysisNotes,
    };
}

export {
    classifyOptionTypeRaw,
    calculateConfidence,
    buildRobustLocator,
    computeReliableState,
    determineGroupId,
    determineFinalGroupType,
    generateAnalysisNotes,
    enrichDetectionResult,
    detectOptionsScript,
};
